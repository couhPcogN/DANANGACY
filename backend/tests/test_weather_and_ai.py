import json
import urllib.error
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app


class MockResponse:
    def __init__(self, data: bytes, code: int = 200) -> None:
        self.data = data
        self.code = code

    def read(self) -> bytes:
        return self.data

    def __enter__(self) -> "MockResponse":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        pass


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
    mock_payload = {
        "candidates": [
            {"content": {"parts": [{"text": "Bảo tàng Điêu khắc Chăm là di sản độc đáo."}]}}
        ]
    }
    with patch(
        "urllib.request.urlopen",
        return_value=MockResponse(json.dumps(mock_payload).encode("utf-8")),
    ):
        response = client.post("/api/ai/heritage-guide", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert "source" in data
    assert len(data["text"]) > 10


def test_ai_generate_returns_response() -> None:
    client = TestClient(create_app())
    payload = {"prompt": "Giới thiệu Đà Nẵng"}
    mock_payload = {
        "candidates": [
            {"content": {"parts": [{"text": "Đà Nẵng là điểm đến văn hóa và biển tuyệt đẹp."}]}}
        ]
    }
    with patch(
        "urllib.request.urlopen",
        return_value=MockResponse(json.dumps(mock_payload).encode("utf-8")),
    ):
        response = client.post("/api/ai/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data


def test_ai_generate_with_mocked_gemini_success() -> None:
    client = TestClient(create_app())
    gemini_payload = {
        "candidates": [{"content": {"parts": [{"text": "Đà Nẵng là thành phố biển đáng sống."}]}}]
    }
    raw_bytes = json.dumps(gemini_payload).encode("utf-8")
    with patch("urllib.request.urlopen", return_value=MockResponse(raw_bytes)):
        response = client.post("/api/ai/generate", json={"prompt": "Giới thiệu Đà Nẵng"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["source"] == "gemini-3.8-flash"
    assert data["text"] == "Đà Nẵng là thành phố biển đáng sống."


def test_ai_generate_with_gemini_402_depleted_credits() -> None:
    client = TestClient(create_app())
    err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com",
        code=402,
        msg="Payment Required",
        hdrs={},  # type: ignore[arg-type]
        fp=None,
    )
    with patch("urllib.request.urlopen", side_effect=err):
        response = client.post("/api/ai/generate", json={"prompt": "Thời tiết hôm nay"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["source"] == "local-fallback"
    assert "402" in data["message"]


def test_ai_heritage_guide_slug_fallback_when_gemini_fails() -> None:
    client = TestClient(create_app())
    err = urllib.error.URLError("DNS resolution failed")
    with patch("urllib.request.urlopen", side_effect=err):
        response = client.post(
            "/api/ai/heritage-guide",
            json={"destination_name": "Bảo tàng Điêu khắc Chăm", "slug": "cham"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["source"] == "local-fallback"
    assert "Bảo tàng Điêu khắc Chăm" in data["text"]


def test_ai_generate_validation_rejects_empty_prompt() -> None:
    client = TestClient(create_app())
    response = client.post("/api/ai/generate", json={"prompt": ""})
    assert response.status_code == 422


def test_ai_heritage_guide_validation_rejects_empty_destination() -> None:
    client = TestClient(create_app())
    response = client.post("/api/ai/heritage-guide", json={"destination_name": ""})
    assert response.status_code == 422
