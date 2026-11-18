from pydantic import BaseModel, ConfigDict, Field


class QuizOptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    option_text: str
    position: int


class QuizQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_text: str
    position: int
    explanation: str | None = None
    options: list[QuizOptionRead] = Field(default_factory=list)


class QuizRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    destination_id: int
    title: str
    description: str | None = None
    pass_score: int
    reward_points: int
    time_limit_minutes: int | None = None
    status: str
    questions: list[QuizQuestionRead] = Field(default_factory=list)


class QuizSubmitAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_id: int = Field(gt=0)
    selected_option_id: int = Field(gt=0)


class QuizSubmitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: list[QuizSubmitAnswer] = Field(min_length=1)


class QuizSubmitResult(BaseModel):
    attempt_id: int
    quiz_id: int
    correct_count: int
    total_questions: int
    passed: bool
    points_awarded: int
    balance_points: int
    message: str
