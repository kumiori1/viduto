from fastapi import APIRouter

from app.api.v1.endpoints import videos, revisions, webhooks

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    videos.router,
    prefix="/videos",
    tags=["videos"]
)

api_router.include_router(
    revisions.router,
    prefix="/videos",
    tags=["revisions"]
)

api_router.include_router(
    webhooks.router,
    prefix="/webhooks", 
    tags=["webhooks"]
)
