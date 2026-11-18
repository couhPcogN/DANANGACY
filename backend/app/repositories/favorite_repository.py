from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.favorite import Favorite


class FavoriteRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_by_user(self, user_uid: str) -> list[Favorite]:
        statement = (
            select(Favorite)
            .where(Favorite.user_uid == user_uid)
            .order_by(Favorite.created_at.desc())
        )
        return list(self.session.scalars(statement))

    def get(self, user_uid: str, destination_id: int) -> Favorite | None:
        return self.session.get(Favorite, (user_uid, destination_id))

    def add(self, favorite: Favorite) -> None:
        self.session.add(favorite)

    def delete(self, favorite: Favorite) -> None:
        self.session.delete(favorite)
