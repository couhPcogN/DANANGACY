from sqlalchemy.orm import Session

from app.core.exceptions import DestinationNotFoundError
from app.models.favorite import Favorite
from app.repositories.destination_repository import DestinationRepository
from app.repositories.favorite_repository import FavoriteRepository
from app.schemas.destination import DestinationRead
from app.schemas.favorite import FavoriteToggleResponse


class FavoriteService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.fav_repo = FavoriteRepository(session)
        self.dest_repo = DestinationRepository(session)

    def list_user_favorites(self, user_uid: str) -> list[DestinationRead]:
        favorites = self.fav_repo.list_by_user(user_uid)
        result: list[DestinationRead] = []
        for fav in favorites:
            dest = self.dest_repo.get_by_id(fav.destination_id)
            if dest and dest.status != "ARCHIVED":
                result.append(DestinationRead.model_validate(dest))
        return result

    def toggle_favorite(self, user_uid: str, id_or_slug: str) -> FavoriteToggleResponse:
        with self.session.begin():
            if id_or_slug.isdigit():
                dest = self.dest_repo.get_by_id(int(id_or_slug))
            else:
                dest = self.dest_repo.get_by_slug(id_or_slug)

            if dest is None or dest.status == "ARCHIVED":
                raise DestinationNotFoundError()

            existing = self.fav_repo.get(user_uid, dest.id)
            if existing is not None:
                self.fav_repo.delete(existing)
                is_fav = False
                msg = f"Đã bỏ lưu {dest.name} khỏi danh sách yêu thích."
            else:
                self.fav_repo.add(Favorite(user_uid=user_uid, destination_id=dest.id))
                is_fav = True
                msg = f"Đã thêm {dest.name} vào danh sách yêu thích."

            dest_id = dest.id

        return FavoriteToggleResponse(destination_id=dest_id, is_favorite=is_fav, message=msg)
