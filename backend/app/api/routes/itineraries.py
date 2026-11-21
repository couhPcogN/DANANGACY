from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.dependencies import (
    get_authenticated_itinerary_service,
    get_itinerary_service,
)
from app.schemas.itinerary import ItineraryCreate, ItineraryRead, ItineraryUpdate
from app.services.itinerary_service import ItineraryService

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])
ReadOnlyService = Annotated[ItineraryService, Depends(get_itinerary_service)]
AuthenticatedService = Annotated[ItineraryService, Depends(get_authenticated_itinerary_service)]


@router.get("", response_model=list[ItineraryRead])
def list_itineraries(
    service: ReadOnlyService,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[ItineraryRead]:
    return service.list(offset=offset, limit=limit)


@router.post("", response_model=ItineraryRead, status_code=status.HTTP_201_CREATED)
def create_itinerary(payload: ItineraryCreate, service: AuthenticatedService) -> ItineraryRead:
    return service.create(payload)


@router.get("/{itinerary_id}", response_model=ItineraryRead)
def get_itinerary(itinerary_id: int, service: ReadOnlyService) -> ItineraryRead:
    return service.get(itinerary_id)


@router.patch("/{itinerary_id}", response_model=ItineraryRead)
def update_itinerary(
    itinerary_id: int, payload: ItineraryUpdate, service: AuthenticatedService
) -> ItineraryRead:
    return service.update(itinerary_id, payload)


@router.delete("/{itinerary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary(itinerary_id: int, service: AuthenticatedService) -> Response:
    service.delete(itinerary_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
