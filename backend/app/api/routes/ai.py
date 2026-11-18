from fastapi import APIRouter

from app.schemas.ai import AIHeritageRequest, AIPromptRequest, AIResponse
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/ai", tags=["AI"])
service = GeminiService()


@router.post(
    "/generate",
    response_model=AIResponse,
    summary="Sinh nội dung với Gemini 3.8 Flash",
    description="Gửi câu hỏi hoặc chỉ dẫn tới Google Gemini 3.8 Flash và nhận kết quả phản hồi.",
)
def generate_content(payload: AIPromptRequest) -> AIResponse:
    """Tạo nội dung từ Gemini 3.8 Flash."""
    data = service.generate(payload.prompt, payload.system_instruction)
    return AIResponse(**data)


@router.post(
    "/heritage-guide",
    response_model=AIResponse,
    summary="Thuyết minh di sản Đà Nẵng",
    description="Sử dụng Gemini 3.8 Flash để thuyết minh điểm đến di sản và đưa ra mẹo hữu ích.",
)
def heritage_guide(payload: AIHeritageRequest) -> AIResponse:
    """Thuyết minh di sản Đà Nẵng bằng Gemini 3.8 Flash."""
    data = service.explain_heritage(payload.destination_name, payload.slug)
    return AIResponse(**data)
