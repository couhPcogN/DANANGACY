from pydantic import BaseModel, ConfigDict, Field


class AIPromptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str = Field(
        min_length=1,
        max_length=2000,
        description="Câu hỏi hoặc yêu cầu gửi tới Gemini",
        examples=["Giới thiệu ngắn về văn hóa Đà Nẵng"],
    )
    system_instruction: str | None = Field(
        default=None,
        max_length=1000,
        description="Chỉ dẫn phong cách cho AI",
        examples=["Bạn là hướng dẫn viên di sản Đà Nẵng."],
    )


class AIHeritageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    destination_name: str = Field(
        min_length=1,
        max_length=200,
        description="Tên điểm đến di sản",
        examples=["Bảo tàng Điêu khắc Chăm"],
    )
    slug: str | None = Field(
        default=None,
        max_length=50,
        description="Slug địa điểm (nếu có)",
        examples=["cham"],
    )


class AIResponse(BaseModel):
    success: bool = Field(description="Trạng thái gọi API thành công", examples=[True])
    text: str = Field(
        description="Nội dung phản hồi từ AI hoặc kho di sản địa phương",
        examples=["Bảo tàng Điêu khắc Chăm Đà Nẵng là nơi lưu giữ..."],
    )
    source: str = Field(
        description="Nguồn phản hồi (gemini-3.8-flash hoặc local-fallback)",
        examples=["gemini-3.8-flash"],
    )
    message: str | None = Field(default=None, description="Thông điệp bổ sung")
