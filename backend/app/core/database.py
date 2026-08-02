"""
SDLC Brain — Database Configuration

Async SQLAlchemy engine and session factory.
Uses asyncpg driver for PostgreSQL.
"""

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (development only — use Alembic in production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE system_designs ADD COLUMN IF NOT EXISTS source_type VARCHAR(50), ADD COLUMN IF NOT EXISTS source_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE api_contracts ADD COLUMN IF NOT EXISTS source_type VARCHAR(50), ADD COLUMN IF NOT EXISTS source_id VARCHAR(36);"))
            await conn.execute(text("ALTER TABLE db_schemas ADD COLUMN IF NOT EXISTS source_type VARCHAR(50), ADD COLUMN IF NOT EXISTS source_id VARCHAR(36);"))
        except Exception:
            pass


async def close_db() -> None:
    """Dispose the engine on shutdown."""
    await engine.dispose()
