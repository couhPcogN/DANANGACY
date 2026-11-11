import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.router import router
from app.core.config import get_settings
from app.core.exceptions import InvalidScheduleError, ItineraryConflictError, ItineraryNotFoundError

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )
    app.include_router(router)

    @app.exception_handler(ItineraryNotFoundError)
    async def not_found(_request: Request, exc: ItineraryNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(InvalidScheduleError)
    async def invalid_schedule(_request: Request, exc: InvalidScheduleError) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(IntegrityError)
    async def integrity_error(_request: Request, _exc: IntegrityError) -> JSONResponse:
        return JSONResponse(
            status_code=409, content={"detail": "Dữ liệu vi phạm ràng buộc của database."}
        )

    @app.exception_handler(ItineraryConflictError)
    async def version_conflict(_request: Request, exc: ItineraryConflictError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_request: Request, exc: SQLAlchemyError) -> JSONResponse:
        # Log the category only; connection strings and query parameters can contain secrets.
        logger.warning("Database request failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503,
            content={"detail": "Database chưa sẵn sàng. Kiểm tra cấu hình kết nối và migration."},
        )

    return app


app = create_app()
