import json
import urllib.error
import urllib.request
from typing import Any

from app.core.config import get_settings

GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

HERITAGE_FALLBACKS: dict[str, str] = {
    "cham": (
        "Bảo tàng Điêu khắc Chăm Đà Nẵng sở hữu bộ sưu tập điêu khắc Champa cổ tinh xảo "
        "và độc bản lớn nhất thế giới, thành lập từ năm 1915."
    ),
    "son-tra": (
        "Bán đảo Sơn Trà là khu bảo tồn thiên nhiên kỳ vĩ với chùa Linh Ứng uy nghiêm "
        "và là môi trường sống của loài Voọc chà vá chân nâu."
    ),
    "ngu-hanh-son": (
        "Ngũ Hành Sơn là quần thể 5 ngọn núi đá cẩm thạch kỳ vĩ chứa đựng nhiều hang động "
        "huyền bí và chùa chiền cổ kính linh thiêng."
    ),
    "cau-rong": (
        "Cầu Rồng vắt ngang sông Hàn là công trình biểu tượng của Đà Nẵng hiện đại với màn "
        "trình diễn phun lửa và nước ấn tượng vào cuối tuần."
    ),
    "bao-tang-dn": (
        "Bảo tàng Đà Nẵng phản ánh chân thực tiến trình lịch sử, văn hóa dân gian và ký ức "
        "đấu tranh hào hùng của mảnh đất xứ Quảng."
    ),
}


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(self, prompt: str, system_instruction: str | None = None) -> dict[str, Any]:
        api_key = self.settings.gemini_api_key.get_secret_value()
        if not api_key:
            return {
                "success": False,
                "text": self._get_fallback_text(prompt),
                "source": "local-fallback",
                "message": "GEMINI_API_KEY chưa được thiết lập trong cấu hình.",
            }

        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        payload = json.dumps({"contents": [{"parts": [{"text": full_prompt}]}]}).encode("utf-8")
        req = urllib.request.Request(
            f"{GEMINI_ENDPOINT}?key={api_key}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return {
                            "success": True,
                            "text": parts[0]["text"].strip(),
                            "source": GEMINI_MODEL,
                        }
        except urllib.error.HTTPError as exc:
            if exc.code == 402:
                return {
                    "success": False,
                    "text": self._get_fallback_text(prompt),
                    "source": "local-fallback",
                    "message": "HTTP 402: Prepayment credits depleted on Google AI Studio.",
                }
            return {
                "success": False,
                "text": self._get_fallback_text(prompt),
                "source": "local-fallback",
                "message": f"HTTP error {exc.code}",
            }
        except Exception as exc:
            return {
                "success": False,
                "text": self._get_fallback_text(prompt),
                "source": "local-fallback",
                "message": str(exc),
            }

        return {
            "success": False,
            "text": self._get_fallback_text(prompt),
            "source": "local-fallback",
        }

    def explain_heritage(self, destination_name: str, slug: str | None = None) -> dict[str, Any]:
        system = (
            "Bạn là chuyên gia di sản văn hóa Đà Nẵng (DANANGACY). "
            "Hãy thuyết minh ngắn gọn trong 2-3 câu và đưa ra 1 mẹo hữu ích cho du khách."
        )
        prompt = (
            f"Thuyết minh và lời khuyên tham quan điểm đến di sản: {destination_name} tại Đà Nẵng."
        )
        result = self.generate(prompt, system)
        if not result["success"] and slug and slug in HERITAGE_FALLBACKS:
            result["text"] = HERITAGE_FALLBACKS[slug]
        return result

    def _get_fallback_text(self, prompt: str) -> str:
        lower = prompt.lower()
        for k, v in HERITAGE_FALLBACKS.items():
            if k in lower:
                return v
        return (
            "Đà Nẵng sở hữu di sản văn hóa và thắng cảnh đa dạng. "
            "Hãy chuẩn bị lịch trình hợp lý và theo dõi thông tin thời tiết trước khi di chuyển."
        )
