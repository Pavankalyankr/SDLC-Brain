"""
SDLC Brain — Production Router

Routes:
  GET  /incidents/{project_id}              — list incidents
  GET  /incidents/{project_id}/{id}         — get single incident
  GET  /analyses/{incident_id}              — get analyses for incident
  GET  /runbooks/{project_id}               — list runbooks
  POST /analyze                             — run AI RCA pipeline
  PATCH /incidents/{id}/status              — update incident status
  PATCH /analyses/{id}/status               — approve/reject analysis
  GET  /stream/{task_id}                    — SSE
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
from app.modules.production.models import Incident, IncidentAnalysis, Runbook
from app.modules.production.schemas import (
    AnalyzeIncidentRequest,
    AnalysisStatusUpdate,
    IncidentAnalysisResponse,
    IncidentResponse,
    IncidentStatusUpdate,
    RunbookResponse,
)

router = APIRouter()


@router.get("/incidents/{project_id}", response_model=list[IncidentResponse])
async def list_incidents(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Incident).where(Incident.project_id == project_id).order_by(Incident.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/incidents/{project_id}/{incident_id}", response_model=IncidentResponse)
async def get_incident(project_id: str, incident_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id, Incident.project_id == project_id)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise NotFoundException("Incident", incident_id)
    return incident


@router.get("/analyses/{incident_id}", response_model=list[IncidentAnalysisResponse])
async def get_analyses(incident_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(IncidentAnalysis).where(IncidentAnalysis.incident_id == incident_id).order_by(IncidentAnalysis.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/runbooks/{project_id}", response_model=list[RunbookResponse])
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
        return await production_service.analyze_incident(
            tid, db, data.project_id,
            title=data.title or "",
            raw_logs=data.raw_logs or "",
            severity=data.severity or "medium",
            service=data.service or "",
            description=data.description or "",
        )

    await task_queue.submit("production", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "analyzing", "type": "incident_analysis"}


@router.patch("/incidents/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: str, data: IncidentStatusUpdate, db: AsyncSession = Depends(get_session),
):
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


@router.patch("/analyses/{analysis_id}/status", response_model=IncidentAnalysisResponse)
async def update_analysis_status(
    analysis_id: str, data: AnalysisStatusUpdate, db: AsyncSession = Depends(get_session),
):
    result = await db.execute(select(IncidentAnalysis).where(IncidentAnalysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise NotFoundException("IncidentAnalysis", analysis_id)
    analysis.status = data.status
    await db.flush()
    await db.refresh(analysis)
    return analysis


@router.post("/apply-fix/{analysis_id}")
async def apply_fix(analysis_id: str, db: AsyncSession = Depends(get_session)):
    """Apply the approved code fix to workspace files."""
    result = await db.execute(select(IncidentAnalysis).where(IncidentAnalysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise NotFoundException("IncidentAnalysis", analysis_id)
    if analysis.status != "approved":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Analysis must be approved before applying fix")

    # Get the incident to find the project_id
    inc_result = await db.execute(select(Incident).where(Incident.id == analysis.incident_id))
    incident = inc_result.scalar_one_or_none()
    if not incident:
        raise NotFoundException("Incident", analysis.incident_id)

    task_id = f"fix-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.ai.agents.production_agent import production_agent
        return await production_agent.apply_fix(tid, db, analysis, incident.project_id)

    await task_queue.submit("production", incident.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "applying", "type": "auto_fix"}


@router.get("/stream/{task_id}")
async def stream_production_events(task_id: str):
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
