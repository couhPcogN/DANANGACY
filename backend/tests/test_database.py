from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from app.api.dependencies import get_db
from app.db.base import Base
from app.main import create_app
from tests.conftest import migrate


def test_api_and_schemas_use_itinerary_names() -> None:
    schema = create_app().openapi()
    paths = {path for path in schema["paths"] if path.startswith("/api/v1/")}
    assert paths == {"/api/v1/itineraries", "/api/v1/itineraries/{itinerary_id}"}
    assert {"ItineraryCreate", "ItineraryRead", "ItineraryUpdate"} <= schema["components"][
        "schemas"
    ].keys()
    assert not any(name.startswith("Trip") for name in schema["components"]["schemas"])


def test_migration_matches_models_and_can_round_trip(db_engine: Engine) -> None:
    with db_engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": True})
        assert compare_metadata(context, Base.metadata) == []
    migrate(db_engine, "base", downgrade=True)
    assert "itineraries" not in inspect(db_engine).get_table_names()
    assert "itinerary_items" not in inspect(db_engine).get_table_names()
    migrate(db_engine)
    tables = set(inspect(db_engine).get_table_names())
    assert {"itineraries", "itinerary_items", "users", "destinations", "favorites"} <= tables
    assert not {"trips", "trip_stops", "quizzes_quizzes"} & tables


def test_health_checks(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/health/db").json() == {"status": "ok", "database": "connected"}


def test_database_errors_do_not_expose_connection_details() -> None:
    app = create_app()

    class UnavailableSession:
        def execute(self, _statement) -> None:
            raise OperationalError("private query", {}, RuntimeError("private-password"))

    def unavailable_db():
        yield UnavailableSession()

    app.dependency_overrides[get_db] = unavailable_db
    with TestClient(app) as client:
        response = client.get("/health/db")
    assert response.status_code == 503
    assert "private-password" not in response.text
    assert "private query" not in response.text
