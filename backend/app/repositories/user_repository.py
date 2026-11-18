from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, uid: str) -> User | None:
        return self.session.get(User, uid)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email.lower().strip())
        return self.session.scalar(statement)

    def add(self, user: User) -> None:
        self.session.add(user)
