from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    false,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import Timestamps, UUIDPrimaryKey


class Quiz(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        CheckConstraint("pass_score BETWEEN 0 AND 5", name="pass_score_range"),
        CheckConstraint("reward_points >= 0", name="reward_points_nonnegative"),
        CheckConstraint("time_limit_minutes > 0", name="time_limit_positive"),
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')", name="status_values"),
    )

    destination_id: Mapped[UUID] = mapped_column(ForeignKey("destinations.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    pass_score: Mapped[int] = mapped_column(default=3, server_default="3")
    reward_points: Mapped[int] = mapped_column(default=50, server_default="50")
    time_limit_minutes: Mapped[int | None]
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", server_default="DRAFT")


class QuizQuestion(UUIDPrimaryKey, Base):
    __tablename__ = "quiz_questions"
    __table_args__ = (
        UniqueConstraint("quiz_id", "position"),
        CheckConstraint("position >= 0", name="position_nonnegative"),
    )

    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"))
    question_text: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int]
    explanation: Mapped[str | None] = mapped_column(Text)


class QuizOption(UUIDPrimaryKey, Base):
    __tablename__ = "quiz_options"
    __table_args__ = (
        UniqueConstraint("question_id", "position"),
        CheckConstraint("position BETWEEN 0 AND 3", name="position_range"),
    )

    question_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_questions.id", ondelete="CASCADE"))
    option_text: Mapped[str] = mapped_column(Text)
    position: Mapped[int]
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())


class QuizAttempt(UUIDPrimaryKey, Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        CheckConstraint("status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED')", name="status_values"),
        CheckConstraint("correct_count BETWEEN 0 AND 5", name="correct_count_range"),
        CheckConstraint("points_awarded >= 0", name="points_nonnegative"),
        CheckConstraint("expires_at > started_at", name="expiry_order"),
        CheckConstraint("submitted_at >= started_at", name="submission_order"),
        Index("ix_quiz_attempts_owner_uid_quiz_id", "owner_uid", "quiz_id"),
    )

    owner_uid: Mapped[str] = mapped_column(String(128), ForeignKey("users.uid"))
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id"))
    status: Mapped[str] = mapped_column(
        String(20), default="IN_PROGRESS", server_default="IN_PROGRESS"
    )
    correct_count: Mapped[int | None]
    points_awarded: Mapped[int] = mapped_column(default=0, server_default="0")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class QuizAttemptAnswer(UUIDPrimaryKey, Base):
    __tablename__ = "quiz_attempt_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id"),)

    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_attempts.id", ondelete="CASCADE"))
    question_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_questions.id"))
    selected_option_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_options.id"))
    is_correct: Mapped[bool]


class RewardGrant(UUIDPrimaryKey, Base):
    __tablename__ = "reward_grants"
    __table_args__ = (
        UniqueConstraint("owner_uid", "quiz_id"),
        CheckConstraint("points_awarded >= 0", name="points_nonnegative"),
    )

    owner_uid: Mapped[str] = mapped_column(String(128), ForeignKey("users.uid"))
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id"))
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_attempts.id"), unique=True)
    points_awarded: Mapped[int] = mapped_column(default=50, server_default="50")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
