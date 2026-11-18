from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_destination_service
from app.schemas.destination import DestinationRead
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/destinations", tags=["Destinations"])
Service = Annotated[DestinationService, Depends(get_destination_service)]


@router.get("", response_model=list[DestinationRead])
def list_destinations(
    service: Service,
    category: str | None = None,
    environment: str | None = None,
    search: str | None = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[DestinationRead]:
    """Danh sách điểm đến di sản Đà Nẵng, hỗ trợ tìm kiếm và lọc."""
    return service.list(
        category=category,
        environment=environment,
        search=search,
        offset=offset,
        limit=limit,
    )


@router.get("/{id_or_slug}", response_model=DestinationRead)
def get_destination(id_or_slug: str, service: Service) -> DestinationRead:
    """Xem thông tin chi tiết một điểm đến theo ID hoặc slug."""
    return service.get(id_or_slug)
