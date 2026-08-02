"""
SDLC Brain — Project Repository

Database queries for the Project module.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.project.models import Project, ProjectMemory


class ProjectRepository:
    """Database access for projects."""

    async def get_all(self, db: AsyncSession) -> list[Project]:
        """Get all projects."""
        result = await db.execute(
            select(Project).order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, db: AsyncSession, project_id: str) -> Project | None:
        """Get a project by ID with memory entries."""
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.memory_entries))
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, project: Project) -> Project:
        """Create a new project."""
        db.add(project)
        await db.flush()
        # Fetch it back with eager loading to satisfy Pydantic schemas
        created_project = await self.get_by_id(db, project.id)
        if not created_project:
            raise ValueError("Failed to retrieve created project")
        return created_project

    async def update(self, db: AsyncSession, project: Project) -> Project:
        """Update a project."""
        await db.flush()
        # Fetch it back with eager loading to satisfy Pydantic schemas
        updated_project = await self.get_by_id(db, project.id)
        if not updated_project:
            raise ValueError("Failed to retrieve updated project")
        return updated_project

    async def delete(self, db: AsyncSession, project: Project) -> None:
        """Delete a project."""
        await db.delete(project)
        await db.flush()

    async def get_memory(self, db: AsyncSession, project_id: str) -> list[ProjectMemory]:
        """Get all memory entries for a project."""
        result = await db.execute(
            select(ProjectMemory)
            .where(ProjectMemory.project_id == project_id)
            .order_by(ProjectMemory.key)
        )
        return list(result.scalars().all())


project_repository = ProjectRepository()
