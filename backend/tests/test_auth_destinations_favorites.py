from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.db.seed import seed_demo_data


def test_auth_register_login_profile(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    # 1. Register new user
    register_payload = {
        "email": "test.user@danangacy.vn",
        "password": "SecurePassword123",
        "display_name": "Người dùng Test",
        "phone": "0905123456",
    }
    res_reg = client.post("/api/auth/register", json=register_payload)
    assert res_reg.status_code == 201
    data_reg = res_reg.json()
    assert "access_token" in data_reg
    assert data_reg["user"]["email"] == "test.user@danangacy.vn"
    assert data_reg["user"]["display_name"] == "Người dùng Test"
    token = data_reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Duplicate registration returns 409
    res_dup = client.post("/api/auth/register", json=register_payload)
    assert res_dup.status_code == 409

    # 3. Login with wrong password returns 401
    res_wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "test.user@danangacy.vn", "password": "WrongPassword"},
    )
    assert res_wrong_pw.status_code == 401

    # 4. Login with correct password returns token
    res_login = client.post(
        "/api/auth/login",
        json={"email": "test.user@danangacy.vn", "password": "SecurePassword123"},
    )
    assert res_login.status_code == 200
    assert res_login.json()["access_token"]

    # 5. Get current profile
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "test.user@danangacy.vn"

    # 6. Update profile
    res_patch = client.patch(
        "/api/auth/profile",
        json={"display_name": "Tên Đã Đổi", "phone": "0988777666"},
        headers=headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["display_name"] == "Tên Đã Đổi"
    assert res_patch.json()["phone"] == "0988777666"


def test_destinations_list_and_filter(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    # 1. List all destinations
    res = client.get("/api/destinations")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 8

    # 2. Filter by environment
    res_indoor = client.get("/api/destinations", params={"environment": "INDOOR"})
    assert res_indoor.status_code == 200
    assert all(d["environment"] == "INDOOR" for d in res_indoor.json())

    # 3. Search query
    res_search = client.get("/api/destinations", params={"search": "Chăm"})
    assert res_search.status_code == 200
    assert any("Chăm" in d["name"] for d in res_search.json())

    # 4. Get by slug
    res_slug = client.get("/api/destinations/cham")
    assert res_slug.status_code == 200
    assert res_slug.json()["slug"] == "cham"

    # 5. Non-existent destination returns 404
    assert client.get("/api/destinations/not-found").status_code == 404


def test_favorites_flow(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    reg = client.post(
        "/api/auth/register",
        json={
            "email": "fav.user@danangacy.vn",
            "password": "Password123",
            "display_name": "Favorite User",
        },
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # 1. Initial favorites is empty
    assert client.get("/api/favorites", headers=headers).json() == []

    # 2. Toggle favorite ON
    res_fav = client.post("/api/favorites/cham", headers=headers)
    assert res_fav.status_code == 200
    assert res_fav.json()["is_favorite"] is True

    # 3. Check favorites list contains cham
    fav_list = client.get("/api/favorites", headers=headers).json()
    assert len(fav_list) == 1
    assert fav_list[0]["slug"] == "cham"

    # 4. Toggle favorite OFF
    res_unfav = client.post("/api/favorites/cham", headers=headers)
    assert res_unfav.status_code == 200
    assert res_unfav.json()["is_favorite"] is False

    # 5. Check favorites list is empty again
    assert client.get("/api/favorites", headers=headers).json() == []


def test_authenticated_itinerary_ownership(
    client: TestClient, db_engine: Engine, payload: dict
) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    # Register user A
    user_a = client.post(
        "/api/auth/register",
        json={"email": "usera@danangacy.vn", "password": "Password123", "display_name": "User A"},
    ).json()
    headers_a = {"Authorization": f"Bearer {user_a['access_token']}"}

    # Register user B
    user_b = client.post(
        "/api/auth/register",
        json={"email": "userb@danangacy.vn", "password": "Password123", "display_name": "User B"},
    ).json()
    headers_b = {"Authorization": f"Bearer {user_b['access_token']}"}

    # User A creates an itinerary
    itinerary_a = client.post("/api/v1/itineraries", json=payload, headers=headers_a).json()
    assert itinerary_a["id"] > 0

    # User A sees it
    assert len(client.get("/api/v1/itineraries", headers=headers_a).json()) == 1

    # User B does NOT see User A's itinerary
    assert client.get("/api/v1/itineraries", headers=headers_b).json() == []
    endpoint = f"/api/v1/itineraries/{itinerary_a['id']}"
    assert client.get(endpoint, headers=headers_b).status_code == 404
