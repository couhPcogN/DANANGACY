from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.itinerary_rules import DEMO_USER_UID
from app.db.demo_data import DEMO_DESTINATIONS, DEMO_QUIZ, DEMO_VOUCHERS
from app.db.session import SessionLocal
from app.models import Destination, Quiz, QuizOption, QuizQuestion, User, VoucherOffer, Wallet


def seed_demo_data(session: Session) -> None:
    # 1. Demo User & Wallet
    if session.get(User, DEMO_USER_UID) is None:
        session.add(User(uid=DEMO_USER_UID, display_name="Người dùng demo"))
        session.flush()

    if session.get(Wallet, DEMO_USER_UID) is None:
        session.add(Wallet(user_uid=DEMO_USER_UID, balance_points=100))

    # 2. Destinations
    dest_map: dict[str, Destination] = {}
    for d in session.scalars(select(Destination)):
        dest_map[d.slug] = d

    for slug, name, environment in DEMO_DESTINATIONS:
        if slug not in dest_map:
            dest = Destination(slug=slug, name=name, environment=environment)
            session.add(dest)
            session.flush()
            dest_map[slug] = dest

    # 3. Quiz & Questions & Options
    existing_quiz = session.scalar(select(Quiz).where(Quiz.title == DEMO_QUIZ["title"]))
    if existing_quiz is None and DEMO_QUIZ["destination_slug"] in dest_map:
        dest = dest_map[DEMO_QUIZ["destination_slug"]]
        quiz = Quiz(
            destination_id=dest.id,
            title=DEMO_QUIZ["title"],
            description=DEMO_QUIZ["description"],
            pass_score=DEMO_QUIZ["pass_score"],
            reward_points=DEMO_QUIZ["reward_points"],
            status="PUBLISHED",
        )
        session.add(quiz)
        session.flush()

        for pos, q_data in enumerate(DEMO_QUIZ["questions"]):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data["question"],
                position=pos,
                explanation=q_data["explanation"],
            )
            session.add(question)
            session.flush()

            for opt_pos, opt_text in enumerate(q_data["options"]):
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt_text,
                    position=opt_pos,
                    is_correct=(opt_pos == q_data["correct_index"]),
                )
                session.add(option)

    # 4. Voucher Offers
    existing_vouchers = set(session.scalars(select(VoucherOffer.title)))
    now = datetime.now(UTC)
    for v_data in DEMO_VOUCHERS:
        if v_data["title"] not in existing_vouchers:
            offer = VoucherOffer(
                title=v_data["title"],
                description=v_data["description"],
                merchant_name=v_data["merchant_name"],
                points_cost=v_data["points_cost"],
                total_stock=v_data["total_stock"],
                remaining_stock=v_data["total_stock"],
                valid_from=now,
                valid_until=now + timedelta(days=365),
                status="PUBLISHED",
            )
            session.add(offer)


if __name__ == "__main__":
    with SessionLocal.begin() as session:
        seed_demo_data(session)
    print("Demo user, destinations, quiz, and vouchers are ready.")
