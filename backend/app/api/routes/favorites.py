from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_authenticated_user_uid, get_favorite_service
from app.schemas.destination import DestinationRead
from app.schemas.favorite import FavoriteToggleResponse
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/favorites", tags=["Favorites"])
Service = Annotated[FavoriteService, Depends(get_favorite_service)]
UserUid = Annotated[str, Depends(get_authenticated_user_uid)]


@router.get("", response_model=list[DestinationRead])
def list_favorites(uid: UserUid, service: Service) -> list[DestinationRead]:
    """Danh sách các địa điểm người dùng đã lưu vào yêu thích."""
    return service.list_user_favorites(uid)


@router.post("/{id_or_slug}", response_model=FavoriteToggleResponse)
def toggle_favorite(id_or_slug: str, uid: UserUid, service: Service) -> FavoriteToggleResponse:
    """Thêm hoặc xóa địa điểm khỏi danh sách yêu thích (toggle)."""
    return service.toggle_favorite(uid, id_or_slug)
