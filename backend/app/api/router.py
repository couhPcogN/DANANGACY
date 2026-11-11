from fastapi import APIRouter

from app.api.routes import health, itineraries

router = APIRouter()
router.include_router(health.router)
router.include_router(itineraries.router, prefix="/api/v1")
