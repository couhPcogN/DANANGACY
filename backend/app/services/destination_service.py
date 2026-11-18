from sqlalchemy.orm import Session

from app.core.exceptions import DestinationNotFoundError
from app.repositories.destination_repository import DestinationRepository
from app.schemas.destination import DestinationRead


class DestinationService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = DestinationRepository(session)

    def list(
        self,
        *,
        category: str | None = None,
        environment: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[DestinationRead]:
        destinations = self.repository.list(
            category=category,
            environment=environment,
            search=search,
            offset=offset,
            limit=limit,
        )
        return [DestinationRead.model_validate(d) for d in destinations]

    def get(self, id_or_slug: str) -> DestinationRead:
        if id_or_slug.isdigit():
            dest = self.repository.get_by_id(int(id_or_slug))
        else:
            dest = self.repository.get_by_slug(id_or_slug)

        if dest is None or dest.status == "ARCHIVED":
            raise DestinationNotFoundError()
        return DestinationRead.model_validate(dest)
