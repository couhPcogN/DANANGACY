import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from app.models import Itinerary, ItineraryItem

API = "/api/v1/itineraries"


def test_create_list_and_get_are_persisted(client: TestClient, payload: dict) -> None:
    response = client.post(API, json=payload)
    assert response.status_code == 201
    itinerary = response.json()
    assert isinstance(itinerary["id"], int)
    assert itinerary["id"] > 0
    assert itinerary["title"] == payload["title"]
    assert itinerary["stops"] == payload["stops"]
    assert itinerary["created_at"]
    assert client.get(f"{API}/{itinerary['id']}").json() == itinerary
    assert client.get(API).json() == [itinerary]
    assert client.get(API, params={"offset": 1, "limit": 1}).json() == []


def test_patch_preserves_unspecified_fields(client: TestClient, payload: dict) -> None:
    itinerary = client.post(API, json=payload).json()
    response = client.patch(f"{API}/{itinerary['id']}", json={"title": "  Lịch trình đã sửa  "})
    assert response.status_code == 200
    saved = client.get(f"{API}/{itinerary['id']}").json()
    assert saved["title"] == "Lịch trình đã sửa"
    for field in ("id", "date", "duration", "pace", "stops", "created_at"):
        assert saved[field] == itinerary[field]


def test_patch_replaces_stops_in_order(client: TestClient, payload: dict) -> None:
    itinerary = client.post(API, json=payload).json()
    stops = [
        {"place_id": "cau-rong", "day": 1, "start": "17:00", "end": "18:00"},
        {"place_id": "cham", "day": 1, "start": "08:00", "end": "09:00"},
    ]
    response = client.patch(f"{API}/{itinerary['id']}", json={"stops": stops})
    assert response.status_code == 200
    assert client.get(f"{API}/{itinerary['id']}").json()["stops"] == stops


def test_delete_hides_itinerary_and_preserves_history(
    client: TestClient, payload: dict, db_engine: Engine
) -> None:
    itinerary = client.post(API, json=payload).json()
    response = client.delete(f"{API}/{itinerary['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"{API}/{itinerary['id']}").status_code == 404
    with db_engine.connect() as connection:
        assert connection.scalar(select(func.count()).select_from(Itinerary)) == 1
        assert connection.scalar(select(func.count()).select_from(ItineraryItem)) == 2
        assert connection.scalar(select(Itinerary.deleted_at)) is not None
    assert client.get(API).json() == []


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_missing_itinerary_returns_404(client: TestClient, method: str) -> None:
    arguments = {"json": {"title": "Tên mới"}} if method == "patch" else {}
    assert getattr(client, method)(f"{API}/{2147483647}", **arguments).status_code == 404


@pytest.mark.parametrize(
    "changes",
    [
        {"title": "   "},
        {"date": "15/11/2026"},
        {"date": "2026-02-30"},
        {"duration": 0},
        {"duration": 4},
        {"pace": "khong-hop-le"},
        {"stops": []},
        {"unknown": True},
    ],
)
def test_invalid_create_does_not_write(client: TestClient, payload: dict, changes: dict) -> None:
    assert client.post(API, json={**payload, **changes}).status_code == 422
    assert client.get(API).json() == []


@pytest.mark.parametrize(
    "stop",
    [
        {"start": "10:00", "end": "09:00"},
        {"start": "09:00", "end": "09:00"},
        {"start": "05:59", "end": "08:00"},
        {"start": "21:00", "end": "22:01"},
        {"start": "9:00", "end": "10:00"},
        {"start": "24:00", "end": "25:00"},
        {"start": "09:00:30", "end": "10:00"},
        {"day": 2, "start": "09:00", "end": "10:00"},
    ],
)
def test_invalid_stop_is_rejected(client: TestClient, payload: dict, stop: dict) -> None:
    payload["stops"] = [{"place_id": "cham", **stop}]
    assert client.post(API, json=payload).status_code == 422
    assert client.get(API).json() == []


def test_overlapping_update_keeps_original_itinerary(client: TestClient, payload: dict) -> None:
    itinerary = client.post(API, json=payload).json()
    stops = [*payload["stops"], {"place_id": "other", "start": "09:30", "end": "10:00"}]
    response = client.patch(
        f"{API}/{itinerary['id']}", json={"title": "Không được lưu", "stops": stops}
    )
    assert response.status_code == 422
    assert client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_adjacent_times_and_same_time_on_different_days_are_allowed(
    client: TestClient, payload: dict
) -> None:
    payload["duration"] = 2
    payload["stops"] = [
        {"place_id": "cham", "day": 1, "start": "06:00", "end": "09:00"},
        {"place_id": "son-tra", "day": 1, "start": "09:00", "end": "22:00"},
        {"place_id": "cham", "day": 2, "start": "09:00", "end": "10:00"},
    ]
    response = client.post(API, json=payload)
    assert response.status_code == 201
    itinerary_id = response.json()["id"]
    assert client.patch(f"{API}/{itinerary_id}", json={"duration": 1}).status_code == 422
    assert client.get(f"{API}/{itinerary_id}").json()["duration"] == 2


@pytest.mark.parametrize("patch", [{}, {"title": None}, {"stops": None}, {"unknown": 1}])
def test_empty_or_null_patch_is_rejected(client: TestClient, payload: dict, patch: dict) -> None:
    itinerary = client.post(API, json=payload).json()
    assert client.patch(f"{API}/{itinerary['id']}", json=patch).status_code == 422
    assert client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_database_failure_rolls_back_deleted_stops(client: TestClient, payload: dict) -> None:
    itinerary = client.post(API, json=payload).json()

    def fail_insert(_mapper, _connection, _target) -> None:
        raise IntegrityError("simulated constraint failure", {}, ValueError("test"))

    event.listen(ItineraryItem, "before_insert", fail_insert)
    try:
        response = client.patch(
            f"{API}/{itinerary['id']}",
            json={"title": "Không được lưu", "stops": payload["stops"]},
        )
    finally:
        event.remove(ItineraryItem, "before_insert", fail_insert)
    assert response.status_code == 409
    assert client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_invalid_identifier_and_pagination(client: TestClient) -> None:
    assert client.get(f"{API}/not-an-integer").status_code == 422
    assert client.get(API, params={"limit": 101}).status_code == 422
    assert client.get(API, params={"offset": -1}).status_code == 422
