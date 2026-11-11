from decimal import Decimal

from sqlalchemy import CheckConstraint, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import JSON_DOCUMENT, Timestamps, UUIDPrimaryKey


class Destination(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "destinations"
    __table_args__ = (
        CheckConstraint("environment IN ('INDOOR', 'OUTDOOR', 'MIXED')", name="environment_values"),
        CheckConstraint("status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')", name="status_values"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="latitude_range"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="longitude_range"),
        CheckConstraint("(latitude IS NULL) = (longitude IS NULL)", name="coordinates_pair"),
        CheckConstraint("estimated_visit_minutes > 0", name="visit_minutes_positive"),
    )

    slug: Mapped[str] = mapped_column(String(100), unique=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text)
    environment: Mapped[str] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(50))
    area: Mapped[str | None] = mapped_column(String(150))
    # Missing coordinates are kept unknown, rather than inventing a map location.
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6))
    address: Mapped[str | None] = mapped_column(String(300))
    opening_hours: Mapped[dict | None] = mapped_column(JSON_DOCUMENT)
    estimated_visit_minutes: Mapped[int | None]
    image_urls: Mapped[list] = mapped_column(JSON_DOCUMENT, default=list, server_default="[]")
    status: Mapped[str] = mapped_column(String(20), default="PUBLISHED", server_default="PUBLISHED")
