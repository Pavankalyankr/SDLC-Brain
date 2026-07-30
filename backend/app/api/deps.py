"""
SDLC Brain — API Dependencies

Shared FastAPI dependencies injected into route handlers.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Database session dependency."""
    async for session in get_db():
        yield session
