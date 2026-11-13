from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.itinerary_rules import DEMO_USER_UID
from app.db.demo_data import DEMO_DESTINATIONS
from app.db.session import SessionLocal
from app.models import Destination, User


def seed_demo_data(session: Session) -> None:
    if session.get(User, DEMO_USER_UID) is None:
        session.add(User(uid=DEMO_USER_UID, display_name="Người dùng demo"))
    existing = set(session.scalars(select(Destination.slug)))
    for slug, name, environment in DEMO_DESTINATIONS:
        if slug not in existing:
            session.add(Destination(slug=slug, name=name, environment=environment))


if __name__ == "__main__":
    with SessionLocal.begin() as session:
        seed_demo_data(session)
    print("Demo user and destinations are ready.")
