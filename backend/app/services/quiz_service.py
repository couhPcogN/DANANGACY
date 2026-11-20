from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import InvalidQuizSubmissionError, QuizNotFoundError
from app.models.quiz import QuizAttempt, QuizAttemptAnswer, RewardGrant
from app.repositories.quiz_repository import QuizRepository
from app.repositories.reward_repository import RewardRepository
from app.schemas.quiz import (
    QuizOptionRead,
    QuizQuestionRead,
    QuizRead,
    QuizSubmitAnswer,
    QuizSubmitResult,
)


class QuizService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.quiz_repo = QuizRepository(session)
        self.reward_repo = RewardRepository(session)

    def list_active_quizzes(self, destination_id: int | None = None) -> list[QuizRead]:
        quizzes = self.quiz_repo.list_active(destination_id)
        results: list[QuizRead] = []
        for quiz in quizzes:
            results.append(self._build_quiz_read(quiz))
        return results

    def get_quiz_detail(self, quiz_id: int) -> QuizRead:
        quiz = self.quiz_repo.get_by_id(quiz_id)
        if quiz is None or quiz.status != "PUBLISHED":
            raise QuizNotFoundError()
        return self._build_quiz_read(quiz)

    def _build_quiz_read(self, quiz) -> QuizRead:
        questions = self.quiz_repo.get_questions(quiz.id)
        q_ids = [q.id for q in questions]
        options = self.quiz_repo.get_options_for_questions(q_ids)

        options_by_q: dict[int, list[QuizOptionRead]] = {q_id: [] for q_id in q_ids}
        for opt in options:
            options_by_q[opt.question_id].append(
                QuizOptionRead(
                    id=opt.id,
                    option_text=opt.option_text,
                    position=opt.position,
                )
            )

        q_reads = [
            QuizQuestionRead(
                id=q.id,
                question_text=q.question_text,
                position=q.position,
                explanation=q.explanation,
                options=options_by_q.get(q.id, []),
            )
            for q in questions
        ]

        return QuizRead(
            id=quiz.id,
            destination_id=quiz.destination_id,
            title=quiz.title,
            description=quiz.description,
            pass_score=quiz.pass_score,
            reward_points=quiz.reward_points,
            time_limit_minutes=quiz.time_limit_minutes,
            status=quiz.status,
            questions=q_reads,
        )

    def submit_quiz(
        self, owner_uid: str, quiz_id: int, answers: list[QuizSubmitAnswer]
    ) -> QuizSubmitResult:
        with self.session.begin():
            quiz = self.quiz_repo.get_by_id(quiz_id)
            if quiz is None or quiz.status != "PUBLISHED":
                raise QuizNotFoundError()

            questions = self.quiz_repo.get_questions(quiz.id)
            if not questions:
                raise QuizNotFoundError()

            # Build mapping of valid options per question: question_id -> {option_id: is_correct}
            valid_options_by_q: dict[int, dict[int, bool]] = {q.id: {} for q in questions}
            options = self.quiz_repo.get_options_for_questions(list(valid_options_by_q.keys()))
            for opt in options:
                if opt.question_id in valid_options_by_q:
                    valid_options_by_q[opt.question_id][opt.id] = opt.is_correct

            # 1. Reject duplicate question_id in submitted answers
            submitted_q_ids = [a.question_id for a in answers]
            if len(submitted_q_ids) != len(set(submitted_q_ids)):
                raise InvalidQuizSubmissionError("Bài nộp chứa câu hỏi bị trùng lặp.")

            # 2. Validate that each answer belongs to this quiz and option belongs to that question
            for a in answers:
                if a.question_id not in valid_options_by_q:
                    raise InvalidQuizSubmissionError(
                        f"Câu hỏi ID {a.question_id} không thuộc bài trắc nghiệm này."
                    )
                q_opts = valid_options_by_q[a.question_id]
                if a.selected_option_id not in q_opts:
                    raise InvalidQuizSubmissionError(
                        f"Đáp án ID {a.selected_option_id} không thuộc câu hỏi ID {a.question_id}."
                    )

            # 3. Grade answers
            sub_map = {a.question_id: a.selected_option_id for a in answers}
            correct_count = 0
            attempt_answers: list[QuizAttemptAnswer] = []

            for q in questions:
                selected_opt = sub_map.get(q.id)
                if selected_opt is not None:
                    is_corr = valid_options_by_q[q.id][selected_opt]
                    if is_corr:
                        correct_count += 1
                    attempt_answers.append(
                        QuizAttemptAnswer(
                            attempt_id=0,  # assigned after flush
                            question_id=q.id,
                            selected_option_id=selected_opt,
                            is_correct=is_corr,
                        )
                    )

            passed = correct_count >= quiz.pass_score
            existing_grant = self.quiz_repo.get_user_grant(owner_uid, quiz.id)
            points_to_award = 0

            if passed and existing_grant is None:
                points_to_award = quiz.reward_points

            now = datetime.now(UTC)
            attempt = QuizAttempt(
                owner_uid=owner_uid,
                quiz_id=quiz.id,
                status="SUBMITTED",
                correct_count=correct_count,
                points_awarded=points_to_award,
                started_at=now,
                submitted_at=now,
            )
            self.quiz_repo.add_attempt(attempt)

            for aa in attempt_answers:
                aa.attempt_id = attempt.id
            self.quiz_repo.add_attempt_answers(attempt_answers)

            if points_to_award > 0:
                try:
                    with self.session.begin_nested():
                        grant = RewardGrant(
                            owner_uid=owner_uid,
                            quiz_id=quiz.id,
                            attempt_id=attempt.id,
                            points_awarded=points_to_award,
                        )
                        self.quiz_repo.add_reward_grant(grant)
                        wallet, _ = self.reward_repo.update_balance(
                            user_uid=owner_uid,
                            delta_points=points_to_award,
                            reason="QUIZ_REWARD",
                            source_id=attempt.id,
                        )
                    balance = wallet.balance_points
                    message = (
                        "Chúc mừng bạn đã vượt qua thử thách và nhận "
                        f"{points_to_award} điểm thưởng!"
                    )
                except IntegrityError as exc:
                    err_str = str(exc).lower()
                    if any(
                        k in err_str
                        for k in ("reward_grants", "unique", "owner_uid", "duplicate key")
                    ):
                        points_to_award = 0
                        attempt.points_awarded = 0
                        wallet = self.reward_repo.get_or_create_wallet(owner_uid)
                        balance = wallet.balance_points
                        message = (
                            "Bạn đã hoàn thành thử thách! (Điểm thưởng đã được trao trước đó)."
                        )
                    else:
                        raise
            else:
                wallet = self.reward_repo.get_or_create_wallet(owner_uid)
                balance = wallet.balance_points
                if not passed:
                    message = (
                        f"Rất tiếc! Bạn đạt {correct_count}/{len(questions)} câu đúng "
                        f"(cần tối thiểu {quiz.pass_score} câu để nhận thưởng)."
                    )
                else:
                    message = "Bạn đã hoàn thành thử thách! (Điểm thưởng đã được trao trước đó)."

            return QuizSubmitResult(
                attempt_id=attempt.id,
                quiz_id=quiz.id,
                correct_count=correct_count,
                total_questions=len(questions),
                passed=passed,
                points_awarded=points_to_award,
                balance_points=balance,
                message=message,
            )
