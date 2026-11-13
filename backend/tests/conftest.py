import os
from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.schema import CreateSchema, DropSchema

from app.api.dependencies import get_db
from app.main import create_app

BACKEND_DIR = Path(__file__).resolve().parents[1]


def migrate(engine: Engine, revision: str = "head", *, downgrade: bool = False) -> None:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        if downgrade:
            command.downgrade(config, revision)
        else:
            command.upgrade(config, revision)


@pytest.fixture
def db_engine(tmp_path: Path) -> Iterator[Engine]:
    test_url = os.getenv("TEST_DATABASE_URL")
    admin_engine = None
    schema = None
    if test_url:
        # PostgreSQL integration tests get their own schema; no application tables are touched.
        admin_engine = create_engine(test_url)
        if admin_engine.dialect.name != "postgresql":
            raise ValueError("TEST_DATABASE_URL must point to a PostgreSQL test database.")
        schema = f"test_{uuid4().hex}"
        with admin_engine.begin() as connection:
            connection.execute(CreateSchema(schema))
        engine = create_engine(test_url, connect_args={"options": f"-csearch_path={schema}"})
    else:
        engine = create_engine(
            f"sqlite+pysqlite:///{tmp_path / 'test.db'}",
            connect_args={"check_same_thread": False},
        )

        @event.listens_for(engine, "connect")
        def enable_foreign_keys(connection, _record) -> None:
            connection.isolation_level = None
            connection.execute("PRAGMA foreign_keys=ON")

        @event.listens_for(engine, "begin")
        def begin_sqlite_transaction(connection) -> None:
            # SQLite's legacy driver mode otherwise commits DDL outside a transaction.
            connection.exec_driver_sql("BEGIN")

    try:
        migrate(engine)
        yield engine
    finally:
        engine.dispose()
        if admin_engine is not None and schema is not None:
            try:
                with admin_engine.begin() as connection:
                    connection.execute(DropSchema(schema, cascade=True))
            finally:
                admin_engine.dispose()


@pytest.fixture
def client(db_engine: Engine) -> Iterator[TestClient]:
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)
    app = create_app()

    def override_db() -> Iterator[Session]:
        with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def payload() -> dict:
    return {
        "title": "Một ngày di sản Đà Nẵng",
        "date": "2026-11-15",
        "duration": 1,
        "pace": "Thư thả",
        "stops": [
            {"place_id": "cham", "day": 1, "start": "09:00", "end": "10:30"},
            {"place_id": "son-tra", "day": 1, "start": "14:00", "end": "16:00"},
        ],
    }
