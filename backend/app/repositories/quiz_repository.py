from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.quiz import (
    Quiz,
    QuizAttempt,
    QuizAttemptAnswer,
    QuizOption,
    QuizQuestion,
    RewardGrant,
)


class QuizRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_active(self, destination_id: int | None = None) -> list[Quiz]:
        stmt = select(Quiz).where(Quiz.status == "PUBLISHED").order_by(Quiz.id)
        if destination_id is not None:
            stmt = stmt.where(Quiz.destination_id == destination_id)
        return list(self.session.scalars(stmt))

    def get_by_id(self, quiz_id: int) -> Quiz | None:
        return self.session.get(Quiz, quiz_id)

    def get_questions(self, quiz_id: int) -> list[QuizQuestion]:
        stmt = (
            select(QuizQuestion)
            .where(QuizQuestion.quiz_id == quiz_id)
            .order_by(QuizQuestion.position)
        )
        return list(self.session.scalars(stmt))

    def get_options_for_questions(self, question_ids: list[int]) -> list[QuizOption]:
        if not question_ids:
            return []
        stmt = (
            select(QuizOption)
            .where(QuizOption.question_id.in_(question_ids))
            .order_by(QuizOption.position)
        )
        return list(self.session.scalars(stmt))

    def get_user_grant(self, owner_uid: str, quiz_id: int) -> RewardGrant | None:
        stmt = select(RewardGrant).where(
            RewardGrant.owner_uid == owner_uid, RewardGrant.quiz_id == quiz_id
        )
        return self.session.scalar(stmt)

    def add_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        self.session.add(attempt)
        self.session.flush()
        return attempt

    def add_attempt_answers(self, answers: list[QuizAttemptAnswer]) -> None:
        self.session.add_all(answers)
        self.session.flush()

    def add_reward_grant(self, grant: RewardGrant) -> RewardGrant:
        self.session.add(grant)
        self.session.flush()
        return grant
