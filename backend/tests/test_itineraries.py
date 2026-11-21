import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import create_access_token
from app.models import Itinerary, ItineraryItem

API = "/api/v1/itineraries"


def test_create_list_and_get_are_persisted(auth_client: TestClient, payload: dict) -> None:
    response = auth_client.post(API, json=payload)
    assert response.status_code == 201
    itinerary = response.json()
    assert isinstance(itinerary["id"], int)
    assert itinerary["id"] > 0
    assert itinerary["title"] == payload["title"]
    assert itinerary["stops"] == payload["stops"]
    assert itinerary["created_at"]
    assert auth_client.get(f"{API}/{itinerary['id']}").json() == itinerary
    assert auth_client.get(API).json() == [itinerary]
    assert auth_client.get(API, params={"offset": 1, "limit": 1}).json() == []


def test_patch_preserves_unspecified_fields(auth_client: TestClient, payload: dict) -> None:
    itinerary = auth_client.post(API, json=payload).json()
    response = auth_client.patch(
        f"{API}/{itinerary['id']}", json={"title": "  Lịch trình đã sửa  "}
    )
    assert response.status_code == 200
    saved = auth_client.get(f"{API}/{itinerary['id']}").json()
    assert saved["title"] == "Lịch trình đã sửa"
    for field in ("id", "date", "duration", "pace", "stops", "created_at"):
        assert saved[field] == itinerary[field]


def test_patch_replaces_stops_in_order(auth_client: TestClient, payload: dict) -> None:
    itinerary = auth_client.post(API, json=payload).json()
    stops = [
        {"place_id": "cau-rong", "day": 1, "start": "17:00", "end": "18:00"},
        {"place_id": "cham", "day": 1, "start": "08:00", "end": "09:00"},
    ]
    response = auth_client.patch(f"{API}/{itinerary['id']}", json={"stops": stops})
    assert response.status_code == 200
    assert auth_client.get(f"{API}/{itinerary['id']}").json()["stops"] == stops


def test_delete_hides_itinerary_and_preserves_history(
    auth_client: TestClient, payload: dict, db_engine: Engine
) -> None:
    itinerary = auth_client.post(API, json=payload).json()
    response = auth_client.delete(f"{API}/{itinerary['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert auth_client.get(f"{API}/{itinerary['id']}").status_code == 404
    with db_engine.connect() as connection:
        assert connection.scalar(select(func.count()).select_from(Itinerary)) == 1
        assert connection.scalar(select(func.count()).select_from(ItineraryItem)) == 2
        assert connection.scalar(select(Itinerary.deleted_at)) is not None
    assert auth_client.get(API).json() == []


@pytest.mark.parametrize("method", ["get", "patch", "delete"])
def test_missing_itinerary_returns_404(auth_client: TestClient, method: str) -> None:
    arguments = {"json": {"title": "Tên mới"}} if method == "patch" else {}
    assert getattr(auth_client, method)(f"{API}/{2147483647}", **arguments).status_code == 404


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
def test_invalid_create_does_not_write(
    auth_client: TestClient, payload: dict, changes: dict
) -> None:
    assert auth_client.post(API, json={**payload, **changes}).status_code == 422
    assert auth_client.get(API).json() == []


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
def test_invalid_stop_is_rejected(auth_client: TestClient, payload: dict, stop: dict) -> None:
    payload["stops"] = [{"place_id": "cham", **stop}]
    assert auth_client.post(API, json=payload).status_code == 422
    assert auth_client.get(API).json() == []


def test_overlapping_update_keeps_original_itinerary(
    auth_client: TestClient, payload: dict
) -> None:
    itinerary = auth_client.post(API, json=payload).json()
    stops = [*payload["stops"], {"place_id": "other", "start": "09:30", "end": "10:00"}]
    response = auth_client.patch(
        f"{API}/{itinerary['id']}", json={"title": "Không được lưu", "stops": stops}
    )
    assert response.status_code == 422
    assert auth_client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_adjacent_times_and_same_time_on_different_days_are_allowed(
    auth_client: TestClient, payload: dict
) -> None:
    payload["duration"] = 2
    payload["stops"] = [
        {"place_id": "cham", "day": 1, "start": "06:00", "end": "09:00"},
        {"place_id": "son-tra", "day": 1, "start": "09:00", "end": "22:00"},
        {"place_id": "cham", "day": 2, "start": "09:00", "end": "10:00"},
    ]
    response = auth_client.post(API, json=payload)
    assert response.status_code == 201
    itinerary_id = response.json()["id"]
    assert auth_client.patch(f"{API}/{itinerary_id}", json={"duration": 1}).status_code == 422
    assert auth_client.get(f"{API}/{itinerary_id}").json()["duration"] == 2


@pytest.mark.parametrize("patch", [{}, {"title": None}, {"stops": None}, {"unknown": 1}])
def test_empty_or_null_patch_is_rejected(
    auth_client: TestClient, payload: dict, patch: dict
) -> None:
    itinerary = auth_client.post(API, json=payload).json()
    assert auth_client.patch(f"{API}/{itinerary['id']}", json=patch).status_code == 422
    assert auth_client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_database_failure_rolls_back_deleted_stops(auth_client: TestClient, payload: dict) -> None:
    itinerary = auth_client.post(API, json=payload).json()

    def fail_insert(_mapper, _connection, _target) -> None:
        raise IntegrityError("simulated constraint failure", {}, ValueError("test"))

    event.listen(ItineraryItem, "before_insert", fail_insert)
    try:
        response = auth_client.patch(
            f"{API}/{itinerary['id']}",
            json={"title": "Không được lưu", "stops": payload["stops"]},
        )
    finally:
        event.remove(ItineraryItem, "before_insert", fail_insert)
    assert response.status_code == 409
    assert auth_client.get(f"{API}/{itinerary['id']}").json() == itinerary


def test_invalid_identifier_and_pagination(auth_client: TestClient) -> None:
    assert auth_client.get(f"{API}/not-an-integer").status_code == 422
    assert auth_client.get(API, params={"limit": 101}).status_code == 422
    assert auth_client.get(API, params={"offset": -1}).status_code == 422


# ---------------------------------------------------------------------------
# Wave 1C Phase 1: Security, Authorization & API Contract Regression Tests
# ---------------------------------------------------------------------------


def test_unauthenticated_mutating_requests_rejected(client: TestClient, payload: dict) -> None:
    """Guest without Authorization header is rejected on POST, PATCH, DELETE with 401."""
    res_post = client.post(API, json=payload)
    assert res_post.status_code == 401
    assert res_post.json()["detail"] == "Yêu cầu đăng nhập để thực hiện thao tác này."

    res_patch = client.patch(f"{API}/1", json={"title": "Tiêu đề mới"})
    assert res_patch.status_code == 401
    assert res_patch.json()["detail"] == "Yêu cầu đăng nhập để thực hiện thao tác này."

    res_delete = client.delete(f"{API}/1")
    assert res_delete.status_code == 401
    assert res_delete.json()["detail"] == "Yêu cầu đăng nhập để thực hiện thao tác này."


def test_invalid_and_malformed_auth_headers_rejected(client: TestClient, payload: dict) -> None:
    """Non-Bearer scheme, empty token, corrupted JWT, or expired JWT are rejected with 401."""
    # 1. Non-Bearer scheme
    res_basic = client.post(API, json=payload, headers={"Authorization": "Basic 12345"})
    assert res_basic.status_code == 401
    assert "Authorization header phải có định dạng 'Bearer <token>'." in res_basic.json()["detail"]

    # 2. Empty token after Bearer
    res_empty = client.post(API, json=payload, headers={"Authorization": "Bearer   "})
    assert res_empty.status_code == 401
    assert "Authorization header phải có định dạng 'Bearer <token>'." in res_empty.json()["detail"]

    # 3. Corrupted or invalid JWT
    res_bad = client.post(API, json=payload, headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res_bad.status_code == 401
    assert "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." in res_bad.json()["detail"]

    # 4. Expired token (issued at timestamp 1000)
    settings = get_settings()
    expired_token = create_access_token("any_user", settings, now=1000)
    res_expired = client.post(
        API, json=payload, headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401
    assert "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." in res_expired.json()["detail"]


def test_unauthenticated_get_allowed_read_only(client: TestClient) -> None:
    """Guest without Authorization header can read itineraries in read-only mode."""
    res = client.get(API)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    res_missing = client.get(f"{API}/999999")
    assert res_missing.status_code == 404


def test_authenticated_user_lifecycle_with_jwt(client: TestClient, payload: dict) -> None:
    """Authenticated user registers, creates, reads, updates, and deletes their itinerary."""
    register_res = client.post(
        "/api/auth/register",
        json={
            "email": "lifecycle.user@danangacy.vn",
            "password": "SecurePassword123!",
            "display_name": "Lifecycle Tester",
        },
    )
    assert register_res.status_code == 201
    token = register_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. POST -> 201 Created, version = 1, integer ID
    create_res = client.post(API, json=payload, headers=headers)
    assert create_res.status_code == 201
    created = create_res.json()
    assert isinstance(created["id"], int)
    assert created["id"] > 0
    assert created["version"] == 1
    itinerary_id = created["id"]

    # 2. GET list and GET by ID
    list_res = client.get(API, headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    get_res = client.get(f"{API}/{itinerary_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == payload["title"]

    # 3. PATCH with matching version -> 200 OK, version becomes 2
    patch_res = client.patch(
        f"{API}/{itinerary_id}",
        json={"title": "Lịch trình đã cập nhật", "version": 1},
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["title"] == "Lịch trình đã cập nhật"
    assert updated["version"] == 2

    # 4. DELETE -> 204 No Content
    delete_res = client.delete(f"{API}/{itinerary_id}", headers=headers)
    assert delete_res.status_code == 204
    assert delete_res.content == b""

    # 5. Subsequent GET -> 404 Not Found
    assert client.get(f"{API}/{itinerary_id}", headers=headers).status_code == 404


def test_cross_user_isolation_strictly_enforced(client: TestClient, payload: dict) -> None:
    """User B and Guest cannot access, mutate, or delete User A's itinerary (404/401)."""
    # Register User A
    res_a = client.post(
        "/api/auth/register",
        json={"email": "usera.iso@danangacy.vn", "password": "Password123!", "display_name": "A"},
    ).json()
    headers_a = {"Authorization": f"Bearer {res_a['access_token']}"}

    # Register User B
    res_b = client.post(
        "/api/auth/register",
        json={"email": "userb.iso@danangacy.vn", "password": "Password123!", "display_name": "B"},
    ).json()
    headers_b = {"Authorization": f"Bearer {res_b['access_token']}"}

    # User A creates itinerary
    itinerary_a = client.post(API, json=payload, headers=headers_a).json()
    id_a = itinerary_a["id"]

    # User B tries GET -> 404
    assert client.get(f"{API}/{id_a}", headers=headers_b).status_code == 404
    assert client.get(API, headers=headers_b).json() == []

    # User B tries PATCH -> 404
    patch_b = client.patch(
        f"{API}/{id_a}", json={"title": "B tấn công A", "version": 1}, headers=headers_b
    )
    assert patch_b.status_code == 404

    # User B tries DELETE -> 404
    assert client.delete(f"{API}/{id_a}", headers=headers_b).status_code == 404

    # Guest tries GET -> 404 (Guest sees only demo-user, not User A)
    assert client.get(f"{API}/{id_a}").status_code == 404

    # Guest tries PATCH -> 401
    assert client.patch(f"{API}/{id_a}", json={"title": "Guest sửa"}).status_code == 401

    # Guest tries DELETE -> 401
    assert client.delete(f"{API}/{id_a}").status_code == 401

    # User A's itinerary remains completely intact
    current_a = client.get(f"{API}/{id_a}", headers=headers_a).json()
    assert current_a["title"] == payload["title"]
    assert current_a["version"] == 1


def test_optimistic_locking_version_semantics(client: TestClient, payload: dict) -> None:
    """Verify version conflict (409), omitted version bypass, and explicit null rejection (422)."""
    res_user = client.post(
        "/api/auth/register",
        json={
            "email": "optlock@danangacy.vn",
            "password": "Password123!",
            "display_name": "Lock Tester",
        },
    ).json()
    headers = {"Authorization": f"Bearer {res_user['access_token']}"}

    itinerary = client.post(API, json=payload, headers=headers).json()
    itinerary_id = itinerary["id"]
    assert itinerary["version"] == 1

    # 1. Matching version (1) -> succeeds, version becomes 2
    res_v1 = client.patch(
        f"{API}/{itinerary_id}", json={"title": "Revision 1", "version": 1}, headers=headers
    )
    assert res_v1.status_code == 200
    assert res_v1.json()["version"] == 2

    # 2. Stale version (1 when current is 2) -> 409 Conflict
    res_stale = client.patch(
        f"{API}/{itinerary_id}", json={"title": "Stale Revision", "version": 1}, headers=headers
    )
    assert res_stale.status_code == 409
    assert res_stale.json()["detail"] == "Lịch trình đã thay đổi. Hãy tải lại trước khi sửa."

    # 3. Omitted version field -> succeeds (expected_version is None bypasses check), becomes 3
    res_no_version = client.patch(
        f"{API}/{itinerary_id}", json={"title": "Revision without version field"}, headers=headers
    )
    assert res_no_version.status_code == 200
    assert res_no_version.json()["version"] == 3

    # 4. Explicit null version: {"version": None, "title": "..."} -> 422 Unprocessable Entity
    res_null_version = client.patch(
        f"{API}/{itinerary_id}", json={"title": "Null version", "version": None}, headers=headers
    )
    assert res_null_version.status_code == 422
