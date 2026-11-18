from fastapi import APIRouter

from app.api.routes import (
    ai,
    auth,
    destinations,
    favorites,
    health,
    itineraries,
    quizzes,
    rewards,
    weather,
)

router = APIRouter()
router.include_router(health.router)
router.include_router(itineraries.router, prefix="/api/v1")
router.include_router(auth.router, prefix="/api")
router.include_router(destinations.router, prefix="/api")
router.include_router(favorites.router, prefix="/api")
router.include_router(weather.router, prefix="/api")
router.include_router(ai.router, prefix="/api")
router.include_router(quizzes.router, prefix="/api")
router.include_router(rewards.router, prefix="/api")
