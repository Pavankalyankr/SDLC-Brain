"""
SDLC Brain — Agile Router

API endpoints for agile artifact management.
Full CRUD + generation + status updates + SSE streaming.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.agile.schemas import (
    ArtifactStatusUpdate,
    EpicResponse,
    FeatureResponse,
    GenerateRequest,
    RequirementResponse,
    StoryResponse,
    StoryMetadataUpdate,
)
from app.modules.agile.service import agile_service
from app.modules.document.service import document_service

router = APIRouter()


# ═════════════════════════════════════════
# Requirements
# ═════════════════════════════════════════

@router.get("/requirements/{project_id}", response_model=list[RequirementResponse])
async def list_requirements(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all requirements for a project."""
    return await agile_service.get_requirements(db, project_id)


@router.get("/requirements/{project_id}/{requirement_id}", response_model=RequirementResponse)
async def get_requirement(requirement_id: str, db: AsyncSession = Depends(get_session)):
    """Get a specific requirement."""
    return await agile_service.get_requirement(db, requirement_id)


@router.post("/requirements/generate")
async def generate_requirements(data: GenerateRequest, db: AsyncSession = Depends(get_session)):
    """Generate requirements from SOW using AI.

    If `source_content` is empty, automatically fetches the SOW text from
    uploaded documents for the project.
    """
    sow_text = data.source_content or ""
    if not sow_text:
        sow_text = await document_service.get_sow_text(db, data.project_id)

    if not sow_text:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No SOW text available. Upload a SOW document first in the Documents tab.")

    result = await agile_service.generate_requirements(
        db, data.project_id, sow_text, data.instructions or ""
    )
    return result


@router.patch("/requirements/{requirement_id}/status", response_model=RequirementResponse)
async def update_requirement_status(
    requirement_id: str,
    data: ArtifactStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update requirement status (review/approve)."""
    return await agile_service.update_requirement_status(db, requirement_id, data.status, data.feedback)


# ═════════════════════════════════════════
# Epics
# ═════════════════════════════════════════

@router.get("/epics/{project_id}", response_model=list[EpicResponse])
async def list_epics(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all epics for a project."""
    return await agile_service.get_epics(db, project_id)


@router.post("/epics/generate")
async def generate_epics(data: GenerateRequest, db: AsyncSession = Depends(get_session)):
    """Generate epics from approved requirements."""
    return await agile_service.generate_epics(db, data.project_id, data.instructions or "")


@router.patch("/epics/{epic_id}/status", response_model=EpicResponse)
async def update_epic_status(
    epic_id: str,
    data: ArtifactStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update epic status (review/approve)."""
    return await agile_service.update_epic_status(db, epic_id, data.status, data.feedback)


# ═════════════════════════════════════════
# Features
# ═════════════════════════════════════════

@router.get("/features/{project_id}", response_model=list[FeatureResponse])
async def list_features(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all features for a project."""
    return await agile_service.get_features(db, project_id)


@router.post("/features/generate")
async def generate_features(data: GenerateRequest, db: AsyncSession = Depends(get_session)):
    """Generate features from approved epics."""
    return await agile_service.generate_features(db, data.project_id, data.instructions or "")


@router.patch("/features/{feature_id}/status", response_model=FeatureResponse)
async def update_feature_status(
    feature_id: str,
    data: ArtifactStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update feature status (review/approve)."""
    return await agile_service.update_feature_status(db, feature_id, data.status, data.feedback)


# ═════════════════════════════════════════
# Stories
# ═════════════════════════════════════════

@router.get("/stories/{project_id}/approved", response_model=list[StoryResponse])
async def list_approved_stories(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all approved stories (for architecture/development gates)."""
    return await agile_service.get_approved_stories(db, project_id)


@router.get("/stories/{project_id}", response_model=list[StoryResponse])
async def list_stories(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all stories for a project."""
    return await agile_service.get_stories(db, project_id)



@router.post("/stories/generate")
async def generate_stories(data: GenerateRequest, db: AsyncSession = Depends(get_session)):
    """Generate stories from approved features."""
    return await agile_service.generate_stories(db, data.project_id, data.instructions or "")


@router.patch("/stories/{story_id}/status", response_model=StoryResponse)
async def update_story_status(
    story_id: str,
    data: ArtifactStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update story status (review/approve)."""
    return await agile_service.update_story_status(db, story_id, data.status, data.feedback)


@router.patch("/stories/{story_id}/metadata", response_model=StoryResponse)
async def update_story_metadata(
    story_id: str,
    data: StoryMetadataUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Update story priority, points, and sprint."""
    return await agile_service.update_story_metadata(db, story_id, data)


# ═════════════════════════════════════════
# SSE Stream (shared for all agile events)
# ═════════════════════════════════════════

@router.get("/stream/{task_id}")
async def stream_agile_events(task_id: str):
    """SSE stream for agile generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
