from datetime import UTC, date, datetime, time
from uuid import uuid4

import pytest
import sqlalchemy as sa
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.seed import seed_demo_data
from app.models import Destination, ItineraryItem, User, Wallet
from app.schemas.itinerary import ItineraryCreate
from app.services.itinerary_service import ItineraryService
from tests.conftest import migrate

API = "/api/v1/itineraries"


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def test_new_stop_limits(client: TestClient, payload: dict) -> None:
    payload["stops"] = [{"place_id": "cham", "start": "09:00", "end": "09:29"}]
    assert client.post(API, json=payload).status_code == 422
    payload["stops"][0]["end"] = "09:30"
    assert client.post(API, json=payload).status_code == 201
    payload["stops"] *= 9
    assert client.post(API, json=payload).status_code == 422


def test_unknown_destination_is_rejected(client: TestClient, payload: dict) -> None:
    payload["stops"][0]["place_id"] = "not-a-destination"
    assert client.post(API, json=payload).status_code == 422
    assert client.get(API).json() == []


def test_version_conflict_keeps_latest_data(client: TestClient, payload: dict) -> None:
    itinerary = client.post(API, json=payload).json()
    response = client.patch(
        f"{API}/{itinerary['id']}", json={"title": "New title", "version": itinerary["version"]}
    )
    assert response.status_code == 200
    assert response.json()["version"] == itinerary["version"] + 1
    stale = client.patch(
        f"{API}/{itinerary['id']}", json={"title": "Stale title", "version": itinerary["version"]}
    )
    assert stale.status_code == 409
    assert client.get(f"{API}/{itinerary['id']}").json()["title"] == "New title"
    assert client.patch(f"{API}/{itinerary['id']}", json={"version": 2}).status_code == 422


def test_dates_are_converted_to_utc_and_shift_on_update(
    client: TestClient, payload: dict, db_engine: Engine
) -> None:
    payload["duration"] = 2
    payload["stops"] = [
        {"place_id": "cham", "day": 1, "start": "06:00", "end": "07:00"},
        {"place_id": "cham", "day": 2, "start": "06:00", "end": "07:00"},
    ]
    itinerary = client.post(API, json=payload).json()
    assert itinerary["stops"] == payload["stops"]
    with db_engine.connect() as connection:
        start = connection.scalar(
            sa.select(ItineraryItem.planned_start_at).order_by(ItineraryItem.position).limit(1)
        )
        assert as_utc(start) == datetime(2026, 11, 14, 23, tzinfo=UTC)
    updated = client.patch(f"{API}/{itinerary['id']}", json={"date": "2026-11-20"})
    assert updated.status_code == 200
    assert updated.json()["date"] == "2026-11-20"
    assert updated.json()["stops"] == payload["stops"]
    with db_engine.connect() as connection:
        start = connection.scalar(
            sa.select(ItineraryItem.planned_start_at).order_by(ItineraryItem.position).limit(1)
        )
        assert as_utc(start) == datetime(2026, 11, 19, 23, tzinfo=UTC)


def test_owner_filter(client: TestClient, payload: dict, db_engine: Engine) -> None:
    with Session(db_engine, expire_on_commit=False) as session:
        with session.begin():
            session.add(User(uid="another-user", display_name="Another user"))
        other = ItineraryService(session, owner_uid="another-user").create(
            ItineraryCreate(**payload)
        )
    assert client.get(API).json() == []
    assert client.get(f"{API}/{other.id}").status_code == 404
    assert client.delete(f"{API}/{other.id}").status_code == 404


def test_seed_is_idempotent_and_wallet_cannot_be_negative(db_engine: Engine) -> None:
    with Session(db_engine) as session:
        with session.begin():
            seed_demo_data(session)
            seed_demo_data(session)
        assert session.scalar(sa.select(sa.func.count()).select_from(Destination)) == 8
        session.rollback()
        with pytest.raises(IntegrityError), session.begin():
            session.add(Wallet(user_uid="demo-user", balance_points=-1))


def test_0001_data_survives_upgrade_and_supported_downgrade(db_engine: Engine) -> None:
    migrate(db_engine, "0001", downgrade=True)
    metadata = sa.MetaData()
    old_itineraries = sa.Table("trips", metadata, autoload_with=db_engine)
    old_stops = sa.Table("trip_stops", metadata, autoload_with=db_engine)
    old_itineraries.c.id.type = sa.Uuid()
    old_stops.c.trip_id.type = sa.Uuid()
    itinerary_id = uuid4()
    with db_engine.begin() as connection:
        connection.execute(
            old_itineraries.insert(),
            {
                "id": itinerary_id,
                "title": "Long legacy title " * 8,
                "date": date(2026, 11, 15),
                "duration": 2,
                "pace": "Thư thả",
                "created_at": datetime(2026, 11, 12, 5, tzinfo=UTC),
                "updated_at": datetime(2026, 11, 12, 6, tzinfo=UTC),
            },
        )
        for index in range(9):
            connection.execute(
                old_stops.insert(),
                {
                    "id": index + 10,
                    "trip_id": itinerary_id,
                    "place_id": "legacy-place",
                    "day": 2,
                    "position": index,
                    "start": time(6 + index, 0),
                    "end": time(6 + index, 15),
                },
            )
    migrate(db_engine)
    assert not {"trips", "trip_stops", "quizzes_quizzes"} & set(
        sa.inspect(db_engine).get_table_names()
    )
    with Session(db_engine) as session:
        restored = ItineraryService(session).list(offset=0, limit=10)[0]
        assert restored.title == "Long legacy title " * 8
        assert len(restored.stops) == 9
        assert all(stop.day == 2 and stop.place_id == "legacy-place" for stop in restored.stops)
        assert restored.stops[0].start == time(6, 0)
        assert restored.stops[0].end == time(6, 15)
        assert as_utc(restored.created_at) == datetime(2026, 11, 12, 5, tzinfo=UTC)
    migrate(db_engine, "0001", downgrade=True)
    with db_engine.connect() as connection:
        assert connection.scalar(sa.select(sa.func.count()).select_from(old_itineraries)) == 1
        assert connection.scalar(sa.select(sa.func.count()).select_from(old_stops)) == 9
        restored_stop = connection.execute(
            sa.select(old_stops).order_by(old_stops.c.position)
        ).first()
        assert restored_stop.place_id == "legacy-place"
        assert restored_stop.day == 2
        assert restored_stop.start == time(6, 0)
    migrate(db_engine)


def test_downgrade_refuses_to_discard_new_feature_data(db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        session.add(Wallet(user_uid="demo-user", balance_points=0))
    with pytest.raises(RuntimeError, match="wallets contains data"):
        migrate(db_engine, "0001", downgrade=True)
    tables = set(sa.inspect(db_engine).get_table_names())
    assert "itineraries" in tables and "trips" not in tables


def test_downgrade_protects_destination_details(db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        destination = session.scalar(sa.select(Destination).where(Destination.slug == "cham"))
        destination.address = "Updated address"
    with pytest.raises(RuntimeError, match="catalog information"):
        migrate(db_engine, "0001", downgrade=True)
    assert "destinations" in sa.inspect(db_engine).get_table_names()
