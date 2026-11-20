from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.seed import seed_demo_data


def test_quiz_flow_and_point_award(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    # 1. Register a test player
    user = client.post(
        "/api/auth/register",
        json={
            "email": "player1@danangacy.vn",
            "password": "Password123",
            "display_name": "Player One",
        },
    ).json()
    headers = {"Authorization": f"Bearer {user['access_token']}"}

    # 2. Check wallet starts at 0 points
    wallet = client.get("/api/wallet/me", headers=headers).json()
    assert wallet["balance_points"] == 0

    # 3. List active quizzes
    quizzes = client.get("/api/quizzes", headers=headers).json()
    assert len(quizzes) >= 1
    quiz = quizzes[0]
    assert quiz["title"] == "Hiện vật Chăm Pa"
    assert len(quiz["questions"]) == 5

    # Ensure is_correct is NOT leaked to clients
    for q in quiz["questions"]:
        for opt in q["options"]:
            assert "is_correct" not in opt

    # 4. Submit failing quiz (0 answers correct)
    # The correct answers in demo data are positions: 0, 1, 1, 1, 2
    # So submitting wrong positions:
    fail_payload = {
        "answers": [
            {"question_id": q["id"], "selected_option_id": q["options"][3]["id"]}
            for q in quiz["questions"]
        ]
    }
    fail_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json=fail_payload, headers=headers
    ).json()
    assert fail_res["passed"] is False
    assert fail_res["correct_count"] < 3
    assert fail_res["points_awarded"] == 0
    assert fail_res["balance_points"] == 0

    # 5. Submit passing quiz (select all correct options: 0, 1, 1, 1, 2)
    correct_positions = [0, 1, 1, 1, 2]
    pass_answers = [
        {"question_id": q["id"], "selected_option_id": q["options"][correct_positions[i]]["id"]}
        for i, q in enumerate(quiz["questions"])
    ]
    pass_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json={"answers": pass_answers}, headers=headers
    ).json()
    assert pass_res["passed"] is True
    assert pass_res["correct_count"] == 5
    assert pass_res["points_awarded"] == 50
    assert pass_res["balance_points"] == 50

    # Wallet reflects 50 points
    wallet = client.get("/api/wallet/me", headers=headers).json()
    assert wallet["balance_points"] == 50

    # 6. Duplicate quiz submission does NOT reward points again
    dup_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json={"answers": pass_answers}, headers=headers
    ).json()
    assert dup_res["passed"] is True
    assert dup_res["points_awarded"] == 0
    assert dup_res["balance_points"] == 50
    assert "trước đó" in dup_res["message"]


def test_voucher_claims_and_wallet(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    # Register user
    user = client.post(
        "/api/auth/register",
        json={
            "email": "player2@danangacy.vn",
            "password": "Password123",
            "display_name": "Player Two",
        },
    ).json()
    headers = {"Authorization": f"Bearer {user['access_token']}"}

    # List vouchers
    vouchers = client.get("/api/vouchers", headers=headers).json()
    assert len(vouchers) >= 3
    coffee_voucher = next(v for v in vouchers if "Cà phê" in v["title"])
    assert coffee_voucher["points_cost"] == 100

    # 1. Attempt claim with 0 balance -> 400 InsufficientPoints
    claim_fail = client.post(f"/api/vouchers/{coffee_voucher['id']}/claim", headers=headers)
    assert claim_fail.status_code == 400
    assert "không đủ" in claim_fail.json()["detail"]

    # 2. Complete quiz twice to earn 50 points (only 1st grants 50) + give points
    quizzes = client.get("/api/quizzes", headers=headers).json()
    quiz = quizzes[0]
    correct_positions = [0, 1, 1, 1, 2]
    pass_answers = [
        {"question_id": q["id"], "selected_option_id": q["options"][correct_positions[i]]["id"]}
        for i, q in enumerate(quiz["questions"])
    ]
    client.post(
        f"/api/quizzes/{quiz['id']}/submit", json={"answers": pass_answers}, headers=headers
    )

    # Currently 50 points; postcard voucher costs 80, still insufficient for coffee (100)
    # Let's directly add 100 points via demo user or wallet to test successful claim
    with Session(db_engine) as session, session.begin():
        from app.models.reward import Wallet

        w = session.get(Wallet, user["user"]["uid"])
        w.balance_points = 150

    # 3. Successful claim
    claim_success = client.post(f"/api/vouchers/{coffee_voucher['id']}/claim", headers=headers)
    assert claim_success.status_code == 201
    claim_data = claim_success.json()
    assert claim_data["points_spent"] == 100
    assert claim_data["voucher_code"].startswith("DANANG-")
    assert claim_data["status"] == "ISSUED"

    # Wallet balance decreased: 150 - 100 = 50
    wallet = client.get("/api/wallet/me", headers=headers).json()
    assert wallet["balance_points"] == 50

    # 4. Cannot claim same voucher twice -> 409 Conflict
    claim_dup = client.post(f"/api/vouchers/{coffee_voucher['id']}/claim", headers=headers)
    assert claim_dup.status_code == 409
    assert "trước đó" in claim_dup.json()["detail"]

    # 5. List my claimed vouchers
    my_claims = client.get("/api/vouchers/my-claims", headers=headers).json()
    assert len(my_claims) == 1
    assert my_claims[0]["voucher_code"] == claim_data["voucher_code"]

    # 6. Transactions history
    txs = client.get("/api/wallet/transactions", headers=headers).json()
    assert len(txs) >= 2
    reasons = [t["reason"] for t in txs]
    assert "QUIZ_REWARD" in reasons
    assert "VOUCHER_CLAIM" in reasons


def test_quiz_validation_and_anti_cheat(client: TestClient, db_engine: Engine) -> None:
    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    user = client.post(
        "/api/auth/register",
        json={
            "email": "anticheat@danangacy.vn",
            "password": "Password123",
            "display_name": "AntiCheat Tester",
        },
    ).json()
    headers = {"Authorization": f"Bearer {user['access_token']}"}

    quizzes = client.get("/api/quizzes", headers=headers).json()
    quiz = quizzes[0]
    q1 = quiz["questions"][0]
    q2 = quiz["questions"][1]

    # 1. Option ID from question 1 used for question 2 (Cross-question option fraud)
    fraud_payload = {
        "answers": [
            {"question_id": q1["id"], "selected_option_id": q1["options"][0]["id"]},
            {"question_id": q2["id"], "selected_option_id": q1["options"][0]["id"]},
        ]
    }
    fraud_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json=fraud_payload, headers=headers
    )
    assert fraud_res.status_code == 400
    assert "không thuộc câu hỏi" in fraud_res.json()["detail"]

    # 2. Non-existent option ID
    fake_opt_payload = {
        "answers": [
            {"question_id": q1["id"], "selected_option_id": 999999},
        ]
    }
    fake_opt_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json=fake_opt_payload, headers=headers
    )
    assert fake_opt_res.status_code == 400
    assert "không thuộc câu hỏi" in fake_opt_res.json()["detail"]

    # 3. Duplicate question ID in submission
    dup_q_payload = {
        "answers": [
            {"question_id": q1["id"], "selected_option_id": q1["options"][0]["id"]},
            {"question_id": q1["id"], "selected_option_id": q1["options"][1]["id"]},
        ]
    }
    dup_q_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json=dup_q_payload, headers=headers
    )
    assert dup_q_res.status_code == 400
    assert "trùng lặp" in dup_q_res.json()["detail"]

    # 4. Question ID not belonging to this quiz
    fake_q_payload = {
        "answers": [
            {"question_id": 999999, "selected_option_id": q1["options"][0]["id"]},
        ]
    }
    fake_q_res = client.post(
        f"/api/quizzes/{quiz['id']}/submit", json=fake_q_payload, headers=headers
    )
    assert fake_q_res.status_code == 400
    assert "không thuộc bài trắc nghiệm" in fake_q_res.json()["detail"]


def test_concurrent_quiz_submissions_no_double_reward(
    client: TestClient, db_engine: Engine
) -> None:
    from app.repositories.quiz_repository import QuizRepository

    with Session(db_engine) as session, session.begin():
        seed_demo_data(session)

    user = client.post(
        "/api/auth/register",
        json={
            "email": "race_player@danangacy.vn",
            "password": "Password123",
            "display_name": "Race Player",
        },
    ).json()
    token = user["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    quiz = client.get("/api/quizzes", headers=headers).json()[0]
    detail = client.get(f"/api/quizzes/{quiz['id']}", headers=headers).json()

    answers = []
    with Session(db_engine) as session:
        for q in detail["questions"]:
            from app.models.quiz import QuizOption

            opts = list(
                session.scalars(select(QuizOption).where(QuizOption.question_id == q["id"]))
            )
            correct_opt = next(opt for opt in opts if opt.is_correct)
            answers.append({"question_id": q["id"], "selected_option_id": correct_opt.id})

    # 1. Normal submission awards 50 points
    res1 = client.post(
        f"/api/quizzes/{quiz['id']}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert res1.status_code == 200
    assert res1.json()["points_awarded"] == 50
    assert res1.json()["balance_points"] == 50

    # 2. Sequential duplicate submission returns 0 points awarded
    res2 = client.post(
        f"/api/quizzes/{quiz['id']}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert res2.status_code == 200
    assert res2.json()["points_awarded"] == 0
    assert res2.json()["balance_points"] == 50
    assert "trước đó" in res2.json()["message"]

    # 3. Simulate race condition where RewardGrant unique constraint raises IntegrityError.
    # The nested transaction must catch it, rollback savepoint, and return 0 points.
    def mock_add_reward(self, grant):
        raise IntegrityError(
            "UNIQUE constraint failed: reward_grants.owner_uid, reward_grants.quiz_id",
            params=None,
            orig=Exception("UNIQUE constraint failed"),
        )

    with patch.object(QuizRepository, "add_reward_grant", mock_add_reward):
        # We need a user who hasn't been granted yet
        user2 = client.post(
            "/api/auth/register",
            json={
                "email": "race_player2@danangacy.vn",
                "password": "Password123",
                "display_name": "Race Player Two",
            },
        ).json()
        headers2 = {"Authorization": f"Bearer {user2['access_token']}"}

        res3 = client.post(
            f"/api/quizzes/{quiz['id']}/submit",
            json={"answers": answers},
            headers=headers2,
        )
        assert res3.status_code == 200
        assert res3.json()["points_awarded"] == 0
        assert "trước đó" in res3.json()["message"]

    # Final wallet balance for user2 is 0 (no points awarded due to race condition conflict)
    wallet2 = client.get("/api/wallet/me", headers=headers2).json()
    assert wallet2["balance_points"] == 0
