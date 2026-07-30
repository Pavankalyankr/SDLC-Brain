"""
SDLC Brain — Project Memory Manager

Stores and retrieves project-level decisions that inform all AI generations.
Updated automatically when artifacts are approved.
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class MemoryManager:
    """
    Manages project memory — persistent key-value decisions that
    the AI uses for consistent generation across the SDLC.

    Examples:
        - "backend_framework": "FastAPI"
        - "database": "PostgreSQL"
        - "architecture_style": "Microservices"
        - "auth_method": "JWT + OAuth2"
    """

    async def get_memory(self, db: AsyncSession, project_id: str) -> dict[str, str]:
        """Get all memory entries for a project."""
        from app.modules.project.models import ProjectMemory

        result = await db.execute(
            select(ProjectMemory).where(ProjectMemory.project_id == project_id)
        )
        entries = result.scalars().all()
        return {entry.key: entry.value for entry in entries}

    async def set_memory(
        self,
        db: AsyncSession,
        project_id: str,
        key: str,
        value: str,
        source: str = "manual",
    ) -> None:
        """Set a memory entry. Creates or updates."""
        from app.modules.project.models import ProjectMemory

        result = await db.execute(
            select(ProjectMemory).where(
                ProjectMemory.project_id == project_id,
                ProjectMemory.key == key,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.value = value
            existing.source = source
        else:
            entry = ProjectMemory(
                project_id=project_id,
                key=key,
                value=value,
                source=source,
            )
            db.add(entry)

        await db.flush()

    async def bulk_set_memory(
        self,
        db: AsyncSession,
        project_id: str,
        entries: dict[str, str],
        source: str = "ai_extracted",
    ) -> None:
        """Set multiple memory entries at once."""
        for key, value in entries.items():
            await self.set_memory(db, project_id, key, value, source)

    async def delete_memory(self, db: AsyncSession, project_id: str, key: str) -> None:
        """Delete a memory entry."""
        from app.modules.project.models import ProjectMemory

        result = await db.execute(
            select(ProjectMemory).where(
                ProjectMemory.project_id == project_id,
                ProjectMemory.key == key,
            )
        )
        entry = result.scalar_one_or_none()
        if entry:
            await db.delete(entry)
            await db.flush()


# Singleton
memory_manager = MemoryManager()
