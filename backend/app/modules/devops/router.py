"""
SDLC Brain — DevOps Router

Route naming convention to avoid FastAPI path param shadowing:
  GET  /pipelines/{project_id}         — list pipelines
  GET  /infra/{project_id}             — list infra configs
  POST /generate                       — generate all
  PATCH /pipelines/{id}/status         — update pipeline
  PATCH /infra/{id}/status             — update infra
  GET  /stream/{task_id}               — SSE
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.devops.models import InfraConfig, PipelineConfig
from app.modules.devops.schemas import (
    DevOpsStatusUpdate,
    GenerateDevOpsRequest,
    InfraConfigResponse,
    PipelineConfigResponse,
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


@router.post("/generate")
async def generate_devops(data: GenerateDevOpsRequest, db: AsyncSession = Depends(get_session)):
    """Generate CI/CD pipelines and infra configs from architecture."""
    task_id = f"devops-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.devops.service import devops_service
        return await devops_service.generate_devops(
            tid, db, data.project_id, data.instructions or ""
        )

    await task_queue.submit("devops", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "devops"}


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
