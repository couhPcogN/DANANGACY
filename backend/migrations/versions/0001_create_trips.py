"""Create trips and ordered trip stops.

Revision ID: 0001
Revises: None
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index("ix_trip_stops_trip_id", table_name="trip_stops")
    op.drop_table("trip_stops")
    op.drop_index("ix_trips_created_at", table_name="trips")
    op.drop_table("trips")
