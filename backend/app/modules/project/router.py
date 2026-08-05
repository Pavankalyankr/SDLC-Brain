"""
SDLC Brain — Project Router

API endpoints for project management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.memory.manager import memory_manager
from app.api.deps import get_session
from app.modules.project.schemas import (
    MemoryEntryCreate,
    MemoryEntryResponse,
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.project.service import project_service

router = APIRouter()


@router.get("", response_model=list[ProjectListResponse])
async def list_projects(db: AsyncSession = Depends(get_session)):
    """Get all projects."""
    return await project_service.list_projects(db)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_session),
):
    """Create a new project."""
    return await project_service.create_project(db, data)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get project details."""
    return await project_service.get_project(db, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update a project."""
    return await project_service.update_project(db, project_id, data)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Delete a project."""
    await project_service.delete_project(db, project_id)


@router.get("/{project_id}/memory", response_model=list[MemoryEntryResponse])
async def get_project_memory(
    project_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get all memory entries for a project."""
    await project_service.get_project(db, project_id)  # Verify exists
    entries = await memory_manager.get_memory(db, project_id)
    # Convert dict to list of MemoryEntryResponse
    from app.modules.project.repository import project_repository
    return await project_repository.get_memory(db, project_id)


@router.post("/{project_id}/memory", response_model=MemoryEntryResponse, status_code=201)
async def add_memory_entry(
    project_id: str,
    data: MemoryEntryCreate,
    db: AsyncSession = Depends(get_session),
):
    """Add a memory entry to a project."""
    await project_service.get_project(db, project_id)  # Verify exists
    await memory_manager.set_memory(db, project_id, data.key, data.value, source="manual")
    # Return the created entry
    from app.modules.project.repository import project_repository
    entries = await project_repository.get_memory(db, project_id)
    return next(e for e in entries if e.key == data.key)
