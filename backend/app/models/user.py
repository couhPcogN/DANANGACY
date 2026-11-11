from sqlalchemy import CheckConstraint, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import JSON_DOCUMENT, Timestamps


class User(Timestamps, Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("status IN ('ACTIVE', 'DISABLED')", name="status_values"),)

    uid: Mapped[str] = mapped_column(String(128), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(30))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    interest_tags: Mapped[list] = mapped_column(JSON_DOCUMENT, default=list, server_default="[]")
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE")
