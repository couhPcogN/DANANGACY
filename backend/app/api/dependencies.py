from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.services.itinerary_service import ItineraryService


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


def get_itinerary_service(session: Annotated[Session, Depends(get_db)]) -> ItineraryService:
    return ItineraryService(session)
