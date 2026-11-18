from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.reward import PointTransaction, VoucherClaim, VoucherOffer, Wallet


class RewardRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_or_create_wallet(self, user_uid: str) -> Wallet:
        wallet = self.session.get(Wallet, user_uid)
        if wallet is None:
            wallet = Wallet(user_uid=user_uid, balance_points=0)
            self.session.add(wallet)
            self.session.flush()
        return wallet

    def update_balance(
        self, user_uid: str, delta_points: int, reason: str, source_id: int | None = None
    ) -> tuple[Wallet, PointTransaction]:
        wallet = self.get_or_create_wallet(user_uid)
        new_balance = wallet.balance_points + delta_points
        if new_balance < 0:
            raise ValueError("Số dư điểm không thể âm.")

        wallet.balance_points = new_balance
        tx = PointTransaction(
            user_uid=user_uid,
            delta_points=delta_points,
            reason=reason,
            source_id=source_id,
            balance_after=new_balance,
        )
        self.session.add(tx)
        self.session.flush()
        return wallet, tx

    def list_transactions(self, user_uid: str, limit: int = 50) -> list[PointTransaction]:
        stmt = (
            select(PointTransaction)
            .where(PointTransaction.user_uid == user_uid)
            .order_by(desc(PointTransaction.created_at))
            .limit(limit)
        )
        return list(self.session.scalars(stmt))

    def list_offers(self) -> list[VoucherOffer]:
        stmt = (
            select(VoucherOffer)
            .where(VoucherOffer.status == "PUBLISHED")
            .order_by(VoucherOffer.points_cost)
        )
        return list(self.session.scalars(stmt))

    def get_offer(self, offer_id: int) -> VoucherOffer | None:
        return self.session.get(VoucherOffer, offer_id)

    def get_user_claim(self, owner_uid: str, offer_id: int) -> VoucherClaim | None:
        stmt = select(VoucherClaim).where(
            VoucherClaim.owner_uid == owner_uid, VoucherClaim.offer_id == offer_id
        )
        return self.session.scalar(stmt)

    def add_claim(self, claim: VoucherClaim) -> VoucherClaim:
        self.session.add(claim)
        self.session.flush()
        return claim

    def list_user_claims(self, owner_uid: str) -> list[VoucherClaim]:
        stmt = (
            select(VoucherClaim)
            .where(VoucherClaim.owner_uid == owner_uid)
            .order_by(desc(VoucherClaim.issued_at))
        )
        return list(self.session.scalars(stmt))
