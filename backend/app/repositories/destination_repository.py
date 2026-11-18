from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.destination import Destination


class DestinationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(
        self,
        *,
        category: str | None = None,
        environment: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Destination]:
        statement = select(Destination).where(Destination.status != "ARCHIVED")

        if category and category != "Tất cả":
            statement = statement.where(Destination.category == category)

        if environment and environment != "Tất cả":
            env_upper = environment.upper()
            if env_upper in ("INDOOR", "TRONG NHÀ"):
                statement = statement.where(Destination.environment == "INDOOR")
            elif env_upper in ("OUTDOOR", "NGOÀI TRỜI"):
                statement = statement.where(Destination.environment == "OUTDOOR")

        if search:
            search_pattern = f"%{search.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Destination.name).like(search_pattern),
                    func.lower(Destination.slug).like(search_pattern),
                    func.lower(Destination.address).like(search_pattern),
                    func.lower(Destination.area).like(search_pattern),
                )
            )

        statement = statement.order_by(Destination.id.asc()).offset(offset).limit(limit)
        return list(self.session.scalars(statement))

    def get_by_id(self, destination_id: int) -> Destination | None:
        return self.session.get(Destination, destination_id)

    def get_by_slug(self, slug: str) -> Destination | None:
        statement = select(Destination).where(Destination.slug == slug)
        return self.session.scalar(statement)
