from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.core.itinerary_rules import DEMO_USER_UID
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.destination_service import DestinationService
from app.services.favorite_service import FavoriteService
from app.services.itinerary_service import ItineraryService
from app.services.quiz_service import QuizService
from app.services.reward_service import RewardService


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


def get_current_user_uid(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if not authorization:
        return DEMO_USER_UID
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthenticationError("Authorization header phải có định dạng 'Bearer <token>'.")
    return decode_access_token(token, get_settings())


def get_authenticated_user_uid(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if not authorization:
        raise AuthenticationError("Yêu cầu đăng nhập để thực hiện thao tác này.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthenticationError("Authorization header phải có định dạng 'Bearer <token>'.")
    return decode_access_token(token, get_settings())


def get_current_user(
    uid: Annotated[str, Depends(get_authenticated_user_uid)],
    session: Annotated[Session, Depends(get_db)],
) -> User:
    user = session.get(User, uid)
    if user is None or user.status != "ACTIVE":
        raise AuthenticationError("Tài khoản không hợp lệ hoặc đã bị khóa.")
    return user


def get_auth_service(session: Annotated[Session, Depends(get_db)]) -> AuthService:
    return AuthService(session)


def get_destination_service(session: Annotated[Session, Depends(get_db)]) -> DestinationService:
    return DestinationService(session)


def get_favorite_service(session: Annotated[Session, Depends(get_db)]) -> FavoriteService:
    return FavoriteService(session)


def get_itinerary_service(
    session: Annotated[Session, Depends(get_db)],
    owner_uid: Annotated[str, Depends(get_current_user_uid)],
) -> ItineraryService:
    return ItineraryService(session, owner_uid=owner_uid)


def get_quiz_service(session: Annotated[Session, Depends(get_db)]) -> QuizService:
    return QuizService(session)


def get_reward_service(session: Annotated[Session, Depends(get_db)]) -> RewardService:
    return RewardService(session)
