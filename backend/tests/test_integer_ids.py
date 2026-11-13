from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.models import Destination
from tests.conftest import migrate


def legacy_tables(engine):
    metadata = sa.MetaData()
    metadata.reflect(
        engine,
        only=[
            "destinations",
            "favorites",
            "quizzes",
            "quiz_questions",
            "quiz_options",
            "quiz_attempts",
            "quiz_attempt_answers",
            "reward_grants",
            "wallets",
            "point_transactions",
            "voucher_offers",
            "voucher_claims",
        ],
    )
    # Restore portable UUID processing when SQLite reflects legacy CHAR columns.
    for table in metadata.tables.values():
        for column in table.c:
            if column.name in {"id", "source_id"} or (
                column.foreign_keys and column.name not in {"user_uid", "owner_uid"}
            ):
                column.type = sa.Uuid()
    return metadata.tables


def test_uuid_graph_survives_integer_conversion_and_downgrade(db_engine):
    migrate(db_engine, "0002", downgrade=True)
    tables = legacy_tables(db_engine)
    names = (
        "quizzes",
        "quiz_questions",
        "quiz_options",
        "quiz_attempts",
        "quiz_attempt_answers",
        "reward_grants",
        "point_transactions",
        "voucher_offers",
        "voucher_claims",
    )
    ids = {name: uuid4() for name in names}
    now = datetime.now(UTC)
    with db_engine.begin() as conn:
        destination = conn.scalar(sa.select(tables["destinations"].c.id).limit(1))
        conn.execute(
            tables["favorites"].insert(),
            {
                "user_uid": "demo-user",
                "destination_id": destination,
            },
        )
        conn.execute(
            tables["quizzes"].insert(),
            {
                "id": ids["quizzes"],
                "destination_id": destination,
                "title": "Quiz",
            },
        )
        conn.execute(
            tables["quiz_questions"].insert(),
            {
                "id": ids["quiz_questions"],
                "quiz_id": ids["quizzes"],
                "question_text": "Question",
                "position": 0,
            },
        )
        conn.execute(
            tables["quiz_options"].insert(),
            {
                "id": ids["quiz_options"],
                "question_id": ids["quiz_questions"],
                "option_text": "Answer",
                "position": 0,
            },
        )
        conn.execute(
            tables["quiz_attempts"].insert(),
            {
                "id": ids["quiz_attempts"],
                "owner_uid": "demo-user",
                "quiz_id": ids["quizzes"],
            },
        )
        conn.execute(
            tables["quiz_attempt_answers"].insert(),
            {
                "id": ids["quiz_attempt_answers"],
                "attempt_id": ids["quiz_attempts"],
                "question_id": ids["quiz_questions"],
                "selected_option_id": ids["quiz_options"],
                "is_correct": True,
            },
        )
        conn.execute(
            tables["reward_grants"].insert(),
            {
                "id": ids["reward_grants"],
                "owner_uid": "demo-user",
                "quiz_id": ids["quizzes"],
                "attempt_id": ids["quiz_attempts"],
            },
        )
        conn.execute(tables["wallets"].insert(), {"user_uid": "demo-user"})
        conn.execute(
            tables["point_transactions"].insert(),
            {
                "id": ids["point_transactions"],
                "user_uid": "demo-user",
                "delta_points": 50,
                "reason": "QUIZ",
                "source_id": ids["reward_grants"],
                "balance_after": 50,
            },
        )
        conn.execute(
            tables["voucher_offers"].insert(),
            {
                "id": ids["voucher_offers"],
                "title": "Offer",
                "points_cost": 10,
                "total_stock": 2,
                "remaining_stock": 1,
                "valid_from": now,
                "valid_until": now + timedelta(days=1),
            },
        )
        conn.execute(
            tables["voucher_claims"].insert(),
            {
                "id": ids["voucher_claims"],
                "owner_uid": "demo-user",
                "offer_id": ids["voucher_offers"],
                "points_spent": 10,
                "offer_snapshot": {"title": "Original offer"},
                "voucher_code": "TEST-CLAIM",
                "issued_at": now,
                "expires_at": now + timedelta(hours=1),
            },
        )
    migrate(db_engine)
    metadata = sa.MetaData()
    metadata.reflect(db_engine)
    with db_engine.connect() as conn:
        for name in names:
            assert conn.scalar(sa.select(metadata.tables[name].c.id)) == 1
        for table in metadata.tables.values():
            for fk in table.foreign_keys:
                local = conn.scalar(
                    sa.select(sa.func.count())
                    .select_from(table)
                    .where(~sa.exists(sa.select(fk.column).where(fk.column == fk.parent)))
                )
                assert local == 0
        assert conn.scalar(sa.select(metadata.tables["point_transactions"].c.source_id)) == 1
    # A new insert must advance beyond the IDs copied by the migration.
    with Session(db_engine) as session, session.begin():
        place = Destination(slug="new-place", name="New place", environment="OUTDOOR")
        session.add(place)
        session.flush()
        assert place.id > 8
    migrate(db_engine, "0002", downgrade=True)
    with db_engine.connect() as conn:
        for name, old_id in ids.items():
            assert conn.scalar(sa.select(tables[name].c.id)) == old_id
        assert (
            conn.scalar(sa.select(tables["point_transactions"].c.source_id)) == ids["reward_grants"]
        )
    migrate(db_engine)


def test_unknown_point_source_aborts_without_changing_schema(db_engine):
    migrate(db_engine, "0002", downgrade=True)
    tables = legacy_tables(db_engine)
    with db_engine.begin() as conn:
        conn.execute(tables["wallets"].insert(), {"user_uid": "demo-user"})
        conn.execute(
            tables["point_transactions"].insert(),
            {
                "id": uuid4(),
                "user_uid": "demo-user",
                "delta_points": 10,
                "balance_after": 10,
                "reason": "UNKNOWN",
                "source_id": uuid4(),
            },
        )
    with pytest.raises(RuntimeError, match="unambiguously"):
        migrate(db_engine)
    with db_engine.connect() as conn:
        assert conn.scalar(sa.text("SELECT version_num FROM alembic_version")) == "0002"
        assert conn.scalar(sa.select(sa.func.count()).select_from(tables["destinations"])) == 8
