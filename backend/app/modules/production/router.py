"""
SDLC Brain — Production Router

Routes:
  GET  /incidents/{project_id}     — list incidents
  GET  /runbooks/{project_id}      — list runbooks
  POST /analyze                    — run AI RCA
  PATCH /incidents/{id}/status     — update incident
  GET  /stream/{task_id}           — SSE
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
from app.modules.production.models import Incident, Runbook
from app.modules.production.schemas import (
    AnalyzeIncidentRequest,
    IncidentResponse,
    IncidentStatusUpdate,
    RunbookResponse,
)

router = APIRouter()


@router.get("/incidents/{project_id}", response_model=list[IncidentResponse])
async def list_incidents(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all incidents for a project."""
    result = await db.execute(
        select(Incident)
        .where(Incident.project_id == project_id)
        .order_by(Incident.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/runbooks/{project_id}", response_model=list[RunbookResponse])
async def list_runbooks(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all runbooks for a project."""
    result = await db.execute(
        select(Runbook)
        .where(Runbook.project_id == project_id)
        .order_by(Runbook.created_at)
    )
    return list(result.scalars().all())


@router.post("/analyze")
async def analyze_incident(data: AnalyzeIncidentRequest, db: AsyncSession = Depends(get_session)):
    """Queue AI Root Cause Analysis for an incident."""
    task_id = f"prod-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.production.service import production_service
        return await production_service.analyze_incident(
            tid, db, data.project_id, data.description or ""
        )

    await task_queue.submit("production", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "analyzing", "type": "incident_analysis"}


@router.patch("/incidents/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: str,
    data: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Resolve or close an incident."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise NotFoundException("Incident", incident_id)
    incident.status = data.status
    if data.resolution:
        incident.resolution = data.resolution
    await db.flush()
    await db.refresh(incident)
    return incident


@router.get("/stream/{task_id}")
async def stream_production_events(task_id: str):
    """SSE stream for production analysis progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
