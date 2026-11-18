from fastapi.testclient import TestClient

from app.main import create_app


def test_weather_endpoint_returns_danang_forecast() -> None:
    client = TestClient(create_app())
    response = client.get("/api/weather/danang")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Đà Nẵng"
    assert data["latitude"] == 16.0544
    assert data["longitude"] == 108.2022
    assert "temperature" in data
    assert "condition" in data
    assert "hourly" in data
    assert len(data["hourly"]) >= 3


def test_ai_heritage_guide_returns_valid_response() -> None:
    client = TestClient(create_app())
    payload = {"destination_name": "Bảo tàng Điêu khắc Chăm", "slug": "cham"}
    response = client.post("/api/ai/heritage-guide", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert "source" in data
    assert len(data["text"]) > 10


def test_ai_generate_returns_response() -> None:
    client = TestClient(create_app())
    payload = {"prompt": "Giới thiệu Đà Nẵng"}
    response = client.post("/api/ai/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
