from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import (
    InsufficientPointsError,
    VoucherAlreadyClaimedError,
    VoucherOfferNotFoundError,
    VoucherOutOfStockError,
)
from app.models.reward import VoucherClaim
from app.repositories.reward_repository import RewardRepository
from app.schemas.reward import PointTransactionRead, VoucherClaimRead, VoucherOfferRead, WalletRead


class RewardService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = RewardRepository(session)

    def get_wallet(self, user_uid: str) -> WalletRead:
        wallet = self.repo.get_or_create_wallet(user_uid)
        return WalletRead.model_validate(wallet)

    def list_transactions(self, user_uid: str) -> list[PointTransactionRead]:
        txs = self.repo.list_transactions(user_uid)
        return [PointTransactionRead.model_validate(tx) for tx in txs]

    def list_offers(self) -> list[VoucherOfferRead]:
        offers = self.repo.list_offers()
        return [VoucherOfferRead.model_validate(o) for o in offers]

    def claim_voucher(self, owner_uid: str, offer_id: int) -> VoucherClaimRead:
        with self.session.begin():
            offer = self.repo.get_offer(offer_id)
            if offer is None or offer.status != "PUBLISHED":
                raise VoucherOfferNotFoundError()

            if offer.remaining_stock <= 0:
                raise VoucherOutOfStockError()

            existing_claim = self.repo.get_user_claim(owner_uid, offer.id)
            if existing_claim is not None:
                raise VoucherAlreadyClaimedError()

            wallet = self.repo.get_or_create_wallet(owner_uid)
            if wallet.balance_points < offer.points_cost:
                raise InsufficientPointsError(
                    required=offer.points_cost, current=wallet.balance_points
                )

            # Deduct stock and points
            offer.remaining_stock -= 1

            self.repo.update_balance(
                user_uid=owner_uid,
                delta_points=-offer.points_cost,
                reason="VOUCHER_CLAIM",
                source_id=offer.id,
            )

            now = datetime.now(UTC)
            claim = VoucherClaim(
                owner_uid=owner_uid,
                offer_id=offer.id,
                points_spent=offer.points_cost,
                offer_snapshot={
                    "title": offer.title,
                    "description": offer.description,
                    "merchant_name": offer.merchant_name,
                    "points_cost": offer.points_cost,
                },
                voucher_code=f"DANANG-{uuid4().hex[:8].upper()}",
                status="ISSUED",
                issued_at=now,
                expires_at=offer.valid_until,
            )
            self.repo.add_claim(claim)
            return VoucherClaimRead.model_validate(claim)

    def list_my_claims(self, owner_uid: str) -> list[VoucherClaimRead]:
        claims = self.repo.list_user_claims(owner_uid)
        return [VoucherClaimRead.model_validate(c) for c in claims]
