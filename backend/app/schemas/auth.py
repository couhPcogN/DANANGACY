from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

DisplayName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Password = Annotated[str, StringConstraints(min_length=6, max_length=128)]
PhoneText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)]
EmailText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        to_lower=True,
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        max_length=320,
    ),
]


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailText
    password: Password
    display_name: DisplayName
    phone: PhoneText | None = None


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailText
    password: str = Field(min_length=1)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uid: str
    display_name: str
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    interest_tags: list[str] = []
    status: str
    created_at: datetime


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: DisplayName | None = None
    phone: PhoneText | None = None
    avatar_url: str | None = None
    interest_tags: list[str] | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
