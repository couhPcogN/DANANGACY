from datetime import date as DateValue
from datetime import datetime, time
from typing import Annotated, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_serializer,
    model_validator,
)

from app.core.itinerary_rules import MAX_STOPS

Pace = Literal["Thư thả", "Cân bằng", "Năng động"]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
PlaceId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
TimeText = Annotated[str, StringConstraints(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")]


class ItineraryStopCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    place_id: PlaceId
    day: int = Field(default=1, ge=1, le=3)
    start: TimeText
    end: TimeText


class ItineraryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Title
    date: DateValue
    duration: int = Field(default=1, ge=1, le=3)
    pace: Pace = "Thư thả"
    stops: list[ItineraryStopCreate] = Field(min_length=1, max_length=MAX_STOPS)


class ItineraryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Title | None = None
    date: DateValue | None = None
    duration: int | None = Field(default=None, ge=1, le=3)
    pace: Pace | None = None
    stops: list[ItineraryStopCreate] | None = Field(
        default=None, min_length=1, max_length=MAX_STOPS
    )
    version: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_patch(self) -> "ItineraryUpdate":
        if not self.model_fields_set - {"version"}:
            raise ValueError("Cần gửi ít nhất một trường để cập nhật.")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Các trường cập nhật không được là null.")
        return self


class ItineraryStopRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    place_id: str
    day: int
    start: time
    end: time

    @field_serializer("start", "end")
    def serialize_time(self, value: time) -> str:
        return value.strftime("%H:%M")


class ItineraryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    date: DateValue
    duration: int
    pace: Pace
    stops: list[ItineraryStopRead]
    created_at: datetime
    updated_at: datetime
    version: int
