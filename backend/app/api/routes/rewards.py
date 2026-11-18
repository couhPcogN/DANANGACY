from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_current_user_uid, get_reward_service
from app.schemas.reward import PointTransactionRead, VoucherClaimRead, VoucherOfferRead, WalletRead
from app.services.reward_service import RewardService

router = APIRouter(tags=["Rewards & Wallet"])


@router.get("/wallet/me", response_model=WalletRead)
def get_my_wallet(
    user_uid: Annotated[str, Depends(get_current_user_uid)],
    service: Annotated[RewardService, Depends(get_reward_service)],
) -> WalletRead:
    """Lấy số dư điểm di sản hiện tại của người dùng."""
    return service.get_wallet(user_uid)


@router.get("/wallet/transactions", response_model=list[PointTransactionRead])
def get_my_transactions(
    user_uid: Annotated[str, Depends(get_current_user_uid)],
    service: Annotated[RewardService, Depends(get_reward_service)],
) -> list[PointTransactionRead]:
    """Lấy lịch sử giao dịch điểm di sản."""
    return service.list_transactions(user_uid)


@router.get("/vouchers", response_model=list[VoucherOfferRead])
def list_vouchers(
    service: Annotated[RewardService, Depends(get_reward_service)],
) -> list[VoucherOfferRead]:
    """Danh sách các gói ưu đãi / voucher di sản có thể đổi."""
    return service.list_offers()


@router.post(
    "/vouchers/{offer_id}/claim",
    response_model=VoucherClaimRead,
    status_code=status.HTTP_201_CREATED,
)
def claim_voucher(
    offer_id: int,
    user_uid: Annotated[str, Depends(get_current_user_uid)],
    service: Annotated[RewardService, Depends(get_reward_service)],
) -> VoucherClaimRead:
    """Đổi điểm di sản để nhận mã ưu đãi voucher."""
    return service.claim_voucher(owner_uid=user_uid, offer_id=offer_id)


@router.get("/vouchers/my-claims", response_model=list[VoucherClaimRead])
def get_my_vouchers(
    user_uid: Annotated[str, Depends(get_current_user_uid)],
    service: Annotated[RewardService, Depends(get_reward_service)],
) -> list[VoucherClaimRead]:
    """Danh sách mã ưu đãi đã đổi của người dùng."""
    return service.list_my_claims(owner_uid=user_uid)
