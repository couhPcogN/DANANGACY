from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import InvalidScheduleError, ItineraryConflictError, ItineraryNotFoundError
from app.core.itinerary_rules import APP_TIMEZONE, DEMO_USER_UID, MIN_VISIT_MINUTES
from app.models import Destination, Itinerary, ItineraryItem
from app.repositories.itinerary_repository import ItineraryRepository
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryRead,
    ItineraryStopCreate,
    ItineraryStopRead,
    ItineraryUpdate,
)


def validate_schedule(stops: list[ItineraryStopCreate], duration: int) -> None:
    previous_day = 0
    previous_end = ""
    for stop in sorted(stops, key=lambda item: (item.day, item.start)):
        if stop.day > duration:
            raise InvalidScheduleError("Ngày của điểm dừng vượt quá thời lượng lịch trình.")
        if stop.start >= stop.end:
            raise InvalidScheduleError("Giờ bắt đầu phải sớm hơn giờ kết thúc.")
        start = time.fromisoformat(stop.start)
        end = time.fromisoformat(stop.end)
        minutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
        if minutes < MIN_VISIT_MINUTES:
            raise InvalidScheduleError("Mỗi điểm dừng phải có thời lượng ít nhất 30 phút.")
        if stop.start < "06:00" or stop.end > "22:00":
            raise InvalidScheduleError("Giờ tham quan phải nằm trong khoảng 06:00–22:00.")
        if stop.day == previous_day and stop.start < previous_end:
            raise InvalidScheduleError("Các điểm dừng trong cùng ngày không được trùng giờ.")
        previous_day, previous_end = stop.day, stop.end


def local_datetime(value: datetime) -> datetime:
    # SQLite does not retain timezone information; values are always stored as UTC.
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(APP_TIMEZONE)


def to_itinerary_read(itinerary: Itinerary) -> ItineraryRead:
    stops = []
    for item in itinerary.items:
        start, end = local_datetime(item.planned_start_at), local_datetime(item.planned_end_at)
        stops.append(
            ItineraryStopRead(
                place_id=item.destination.slug,
                day=(start.date() - itinerary.visit_date).days + 1,
                start=start.time(),
                end=end.time(),
            )
        )
    return ItineraryRead(
        id=itinerary.id,
        title=itinerary.title,
        date=itinerary.visit_date,
        duration=itinerary.duration,
        pace=itinerary.pace,
        stops=stops,
        created_at=itinerary.created_at,
        updated_at=itinerary.updated_at,
        version=itinerary.version,
    )


def build_items(
    payload: ItineraryCreate, destinations: dict[str, Destination]
) -> list[ItineraryItem]:
    items = []
    for position, stop in enumerate(payload.stops):
        day = payload.date + timedelta(days=stop.day - 1)
        start = datetime.combine(day, time.fromisoformat(stop.start), tzinfo=APP_TIMEZONE)
        end = datetime.combine(day, time.fromisoformat(stop.end), tzinfo=APP_TIMEZONE)
        items.append(
            ItineraryItem(
                destination=destinations[stop.place_id],
                position=position,
                planned_start_at=start.astimezone(UTC),
                planned_end_at=end.astimezone(UTC),
            )
        )
    return items


class ItineraryService:
    def __init__(self, session: Session, owner_uid: str = DEMO_USER_UID) -> None:
        self.session = session
        self.repository = ItineraryRepository(session, owner_uid)
        self.owner_uid = owner_uid

    def list(self, *, offset: int, limit: int) -> list[ItineraryRead]:
        return [
            to_itinerary_read(itinerary)
            for itinerary in self.repository.list(offset=offset, limit=limit)
        ]

    def get(self, itinerary_id: UUID) -> ItineraryRead:
        return to_itinerary_read(self._get_or_raise(itinerary_id))

    def create(self, payload: ItineraryCreate) -> ItineraryRead:
        validate_schedule(payload.stops, payload.duration)
        with self.session.begin():
            destinations = self._destinations(payload.stops)
            itinerary = Itinerary(
                owner_uid=self.owner_uid,
                title=payload.title,
                visit_date=payload.date,
                duration=payload.duration,
                pace=payload.pace,
                status="SAVED",
                items=build_items(payload, destinations),
            )
            self.repository.add(itinerary)
            self.session.flush()
            result = to_itinerary_read(itinerary)
        return result

    def update(self, itinerary_id: UUID, payload: ItineraryUpdate) -> ItineraryRead:
        with self.session.begin():
            itinerary = self._get_or_raise(itinerary_id, for_update=True)
            changes = payload.model_dump(exclude_unset=True)
            expected_version = changes.pop("version", None)
            if expected_version is not None and expected_version != itinerary.version:
                raise ItineraryConflictError("Lịch trình đã thay đổi. Hãy tải lại trước khi sửa.")
            existing = to_itinerary_read(itinerary).model_dump(
                exclude={"id", "created_at", "updated_at", "version"}
            )
            # Older records can exceed new limits; a client must correct them before saving.
            try:
                merged = ItineraryCreate.model_validate({**existing, **changes})
            except ValidationError as exc:
                raise InvalidScheduleError(
                    "Lịch trình phải có 1–8 điểm và tuân thủ định dạng dữ liệu mới."
                ) from exc
            validate_schedule(merged.stops, merged.duration)
            destinations = self._destinations(merged.stops)

            for field in ("title", "duration", "pace"):
                if field in changes:
                    setattr(itinerary, field, getattr(merged, field))
            if "date" in changes:
                itinerary.visit_date = merged.date
            if {"stops", "date"} & changes.keys():
                # Flush deletes before reusing unique positions, still within one transaction.
                itinerary.items.clear()
                self.session.flush()
                itinerary.items.extend(build_items(merged, destinations))
            itinerary.version += 1
            itinerary.updated_at = func.now()
            self.session.flush()
            self.session.refresh(itinerary)
            result = to_itinerary_read(itinerary)
        return result

    def delete(self, itinerary_id: UUID) -> None:
        with self.session.begin():
            itinerary = self._get_or_raise(itinerary_id, for_update=True)
            itinerary.deleted_at = func.now()
            itinerary.updated_at = func.now()
            itinerary.version += 1

    def _get_or_raise(self, itinerary_id: UUID, *, for_update: bool = False) -> Itinerary:
        itinerary = self.repository.get(itinerary_id, for_update=for_update)
        if itinerary is None:
            raise ItineraryNotFoundError()
        return itinerary

    def _destinations(self, stops: list[ItineraryStopCreate]) -> dict[str, Destination]:
        slugs = {stop.place_id for stop in stops}
        destinations = self.repository.destinations(slugs)
        if slugs - destinations.keys():
            raise InvalidScheduleError("Một hoặc nhiều mã địa điểm không tồn tại.")
        if any(destination.status == "ARCHIVED" for destination in destinations.values()):
            raise InvalidScheduleError("Lịch trình chứa địa điểm đã ngừng sử dụng.")
        return destinations
