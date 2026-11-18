from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WalletRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_uid: str
    balance_points: int
    updated_at: datetime | None = None


class PointTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    delta_points: int
    reason: str
    balance_after: int
    created_at: datetime


class VoucherOfferRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    merchant_name: str | None = None
    points_cost: int
    total_stock: int
    remaining_stock: int
    valid_from: datetime
    valid_until: datetime
    status: str


class VoucherClaimRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    offer_id: int
    points_spent: int
    voucher_code: str
    status: str
    issued_at: datetime
    expires_at: datetime
    used_at: datetime | None = None
    offer_snapshot: dict = Field(default_factory=dict)
