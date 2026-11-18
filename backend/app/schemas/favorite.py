from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.destination import DestinationRead


class FavoriteToggleResponse(BaseModel):
    destination_id: int
    is_favorite: bool
    message: str


class FavoriteItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    destination_id: int
    created_at: datetime
    destination: DestinationRead
