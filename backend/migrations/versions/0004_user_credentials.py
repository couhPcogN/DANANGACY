"""Add login credentials to users.

Revision ID: 0004
Revises: 0003

Adds a nullable password hash and a unique index on email. Existing profiles,
including the demo user, keep NULL credentials and cannot log in until registered.
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    users = sa.Table("users", sa.MetaData(), autoload_with=bind)
    has_credentials = bind.scalar(
        sa.select(sa.func.count()).select_from(users).where(users.c.password_hash.is_not(None))
    )
    if has_credentials:
        raise RuntimeError("Cannot downgrade: users.password_hash contains data. Export it first.")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "password_hash")
