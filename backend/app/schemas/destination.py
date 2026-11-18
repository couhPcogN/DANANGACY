from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DestinationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str | None = None
    environment: str
    category: str | None = None
    area: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    address: str | None = None
    opening_hours: dict[str, Any] | None = None
    estimated_visit_minutes: int | None = None
    image_urls: list[str] = Field(default_factory=list)
    status: str
