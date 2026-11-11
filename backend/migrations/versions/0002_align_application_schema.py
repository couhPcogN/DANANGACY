"""align_application_schema

Revision ID: 0002
Revises: 0001
"""

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from uuid import NAMESPACE_URL, uuid5
from zoneinfo import ZoneInfo

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _transition_tables(names: tuple[str, ...]) -> dict[str, sa.Table]:
    metadata = sa.MetaData()
    bind = op.get_bind()
    tables = {name: sa.Table(name, metadata, autoload_with=bind) for name in names}
    uuid_columns = {
        "destinations": ("id",),
        "trips": ("id",),
        "trip_stops": ("trip_id",),
        "itineraries": ("id",),
        "itinerary_items": ("id", "itinerary_id", "destination_id"),
    }
    # SQLite reflects UUID storage as CHAR; restore the portable UUID bind/result processors.
    for name, columns in uuid_columns.items():
        if name in tables:
            for column in columns:
                tables[name].c[column].type = sa.Uuid()
    return tables


def _default_destinations() -> dict[str, tuple[str, str]]:
    return {
        "cham": ("Bảo tàng Điêu khắc Chăm", "INDOOR"),
        "son-tra": ("Bán đảo Sơn Trà", "OUTDOOR"),
        "cau-rong": ("Cầu Rồng", "OUTDOOR"),
        "ngu-hanh-son": ("Ngũ Hành Sơn", "OUTDOOR"),
        "bao-tang-dn": ("Bảo tàng Đà Nẵng", "INDOOR"),
        "chua-cau": ("Chùa Cầu", "OUTDOOR"),
        "tan-ky": ("Nhà cổ Tấn Ký", "INDOOR"),
        "hoai-river": ("Bờ sông Hoài", "OUTDOOR"),
    }


def _migrate_legacy_data() -> None:
    bind = op.get_bind()
    tables = _transition_tables(
        (
            "users",
            "destinations",
            "itineraries",
            "itinerary_items",
            "trips",
            "trip_stops",
        )
    )
    bind.execute(
        tables["users"].insert(),
        {
            "uid": "demo-user",
            "display_name": "Người dùng demo",
            "interest_tags": [],
            "status": "ACTIVE",
        },
    )
    demo = _default_destinations()
    legacy_slugs = set(bind.scalars(sa.select(tables["trip_stops"].c.place_id)))
    destinations = {}
    for slug in sorted(set(demo) | legacy_slugs):
        identifier = uuid5(NAMESPACE_URL, f"danangacy:destination:{slug}")
        name, environment = demo.get(slug, (slug[:150], "MIXED"))
        bind.execute(
            tables["destinations"].insert(),
            {
                "id": identifier,
                "slug": slug,
                "name": name,
                "environment": environment,
                "image_urls": [],
                "status": "PUBLISHED" if slug in demo else "DRAFT",
            },
        )
        destinations[slug] = identifier

    trips = {row["id"]: row for row in bind.execute(sa.select(tables["trips"])).mappings()}
    for row in trips.values():
        bind.execute(
            tables["itineraries"].insert(),
            {
                "id": row["id"],
                "owner_uid": "demo-user",
                "title": row["title"],
                "visit_date": row["date"],
                "duration": row["duration"],
                "pace": row["pace"],
                "status": "SAVED",
                "version": 1,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            },
        )
    local_zone = ZoneInfo("Asia/Ho_Chi_Minh")
    for row in bind.execute(sa.select(tables["trip_stops"])).mappings():
        parent = trips[row["trip_id"]]
        day = parent["date"] + timedelta(days=row["day"] - 1)
        start = datetime.combine(day, row["start"], tzinfo=local_zone).astimezone(UTC)
        end = datetime.combine(day, row["end"], tzinfo=local_zone).astimezone(UTC)
        bind.execute(
            tables["itinerary_items"].insert(),
            {
                "id": uuid5(NAMESPACE_URL, f"danangacy:legacy-stop:{row['trip_id']}:{row['id']}"),
                "itinerary_id": row["trip_id"],
                "destination_id": destinations[row["place_id"]],
                "position": row["position"],
                "planned_start_at": start,
                "planned_end_at": end,
                "created_at": parent["created_at"],
            },
        )


def _check_downgrade() -> None:
    bind = op.get_bind()
    # 0001 has nowhere to store these features. Refuse rather than silently discard user data.
    for name in (
        "favorites",
        "quizzes",
        "quiz_questions",
        "quiz_options",
        "quiz_attempts",
        "quiz_attempt_answers",
        "wallets",
        "point_transactions",
        "reward_grants",
        "voucher_offers",
        "voucher_claims",
    ):
        table = sa.Table(name, sa.MetaData(), autoload_with=bind)
        if bind.scalar(sa.select(sa.func.count()).select_from(table)):
            raise RuntimeError(f"Cannot downgrade: {name} contains data. Export it first.")
    itineraries = sa.Table("itineraries", sa.MetaData(), autoload_with=bind)
    unsupported = sa.or_(
        itineraries.c.deleted_at.is_not(None),
        itineraries.c.owner_uid != "demo-user",
        itineraries.c.status != "SAVED",
    )
    if bind.scalar(sa.select(sa.func.count()).select_from(itineraries).where(unsupported)):
        raise RuntimeError(
            "Cannot downgrade soft-deleted, draft, completed or non-demo itineraries."
        )
    users = sa.Table("users", sa.MetaData(), autoload_with=bind)
    if bind.scalar(sa.select(sa.func.count()).select_from(users).where(users.c.uid != "demo-user")):
        raise RuntimeError("Cannot downgrade: additional user profiles would be lost.")
    profile = bind.execute(sa.select(users)).mappings().one()
    if (
        profile["display_name"] != "Người dùng demo"
        or profile["status"] != "ACTIVE"
        or profile["interest_tags"] != []
        or any(profile[field] is not None for field in ("email", "phone", "avatar_url"))
    ):
        raise RuntimeError("Cannot downgrade: the demo profile contains new information.")
    catalog = _transition_tables(("destinations", "itinerary_items"))
    referenced = set(bind.scalars(sa.select(catalog["itinerary_items"].c.destination_id)))
    defaults = _default_destinations()
    for row in bind.execute(sa.select(catalog["destinations"])).mappings():
        name, environment = defaults.get(row["slug"], (row["slug"][:150], "MIXED"))
        if (
            (row["slug"] not in defaults and row["id"] not in referenced)
            or row["name"] != name
            or row["environment"] != environment
            or row["image_urls"] != []
            or row["status"] != ("PUBLISHED" if row["slug"] in defaults else "DRAFT")
            or any(
                row[field] is not None
                for field in (
                    "description",
                    "category",
                    "area",
                    "latitude",
                    "longitude",
                    "address",
                    "opening_hours",
                    "estimated_visit_minutes",
                )
            )
        ):
            raise RuntimeError("Cannot downgrade: destination catalog information would be lost.")


def _restore_legacy_data() -> None:
    bind = op.get_bind()
    tables = _transition_tables(
        ("itineraries", "itinerary_items", "destinations", "trips", "trip_stops")
    )
    trips = {row["id"]: row for row in bind.execute(sa.select(tables["itineraries"])).mappings()}
    destinations = dict(
        bind.execute(sa.select(tables["destinations"].c.id, tables["destinations"].c.slug)).all()
    )
    for row in trips.values():
        bind.execute(
            tables["trips"].insert(),
            {
                "id": row["id"],
                "title": row["title"],
                "date": row["visit_date"],
                "duration": row["duration"],
                "pace": row["pace"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            },
        )
    local_zone = ZoneInfo("Asia/Ho_Chi_Minh")
    items = tables["itinerary_items"]
    for position, row in enumerate(
        bind.execute(sa.select(items).order_by(items.c.itinerary_id, items.c.position)).mappings(),
        start=1,
    ):
        start, end = row["planned_start_at"], row["planned_end_at"]
        if start.tzinfo is None:
            start, end = start.replace(tzinfo=UTC), end.replace(tzinfo=UTC)
        start, end = start.astimezone(local_zone), end.astimezone(local_zone)
        bind.execute(
            tables["trip_stops"].insert(),
            {
                "id": position,
                "trip_id": row["itinerary_id"],
                "place_id": destinations[row["destination_id"]],
                "position": row["position"],
                "day": (start.date() - trips[row["itinerary_id"]]["visit_date"]).days + 1,
                "start": start.time(),
                "end": end.time(),
            },
        )
    if bind.dialect.name == "postgresql":
        bind.execute(
            sa.text(
                "SELECT setval(pg_get_serial_sequence('trip_stops', 'id'), "
                "GREATEST(COALESCE((SELECT MAX(id) FROM trip_stops), 1), 1), "
                "EXISTS(SELECT 1 FROM trip_stops))"
            )
        )


def upgrade() -> None:
    op.create_table(
        "destinations",
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("environment", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("area", sa.String(length=150), nullable=True),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("address", sa.String(length=300), nullable=True),
        sa.Column(
            "opening_hours",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            nullable=True,
        ),
        sa.Column("estimated_visit_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "image_urls",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), server_default="PUBLISHED", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "environment IN ('INDOOR', 'OUTDOOR', 'MIXED')",
            name=op.f("ck_destinations_environment_values"),
        ),
        sa.CheckConstraint(
            "status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')",
            name=op.f("ck_destinations_status_values"),
        ),
        sa.CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)",
            name=op.f("ck_destinations_coordinates_pair"),
        ),
        sa.CheckConstraint(
            "estimated_visit_minutes > 0", name=op.f("ck_destinations_visit_minutes_positive")
        ),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90", name=op.f("ck_destinations_latitude_range")
        ),
        sa.CheckConstraint(
            "longitude BETWEEN -180 AND 180", name=op.f("ck_destinations_longitude_range")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_destinations")),
        sa.UniqueConstraint("slug", name=op.f("uq_destinations_slug")),
    )
    op.create_table(
        "users",
        sa.Column("uid", sa.String(length=128), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "interest_tags",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), server_default="ACTIVE", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("status IN ('ACTIVE', 'DISABLED')", name=op.f("ck_users_status_values")),
        sa.PrimaryKeyConstraint("uid", name=op.f("pk_users")),
    )
    op.create_table(
        "voucher_offers",
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("merchant_name", sa.String(length=160), nullable=True),
        sa.Column("points_cost", sa.Integer(), nullable=False),
        sa.Column("total_stock", sa.Integer(), nullable=False),
        sa.Column("remaining_stock", sa.Integer(), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="DRAFT", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')",
            name=op.f("ck_voucher_offers_status_values"),
        ),
        sa.CheckConstraint("points_cost > 0", name=op.f("ck_voucher_offers_cost_positive")),
        sa.CheckConstraint(
            "remaining_stock BETWEEN 0 AND total_stock",
            name=op.f("ck_voucher_offers_remaining_stock_range"),
        ),
        sa.CheckConstraint("total_stock >= 0", name=op.f("ck_voucher_offers_stock_nonnegative")),
        sa.CheckConstraint(
            "valid_until > valid_from", name=op.f("ck_voucher_offers_validity_order")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_voucher_offers")),
    )
    op.create_table(
        "favorites",
        sa.Column("user_uid", sa.String(length=128), nullable=False),
        sa.Column("destination_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["destination_id"],
            ["destinations.id"],
            name=op.f("fk_favorites_destination_id_destinations"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_uid"],
            ["users.uid"],
            name=op.f("fk_favorites_user_uid_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_uid", "destination_id", name=op.f("pk_favorites")),
    )
    op.create_table(
        "itineraries",
        sa.Column("owner_uid", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("duration", sa.Integer(), server_default="1", nullable=False),
        sa.Column("pace", sa.String(length=30), server_default="Thư thả", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="DRAFT", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "pace IN ('Thư thả', 'Cân bằng', 'Năng động')", name=op.f("ck_itineraries_pace_values")
        ),
        sa.CheckConstraint(
            "status IN ('DRAFT', 'SAVED', 'COMPLETED')", name=op.f("ck_itineraries_status_values")
        ),
        sa.CheckConstraint("duration BETWEEN 1 AND 3", name=op.f("ck_itineraries_duration_range")),
        sa.CheckConstraint("length(trim(title)) > 0", name=op.f("ck_itineraries_title_not_blank")),
        sa.CheckConstraint("version >= 1", name=op.f("ck_itineraries_version_positive")),
        sa.ForeignKeyConstraint(
            ["owner_uid"], ["users.uid"], name=op.f("fk_itineraries_owner_uid_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_itineraries")),
    )
    op.create_index(
        "ix_itineraries_owner_uid_visit_date",
        "itineraries",
        ["owner_uid", "visit_date"],
        unique=False,
    )
    op.create_table(
        "quizzes",
        sa.Column("destination_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("pass_score", sa.Integer(), server_default="3", nullable=False),
        sa.Column("reward_points", sa.Integer(), server_default="50", nullable=False),
        sa.Column("time_limit_minutes", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="DRAFT", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')", name=op.f("ck_quizzes_status_values")
        ),
        sa.CheckConstraint("pass_score BETWEEN 0 AND 5", name=op.f("ck_quizzes_pass_score_range")),
        sa.CheckConstraint("reward_points >= 0", name=op.f("ck_quizzes_reward_points_nonnegative")),
        sa.CheckConstraint("time_limit_minutes > 0", name=op.f("ck_quizzes_time_limit_positive")),
        sa.ForeignKeyConstraint(
            ["destination_id"],
            ["destinations.id"],
            name=op.f("fk_quizzes_destination_id_destinations"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quizzes")),
    )
    op.create_index(op.f("ix_quizzes_destination_id"), "quizzes", ["destination_id"], unique=False)
    op.create_table(
        "voucher_claims",
        sa.Column("owner_uid", sa.String(length=128), nullable=False),
        sa.Column("offer_id", sa.Uuid(), nullable=False),
        sa.Column("points_spent", sa.Integer(), nullable=False),
        sa.Column(
            "offer_snapshot",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            nullable=False,
        ),
        sa.Column("voucher_code", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="ISSUED", nullable=False),
        sa.Column(
            "issued_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "status IN ('ISSUED', 'USED', 'EXPIRED', 'CANCELLED')",
            name=op.f("ck_voucher_claims_status_values"),
        ),
        sa.CheckConstraint("expires_at > issued_at", name=op.f("ck_voucher_claims_expiry_order")),
        sa.CheckConstraint("points_spent > 0", name=op.f("ck_voucher_claims_points_positive")),
        sa.CheckConstraint("used_at >= issued_at", name=op.f("ck_voucher_claims_usage_order")),
        sa.ForeignKeyConstraint(
            ["offer_id"],
            ["voucher_offers.id"],
            name=op.f("fk_voucher_claims_offer_id_voucher_offers"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_uid"], ["users.uid"], name=op.f("fk_voucher_claims_owner_uid_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_voucher_claims")),
        sa.UniqueConstraint("owner_uid", "offer_id", name=op.f("uq_voucher_claims_owner_uid")),
        sa.UniqueConstraint("voucher_code", name=op.f("uq_voucher_claims_voucher_code")),
    )
    op.create_table(
        "wallets",
        sa.Column("user_uid", sa.String(length=128), nullable=False),
        sa.Column("balance_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("balance_points >= 0", name=op.f("ck_wallets_balance_nonnegative")),
        sa.ForeignKeyConstraint(
            ["user_uid"], ["users.uid"], name=op.f("fk_wallets_user_uid_users")
        ),
        sa.PrimaryKeyConstraint("user_uid", name=op.f("pk_wallets")),
    )
    op.create_table(
        "itinerary_items",
        sa.Column("itinerary_id", sa.Uuid(), nullable=False),
        sa.Column("destination_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("planned_start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "planned_start_at < planned_end_at", name=op.f("ck_itinerary_items_time_order")
        ),
        sa.CheckConstraint("position >= 0", name=op.f("ck_itinerary_items_position_nonnegative")),
        sa.ForeignKeyConstraint(
            ["destination_id"],
            ["destinations.id"],
            name=op.f("fk_itinerary_items_destination_id_destinations"),
        ),
        sa.ForeignKeyConstraint(
            ["itinerary_id"],
            ["itineraries.id"],
            name=op.f("fk_itinerary_items_itinerary_id_itineraries"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_itinerary_items")),
        sa.UniqueConstraint(
            "itinerary_id", "position", name=op.f("uq_itinerary_items_itinerary_id")
        ),
    )
    op.create_index(
        op.f("ix_itinerary_items_destination_id"),
        "itinerary_items",
        ["destination_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_itinerary_items_itinerary_id"), "itinerary_items", ["itinerary_id"], unique=False
    )
    op.create_table(
        "point_transactions",
        sa.Column("user_uid", sa.String(length=128), nullable=False),
        sa.Column("delta_points", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=40), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "balance_after >= 0", name=op.f("ck_point_transactions_balance_nonnegative")
        ),
        sa.CheckConstraint("delta_points <> 0", name=op.f("ck_point_transactions_delta_nonzero")),
        sa.ForeignKeyConstraint(
            ["user_uid"], ["wallets.user_uid"], name=op.f("fk_point_transactions_user_uid_wallets")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_point_transactions")),
    )
    op.create_index(
        "ix_point_transactions_user_uid_created_at",
        "point_transactions",
        ["user_uid", "created_at"],
        unique=False,
    )
    op.create_table(
        "quiz_attempts",
        sa.Column("owner_uid", sa.String(length=128), nullable=False),
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="IN_PROGRESS", nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=True),
        sa.Column("points_awarded", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED')",
            name=op.f("ck_quiz_attempts_status_values"),
        ),
        sa.CheckConstraint(
            "correct_count BETWEEN 0 AND 5", name=op.f("ck_quiz_attempts_correct_count_range")
        ),
        sa.CheckConstraint("expires_at > started_at", name=op.f("ck_quiz_attempts_expiry_order")),
        sa.CheckConstraint("points_awarded >= 0", name=op.f("ck_quiz_attempts_points_nonnegative")),
        sa.CheckConstraint(
            "submitted_at >= started_at", name=op.f("ck_quiz_attempts_submission_order")
        ),
        sa.ForeignKeyConstraint(
            ["owner_uid"], ["users.uid"], name=op.f("fk_quiz_attempts_owner_uid_users")
        ),
        sa.ForeignKeyConstraint(
            ["quiz_id"], ["quizzes.id"], name=op.f("fk_quiz_attempts_quiz_id_quizzes")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_attempts")),
    )
    op.create_index(
        "ix_quiz_attempts_owner_uid_quiz_id",
        "quiz_attempts",
        ["owner_uid", "quiz_id"],
        unique=False,
    )
    op.create_table(
        "quiz_questions",
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("position >= 0", name=op.f("ck_quiz_questions_position_nonnegative")),
        sa.ForeignKeyConstraint(
            ["quiz_id"],
            ["quizzes.id"],
            name=op.f("fk_quiz_questions_quiz_id_quizzes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_questions")),
        sa.UniqueConstraint("quiz_id", "position", name=op.f("uq_quiz_questions_quiz_id")),
    )
    op.create_table(
        "quiz_options",
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("option_text", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("position BETWEEN 0 AND 3", name=op.f("ck_quiz_options_position_range")),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["quiz_questions.id"],
            name=op.f("fk_quiz_options_question_id_quiz_questions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_options")),
        sa.UniqueConstraint("question_id", "position", name=op.f("uq_quiz_options_question_id")),
    )
    op.create_table(
        "reward_grants",
        sa.Column("owner_uid", sa.String(length=128), nullable=False),
        sa.Column("quiz_id", sa.Uuid(), nullable=False),
        sa.Column("attempt_id", sa.Uuid(), nullable=False),
        sa.Column("points_awarded", sa.Integer(), server_default="50", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint("points_awarded >= 0", name=op.f("ck_reward_grants_points_nonnegative")),
        sa.ForeignKeyConstraint(
            ["attempt_id"],
            ["quiz_attempts.id"],
            name=op.f("fk_reward_grants_attempt_id_quiz_attempts"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_uid"], ["users.uid"], name=op.f("fk_reward_grants_owner_uid_users")
        ),
        sa.ForeignKeyConstraint(
            ["quiz_id"], ["quizzes.id"], name=op.f("fk_reward_grants_quiz_id_quizzes")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reward_grants")),
        sa.UniqueConstraint("attempt_id", name=op.f("uq_reward_grants_attempt_id")),
        sa.UniqueConstraint("owner_uid", "quiz_id", name=op.f("uq_reward_grants_owner_uid")),
    )
    op.create_table(
        "quiz_attempt_answers",
        sa.Column("attempt_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("selected_option_id", sa.Uuid(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["attempt_id"],
            ["quiz_attempts.id"],
            name=op.f("fk_quiz_attempt_answers_attempt_id_quiz_attempts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["quiz_questions.id"],
            name=op.f("fk_quiz_attempt_answers_question_id_quiz_questions"),
        ),
        sa.ForeignKeyConstraint(
            ["selected_option_id"],
            ["quiz_options.id"],
            name=op.f("fk_quiz_attempt_answers_selected_option_id_quiz_options"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quiz_attempt_answers")),
        sa.UniqueConstraint(
            "attempt_id", "question_id", name=op.f("uq_quiz_attempt_answers_attempt_id")
        ),
    )
    _migrate_legacy_data()
    op.drop_index(op.f("ix_trip_stops_trip_id"), table_name="trip_stops")
    op.drop_table("trip_stops")
    op.drop_index(op.f("ix_trips_created_at"), table_name="trips")
    op.drop_table("trips")


def downgrade() -> None:
    _check_downgrade()
    op.create_table(
        "trips",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("pace", sa.String(30), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("duration BETWEEN 1 AND 3", name=op.f("ck_trips_duration_range")),
        sa.CheckConstraint("length(trim(title)) > 0", name=op.f("ck_trips_title_not_blank")),
        sa.CheckConstraint(
            "pace IN ('Thư thả', 'Cân bằng', 'Năng động')", name=op.f("ck_trips_pace_values")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_trips")),
    )
    op.create_index("ix_trips_created_at", "trips", ["created_at"])
    op.create_table(
        "trip_stops",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Uuid(), nullable=False),
        sa.Column("place_id", sa.String(100), nullable=False),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("start", sa.Time(), nullable=False),
        sa.Column("end", sa.Time(), nullable=False),
        sa.CheckConstraint("day BETWEEN 1 AND 3", name=op.f("ck_trip_stops_day_range")),
        sa.CheckConstraint("position >= 0", name=op.f("ck_trip_stops_position_nonnegative")),
        sa.CheckConstraint('"start" < "end"', name=op.f("ck_trip_stops_time_order")),
        sa.ForeignKeyConstraint(
            ["trip_id"], ["trips.id"], ondelete="CASCADE", name=op.f("fk_trip_stops_trip_id_trips")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_trip_stops")),
        sa.UniqueConstraint("trip_id", "position", name=op.f("uq_trip_stops_trip_id")),
    )
    op.create_index("ix_trip_stops_trip_id", "trip_stops", ["trip_id"])

    _restore_legacy_data()
    op.drop_table("quiz_attempt_answers")
    op.drop_table("reward_grants")
    op.drop_table("quiz_options")
    op.drop_table("quiz_questions")
    op.drop_index("ix_quiz_attempts_owner_uid_quiz_id", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")
    op.drop_index("ix_point_transactions_user_uid_created_at", table_name="point_transactions")
    op.drop_table("point_transactions")
    op.drop_index(op.f("ix_itinerary_items_itinerary_id"), table_name="itinerary_items")
    op.drop_index(op.f("ix_itinerary_items_destination_id"), table_name="itinerary_items")
    op.drop_table("itinerary_items")
    op.drop_table("wallets")
    op.drop_table("voucher_claims")
    op.drop_index(op.f("ix_quizzes_destination_id"), table_name="quizzes")
    op.drop_table("quizzes")
    op.drop_index("ix_itineraries_owner_uid_visit_date", table_name="itineraries")
    op.drop_table("itineraries")
    op.drop_table("favorites")
    op.drop_table("voucher_offers")
    op.drop_table("users")
    op.drop_table("destinations")
