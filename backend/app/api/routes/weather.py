from fastapi import APIRouter

from app.schemas.weather import DaNangWeatherResponse
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather"])
service = WeatherService()


@router.get(
    "/danang",
    response_model=DaNangWeatherResponse,
    summary="Lấy dự báo thời tiết Đà Nẵng",
    description="Truy vấn dữ liệu thời tiết thời gian thực tại Đà Nẵng qua Open-Meteo API.",
)
def get_danang_weather() -> DaNangWeatherResponse:
    """Lấy dự báo thời tiết thời gian thực tại Đà Nẵng qua Open-Meteo."""
    data = service.get_danang_forecast()
    return DaNangWeatherResponse(**data)
