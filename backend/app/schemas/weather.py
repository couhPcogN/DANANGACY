from pydantic import BaseModel, Field


class WeatherHourlyItem(BaseModel):
    time: str = Field(description="Mốc giờ", examples=["14:00"])
    temperature: int = Field(description="Nhiệt độ °C", examples=[29])
    condition: str = Field(description="Tình trạng thời tiết", examples=["Nắng nhẹ"])
    icon: str = Field(description="Biểu tượng", examples=["☼"])
    label: str = Field(description="Nhãn hiển thị", examples=["14:00  ☼ 29°"])
    precipitation_probability: int = Field(description="Xác suất mưa %", examples=[15])


class DaNangWeatherResponse(BaseModel):
    city: str = Field(default="Đà Nẵng", examples=["Đà Nẵng"])
    latitude: float = Field(default=16.0544, examples=[16.0544])
    longitude: float = Field(default=108.2022, examples=[108.2022])
    temperature: int = Field(description="Nhiệt độ hiện tại °C", examples=[26])
    condition: str = Field(description="Tình trạng thời tiết", examples=["Nắng nhẹ"])
    icon: str = Field(examples=["☼"])
    weather_code: int = Field(description="Mã thời tiết WMO", examples=[1])
    is_raining: bool = Field(description="Có mưa hoặc nguy cơ mưa cao", examples=[False])
    rain_probability_max: int = Field(
        description="Xác suất mưa cao nhất trong ngày %", examples=[20]
    )
    hourly: list[WeatherHourlyItem]
