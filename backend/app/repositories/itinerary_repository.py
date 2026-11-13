from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Destination, Itinerary, ItineraryItem


class ItineraryRepository:
    def __init__(self, session: Session, owner_uid: str) -> None:
        self.session = session
        self.owner_uid = owner_uid

    def _query(self):
        return (
            select(Itinerary)
            .where(Itinerary.owner_uid == self.owner_uid, Itinerary.deleted_at.is_(None))
            .options(selectinload(Itinerary.items).selectinload(ItineraryItem.destination))
        )

    def list(self, *, offset: int, limit: int) -> list[Itinerary]:
        statement = (
            self._query()
            .order_by(Itinerary.created_at.desc(), Itinerary.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.scalars(statement))

    def get(self, itinerary_id: int, *, for_update: bool = False) -> Itinerary | None:
        statement = self._query().where(Itinerary.id == itinerary_id)
        if for_update:
            statement = statement.with_for_update()
        return self.session.scalar(statement)

    def destinations(self, slugs: set[str]) -> dict[str, Destination]:
        records = self.session.scalars(select(Destination).where(Destination.slug.in_(slugs)))
        return {destination.slug: destination for destination in records}

    def add(self, itinerary: Itinerary) -> None:
        self.session.add(itinerary)
