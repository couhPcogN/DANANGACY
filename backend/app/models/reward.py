from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import JSON_DOCUMENT, IntegerPrimaryKey, Timestamps


class Wallet(Base):
    __tablename__ = "wallets"
    __table_args__ = (CheckConstraint("balance_points >= 0", name="balance_nonnegative"),)

    user_uid: Mapped[str] = mapped_column(String(128), ForeignKey("users.uid"), primary_key=True)
    balance_points: Mapped[int] = mapped_column(default=0, server_default="0")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PointTransaction(IntegerPrimaryKey, Base):
    __tablename__ = "point_transactions"
    __table_args__ = (
        CheckConstraint("delta_points <> 0", name="delta_nonzero"),
        CheckConstraint("balance_after >= 0", name="balance_nonnegative"),
        Index("ix_point_transactions_user_uid_created_at", "user_uid", "created_at"),
    )

    user_uid: Mapped[str] = mapped_column(String(128), ForeignKey("wallets.user_uid"))
    delta_points: Mapped[int]
    reason: Mapped[str] = mapped_column(String(40))
    source_id: Mapped[int | None]
    balance_after: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class VoucherOffer(IntegerPrimaryKey, Timestamps, Base):
    __tablename__ = "voucher_offers"
    __table_args__ = (
        CheckConstraint("points_cost > 0", name="cost_positive"),
        CheckConstraint("total_stock >= 0", name="stock_nonnegative"),
        CheckConstraint("remaining_stock BETWEEN 0 AND total_stock", name="remaining_stock_range"),
        CheckConstraint("valid_until > valid_from", name="validity_order"),
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')", name="status_values"),
    )

    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)
    merchant_name: Mapped[str | None] = mapped_column(String(160))
    points_cost: Mapped[int]
    total_stock: Mapped[int]
    remaining_stock: Mapped[int]
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", server_default="DRAFT")


class VoucherClaim(IntegerPrimaryKey, Base):
    __tablename__ = "voucher_claims"
    __table_args__ = (
        UniqueConstraint("owner_uid", "offer_id"),
        CheckConstraint("points_spent > 0", name="points_positive"),
        CheckConstraint("expires_at > issued_at", name="expiry_order"),
        CheckConstraint("used_at >= issued_at", name="usage_order"),
        CheckConstraint(
            "status IN ('ISSUED', 'USED', 'EXPIRED', 'CANCELLED')", name="status_values"
        ),
    )

    owner_uid: Mapped[str] = mapped_column(String(128), ForeignKey("users.uid"))
    offer_id: Mapped[int] = mapped_column(ForeignKey("voucher_offers.id"))
    points_spent: Mapped[int]
    offer_snapshot: Mapped[dict] = mapped_column(JSON_DOCUMENT)
    voucher_code: Mapped[str] = mapped_column(
        String(100), unique=True, default=lambda: f"DEMO-{uuid4().hex.upper()}"
    )
    status: Mapped[str] = mapped_column(String(20), default="ISSUED", server_default="ISSUED")
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
