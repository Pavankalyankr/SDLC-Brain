"""
SDLC Brain — Production Router
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.production.models import Incident, Runbook
from app.modules.production.schemas import AnalyzeIncidentRequest

router = APIRouter()


@router.get("/incidents/{project_id}")
async def list_incidents(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Incident).where(Incident.project_id == project_id).order_by(Incident.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/runbooks/{project_id}")
async def list_runbooks(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Runbook).where(Runbook.project_id == project_id).order_by(Runbook.created_at)
    )
    return list(result.scalars().all())


@router.post("/analyze")
async def analyze_incident(data: AnalyzeIncidentRequest, db: AsyncSession = Depends(get_session)):
    task_id = f"prod-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.production.service import production_service
        return await production_service.analyze_incident(tid, db, data.project_id, data.description or "")

    from app.ai.orchestrator.task_queue import task_queue
    await task_queue.submit("production", data.project_id, _worker)

    return {"task_id": task_id, "status": "analyzing", "type": "incident_analysis"}


@router.get("/stream/{task_id}")
async def stream_production_events(task_id: str):
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
