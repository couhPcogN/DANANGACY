from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_current_user_uid, get_quiz_service
from app.schemas.quiz import QuizRead, QuizSubmitRequest, QuizSubmitResult
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get("", response_model=list[QuizRead])
def list_quizzes(
    service: Annotated[QuizService, Depends(get_quiz_service)],
    destination_id: Annotated[int | None, Query(description="Lọc theo ID địa điểm di sản")] = None,
) -> list[QuizRead]:
    """Lấy danh sách các bài trắc nghiệm di sản đang hoạt động."""
    return service.list_active_quizzes(destination_id=destination_id)


@router.get("/{quiz_id}", response_model=QuizRead)
def get_quiz(
    quiz_id: int,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizRead:
    """Lấy thông tin chi tiết và bộ câu hỏi trắc nghiệm di sản."""
    return service.get_quiz_detail(quiz_id=quiz_id)


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResult, status_code=status.HTTP_200_OK)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    user_uid: Annotated[str, Depends(get_current_user_uid)],
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizSubmitResult:
    """Nộp bài trắc nghiệm, chấm điểm và tự động tích lũy điểm thưởng di sản."""
    return service.submit_quiz(owner_uid=user_uid, quiz_id=quiz_id, answers=payload.answers)
