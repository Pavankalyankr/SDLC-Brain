"""
SDLC Brain — DevOps Router
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.devops.models import InfraConfig, PipelineConfig
from app.modules.devops.schemas import GenerateDevOpsRequest

router = APIRouter()


@router.get("/pipelines/{project_id}")
async def list_pipelines(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(PipelineConfig).where(PipelineConfig.project_id == project_id).order_by(PipelineConfig.created_at)
    )
    return list(result.scalars().all())


@router.get("/infra/{project_id}")
async def list_infra(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(InfraConfig).where(InfraConfig.project_id == project_id).order_by(InfraConfig.created_at)
    )
    return list(result.scalars().all())


@router.post("/generate")
async def generate_devops(data: GenerateDevOpsRequest, db: AsyncSession = Depends(get_session)):
    task_id = f"devops-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.devops.service import devops_service
        return await devops_service.generate_devops(tid, db, data.project_id)

    from app.ai.orchestrator.task_queue import task_queue
    await task_queue.submit("devops", data.project_id, _worker)

    return {"task_id": task_id, "status": "generating", "type": "devops"}


@router.get("/stream/{task_id}")
async def stream_devops_events(task_id: str):
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
