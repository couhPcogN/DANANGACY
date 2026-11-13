from datetime import date as DateValue
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import IntegerPrimaryKey, Timestamps
from app.models.destination import Destination


class Itinerary(IntegerPrimaryKey, Timestamps, Base):
    __tablename__ = "itineraries"
    __table_args__ = (
        CheckConstraint("duration BETWEEN 1 AND 3", name="duration_range"),
        CheckConstraint("length(trim(title)) > 0", name="title_not_blank"),
        CheckConstraint("pace IN ('Thư thả', 'Cân bằng', 'Năng động')", name="pace_values"),
        CheckConstraint("status IN ('DRAFT', 'SAVED', 'COMPLETED')", name="status_values"),
        CheckConstraint("version >= 1", name="version_positive"),
        Index("ix_itineraries_owner_uid_visit_date", "owner_uid", "visit_date"),
    )

    owner_uid: Mapped[str] = mapped_column(String(128), ForeignKey("users.uid"))
    title: Mapped[str] = mapped_column(String(200))
    visit_date: Mapped[DateValue] = mapped_column(Date)
    duration: Mapped[int] = mapped_column(default=1, server_default="1")
    pace: Mapped[str] = mapped_column(String(30), default="Thư thả", server_default="Thư thả")
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", server_default="DRAFT")
    version: Mapped[int] = mapped_column(default=1, server_default="1")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    items: Mapped[list["ItineraryItem"]] = relationship(
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ItineraryItem.position",
        back_populates="itinerary",
    )


class ItineraryItem(IntegerPrimaryKey, Base):
    __tablename__ = "itinerary_items"
    __table_args__ = (
        UniqueConstraint("itinerary_id", "position"),
        CheckConstraint("position >= 0", name="position_nonnegative"),
        CheckConstraint("planned_start_at < planned_end_at", name="time_order"),
    )

    itinerary_id: Mapped[int] = mapped_column(
        ForeignKey("itineraries.id", ondelete="CASCADE"), index=True
    )
    destination_id: Mapped[int] = mapped_column(ForeignKey("destinations.id"), index=True)
    position: Mapped[int]
    planned_start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    planned_end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    itinerary: Mapped[Itinerary] = relationship(back_populates="items")
    destination: Mapped[Destination] = relationship()
