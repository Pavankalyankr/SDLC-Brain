"""
SDLC Brain — FastAPI Application Entry Point

Configures middleware, CORS, routes, and lifecycle events.
"""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.exceptions import register_exception_handlers

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle: startup and shutdown."""
    # ── Startup ──────────────────────────────────────────────
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Always create/verify DB tables on startup.
    # Alembic is preferred in production but this ensures tables exist on first run.
    await init_db()
    logger.info("Database tables verified/created")

    # Pre-initialize the AI orchestrator so the first request isn't slow.
    try:
        from app.ai.orchestrator.orchestrator import orchestrator
        orchestrator.initialize()
        logger.info("AI Orchestrator initialized")
    except Exception as e:
        logger.warning(f"AI Orchestrator init failed (non-fatal): {e}")

    yield

    # ── Shutdown ─────────────────────────────────────────────
    await close_db()
    logger.info("Database connections closed")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Powered Software Development Lifecycle Assistant",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ────────────────────────────────────
    register_exception_handlers(app)

    # ── API Routes ────────────────────────────────────────────
    app.include_router(api_v1_router, prefix="/api/v1")

    # ── Health Check ─────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    return app


app = create_app()
