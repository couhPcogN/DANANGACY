import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.api.router import router
from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError,
    DestinationNotFoundError,
    EmailAlreadyRegisteredError,
    InsufficientPointsError,
    InvalidQuizSubmissionError,
    InvalidScheduleError,
    ItineraryConflictError,
    ItineraryNotFoundError,
    QuizNotFoundError,
    VoucherAlreadyClaimedError,
    VoucherOfferNotFoundError,
    VoucherOutOfStockError,
)

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.include_router(router)

    @app.exception_handler(AuthenticationError)
    async def auth_error(_request: Request, exc: AuthenticationError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(EmailAlreadyRegisteredError)
    async def email_registered(_request: Request, exc: EmailAlreadyRegisteredError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(DestinationNotFoundError)
    async def destination_not_found(
        _request: Request, exc: DestinationNotFoundError
    ) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(QuizNotFoundError)
    async def quiz_not_found(_request: Request, exc: QuizNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(InvalidQuizSubmissionError)
    async def invalid_quiz_submission(
        _request: Request, exc: InvalidQuizSubmissionError
    ) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(VoucherOfferNotFoundError)
    async def voucher_not_found(_request: Request, exc: VoucherOfferNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(InsufficientPointsError)
    async def insufficient_points(_request: Request, exc: InsufficientPointsError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(VoucherAlreadyClaimedError)
    async def voucher_claimed(_request: Request, exc: VoucherAlreadyClaimedError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(VoucherOutOfStockError)
    async def voucher_out_of_stock(_request: Request, exc: VoucherOutOfStockError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

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
