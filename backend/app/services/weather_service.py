import json
import urllib.request
from typing import Any

from app.core.config import get_settings

DA_NANG_LATITUDE = 16.0544
DA_NANG_LONGITUDE = 108.2022

WEATHER_CODE_MAP = {
    0: ("Quang đãng", "☼", False),
    1: ("Nắng nhẹ", "☼", False),
    2: ("Có mây", "⛅", False),
    3: ("Nhiều mây", "☁", False),
    45: ("Có sương mù", "☁", False),
    48: ("Có sương rải rác", "☁", False),
    51: ("Mưa phùn nhẹ", "☂", True),
    53: ("Mưa phùn", "☂", True),
    55: ("Mưa phùn dày", "☂", True),
    61: ("Mưa rào nhẹ", "☂", True),
    63: ("Mưa rào vừa", "☂", True),
    65: ("Mưa to", "☂", True),
    80: ("Mưa rào rải rác", "☂", True),
    81: ("Mưa rào diện rộng", "☂", True),
    82: ("Mưa rất to", "☂", True),
    95: ("Có dông sét", "⚡", True),
}


class WeatherService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def get_danang_forecast(self) -> dict[str, Any]:
        url = (
            f"{self.settings.open_meteo_url}?"
            f"latitude={DA_NANG_LATITUDE}&longitude={DA_NANG_LONGITUDE}"
            "&current_weather=true"
            "&hourly=temperature_2m,precipitation_probability,weathercode"
            "&timezone=Asia%2FBangkok"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "DANANGACY-Backend/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception:
            return self._fallback_data()

        current = payload.get("current_weather", {})
        code = int(current.get("weathercode", 1))
        condition_text, icon, is_rain = WEATHER_CODE_MAP.get(code, ("Có mây", "⛅", False))
        temp = round(current.get("temperature", 28.0))

        hourly = payload.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        codes = hourly.get("weathercode", [])
        probs = hourly.get("precipitation_probability", [])

        # Choose 3 upcoming key slots (14:00, 16:00, 18:00)
        target_hours = [14, 16, 18]
        selected_hourly = []
        max_rain_prob = 0

        for target_h in target_hours:
            target_str = f"{target_h:02d}:00"
            idx = next((i for i, t in enumerate(times) if f"T{target_str}" in t), -1)
            slot_temp = round(temps[idx]) if 0 <= idx < len(temps) else 30
            slot_code = int(codes[idx]) if 0 <= idx < len(codes) else 1
            slot_prob = int(probs[idx]) if 0 <= idx < len(probs) else 10
            slot_text, slot_icon, _ = WEATHER_CODE_MAP.get(slot_code, ("Nắng nhẹ", "☼", False))

            if slot_prob > max_rain_prob:
                max_rain_prob = slot_prob

            selected_hourly.append(
                {
                    "time": target_str,
                    "temperature": slot_temp,
                    "condition": slot_text,
                    "icon": slot_icon,
                    "label": f"{target_str}  {slot_icon} {slot_temp}°",
                    "precipitation_probability": slot_prob,
                }
            )

        return {
            "city": "Đà Nẵng",
            "latitude": DA_NANG_LATITUDE,
            "longitude": DA_NANG_LONGITUDE,
            "temperature": temp,
            "condition": condition_text,
            "icon": icon,
            "weather_code": code,
            "is_raining": is_rain or max_rain_prob >= 50,
            "rain_probability_max": max_rain_prob,
            "hourly": selected_hourly,
        }

    def _fallback_data(self) -> dict[str, Any]:
        return {
            "city": "Đà Nẵng",
            "latitude": DA_NANG_LATITUDE,
            "longitude": DA_NANG_LONGITUDE,
            "temperature": 28,
            "condition": "Nắng nhẹ",
            "icon": "☼",
            "weather_code": 1,
            "is_raining": False,
            "rain_probability_max": 20,
            "hourly": [
                {
                    "time": "14:00",
                    "temperature": 31,
                    "condition": "Nắng nhẹ",
                    "icon": "☼",
                    "label": "14:00  ☼ 31°",
                    "precipitation_probability": 15,
                },
                {
                    "time": "16:00",
                    "temperature": 30,
                    "condition": "Có mây",
                    "icon": "☼",
                    "label": "16:00  ☼ 30°",
                    "precipitation_probability": 20,
                },
                {
                    "time": "18:00",
                    "temperature": 27,
                    "condition": "Mưa rào",
                    "icon": "☂",
                    "label": "18:00  ☂ 27°",
                    "precipitation_probability": 70,
                },
            ],
        }
