"""
SDLC Brain — DevOps Router

3-step pipeline endpoints:
  GET  /pipelines/{project_id}         — list pipelines
  GET  /infra/{project_id}             — list infra configs
  GET  /images/{project_id}            — list image versions
  GET  /releases/{project_id}          — list release notes
  POST /generate                       — generate artifacts (steps 1+2)
  POST /generate-release               — generate release notes (step 3)
  PATCH /pipelines/{id}/status         — update pipeline
  PATCH /infra/{id}/status             — update infra
  GET  /stream/{task_id}               — SSE
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.devops.models import ImageVersion, InfraConfig, PipelineConfig, ReleaseNote
from app.modules.devops.schemas import (
    DevOpsStatusUpdate,
    GenerateDevOpsRequest,
    GenerateReleaseRequest,
    ImageVersionResponse,
    InfraConfigResponse,
    PipelineConfigResponse,
    ReleaseNoteResponse,
)

router = APIRouter()


@router.get("/pipelines/{project_id}", response_model=list[PipelineConfigResponse])
async def list_pipelines(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all CI/CD pipelines for a project."""
    result = await db.execute(
        select(PipelineConfig)
        .where(PipelineConfig.project_id == project_id)
        .order_by(PipelineConfig.created_at)
    )
    return list(result.scalars().all())


@router.get("/infra/{project_id}", response_model=list[InfraConfigResponse])
async def list_infra(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all infrastructure configs for a project."""
    result = await db.execute(
        select(InfraConfig)
        .where(InfraConfig.project_id == project_id)
        .order_by(InfraConfig.created_at)
    )
    return list(result.scalars().all())


@router.get("/images/{project_id}", response_model=list[ImageVersionResponse])
async def list_image_versions(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all container image versions for a project."""
    result = await db.execute(
        select(ImageVersion)
        .where(ImageVersion.project_id == project_id)
        .order_by(ImageVersion.service_name)
    )
    return list(result.scalars().all())


@router.get("/releases/{project_id}", response_model=list[ReleaseNoteResponse])
async def list_releases(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all release notes for a project."""
    result = await db.execute(
        select(ReleaseNote)
        .where(ReleaseNote.project_id == project_id)
        .order_by(ReleaseNote.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/generate")
async def generate_devops(data: GenerateDevOpsRequest, db: AsyncSession = Depends(get_session)):
    """Generate DevOps artifacts (Steps 1+2: Analyze → Generate)."""
    task_id = f"devops-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.devops.service import devops_service
        return await devops_service.generate_devops(
            tid, db, data.project_id, data.instructions or ""
        )

    await task_queue.submit("devops", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "devops"}


@router.post("/generate-release")
async def generate_release(data: GenerateReleaseRequest, db: AsyncSession = Depends(get_session)):
    """Generate release notes and deployment instructions (Step 3)."""
    task_id = f"release-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.devops.service import devops_service
        return await devops_service.generate_release(
            tid, db, data.project_id, data.version or "", data.changes or ""
        )

    await task_queue.submit("devops", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "release"}


@router.patch("/pipelines/{pipeline_id}/status", response_model=PipelineConfigResponse)
async def update_pipeline_status(
    pipeline_id: str,
    data: DevOpsStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a CI/CD pipeline config."""
    result = await db.execute(select(PipelineConfig).where(PipelineConfig.id == pipeline_id))
    pipeline = result.scalar_one_or_none()
    if not pipeline:
        raise NotFoundException("PipelineConfig", pipeline_id)
    pipeline.status = data.status
    if data.status == "approved":
        pipeline.locked = True
    await db.flush()
    await db.refresh(pipeline)
    return pipeline


@router.patch("/infra/{infra_id}/status", response_model=InfraConfigResponse)
async def update_infra_status(
    infra_id: str,
    data: DevOpsStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update an infrastructure config."""
    result = await db.execute(select(InfraConfig).where(InfraConfig.id == infra_id))
    infra = result.scalar_one_or_none()
    if not infra:
        raise NotFoundException("InfraConfig", infra_id)
    infra.status = data.status
    if data.status == "approved":
        infra.locked = True
    await db.flush()
    await db.refresh(infra)
    return infra


@router.get("/stream/{task_id}")
async def stream_devops_events(task_id: str):
    """SSE stream for DevOps generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
