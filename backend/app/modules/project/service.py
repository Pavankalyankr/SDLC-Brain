"""
SDLC Brain — Project Service

Business logic for project management.
"""

import logging
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.modules.project.models import Project
from app.modules.project.repository import project_repository
from app.modules.project.schemas import ProjectCreate, ProjectUpdate

logger = logging.getLogger(__name__)


class ProjectService:
    """Business logic for projects."""

    async def list_projects(self, db: AsyncSession) -> list[Project]:
        """Get all projects."""
        return await project_repository.get_all(db)

    async def get_project(self, db: AsyncSession, project_id: str) -> Project:
        """Get a project by ID. Raises NotFoundException if not found."""
        project = await project_repository.get_by_id(db, project_id)
        if not project:
            raise NotFoundException("Project", project_id)
        return project

    async def create_project(self, db: AsyncSession, data: ProjectCreate) -> Project:
        """Create a new project with its workspace directory."""
        import uuid
        
        project = Project(
            id=str(uuid.uuid4()),
            name=data.name,
            description=data.description,
        )

        # Create workspace directory
        workspace_path = Path(settings.WORKSPACE_ROOT) / project.id
        workspace_path.mkdir(parents=True, exist_ok=True)

        # Create sub-directories
        for subdir in ["generated", "repository", "uploads", "artifacts", "exports"]:
            (workspace_path / subdir).mkdir(exist_ok=True)

        project.workspace_path = str(workspace_path)

        created = await project_repository.create(db, project)
        logger.info(f"Created project: {created.name} ({created.id})")
        return created

    async def update_project(self, db: AsyncSession, project_id: str, data: ProjectUpdate) -> Project:
        """Update project details."""
        project = await self.get_project(db, project_id)

        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description
        if data.status is not None:
            project.status = data.status

        return await project_repository.update(db, project)

    async def delete_project(self, db: AsyncSession, project_id: str) -> None:
        """Delete a project."""
        project = await self.get_project(db, project_id)
        await project_repository.delete(db, project)
        logger.info(f"Deleted project: {project.name} ({project.id})")


project_service = ProjectService()
