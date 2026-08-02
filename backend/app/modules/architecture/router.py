"""
SDLC Brain — Architecture Router

Route structure (no path-param conflicts):
  GET  /designs/{project_id}           — list designs
  POST /designs/generate               — generate design
  PATCH /designs/{id}/status           — approve design
  GET  /apis/{project_id}              — list API contracts
  POST /apis/generate                  — generate APIs
  PATCH /apis/{id}/status              — approve API
  GET  /schemas/{project_id}           — list DB schemas
  POST /schemas/generate               — generate schemas
  PATCH /schemas/{id}/status           — approve schema
  GET  /stream/{task_id}               — SSE
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.architecture_agent import architecture_agent
from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.architecture.models import APIContract, DBSchema, SystemDesign
from app.modules.architecture.repository import architecture_repository
from app.modules.architecture.schemas import (
    APIContractResponse,
    ArchitectureStatusUpdate,
    DBSchemaResponse,
    GenerateArchitectureRequest,
    SystemDesignResponse,
)

router = APIRouter()


# ═══════════════════════════════════════════
# System Design
# ═══════════════════════════════════════════

@router.get("/designs/{project_id}", response_model=list[SystemDesignResponse])
async def list_designs(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all system designs for a project."""
    return await architecture_repository.get_designs(db, project_id)


@router.post("/designs/generate")
async def generate_design(
    data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)
):
    """Generate system design from approved stories."""
    task_id = f"arch-design-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_system_design(
            tid, db, data.project_id, data.instructions or "", data.source_type, data.source_id
        )

    await task_queue.submit("architecture", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "system_design"}


@router.patch("/designs/{design_id}/status", response_model=SystemDesignResponse)
async def update_design_status(
    design_id: str,
    data: ArchitectureStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a system design."""
    result = await db.execute(select(SystemDesign).where(SystemDesign.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise NotFoundException("SystemDesign", design_id)
    design.status = data.status
    if data.feedback:
        design.feedback = data.feedback
    if data.status == "approved":
        design.locked = True
        design.approved_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(design)
    return design


# ═══════════════════════════════════════════
# API Contracts
# ═══════════════════════════════════════════

@router.get("/apis/{project_id}", response_model=list[APIContractResponse])
async def list_api_contracts(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all API contracts for a project."""
    return await architecture_repository.get_api_contracts(db, project_id)


@router.post("/apis/generate")
async def generate_apis(
    data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)
):
    """Generate API contracts from approved system design."""
    task_id = f"arch-api-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_api_contracts(
            tid, db, data.project_id, data.instructions or "", data.source_type, data.source_id
        )

    await task_queue.submit("architecture", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "api_contracts"}


@router.patch("/apis/{contract_id}/status", response_model=APIContractResponse)
async def update_api_status(
    contract_id: str,
    data: ArchitectureStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update an API contract."""
    result = await db.execute(select(APIContract).where(APIContract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise NotFoundException("APIContract", contract_id)
    contract.status = data.status
    if data.status == "approved":
        contract.locked = True
    await db.flush()
    await db.refresh(contract)
    return contract


# ═══════════════════════════════════════════
# DB Schemas
# ═══════════════════════════════════════════

@router.get("/schemas/{project_id}", response_model=list[DBSchemaResponse])
async def list_db_schemas(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all DB schemas for a project."""
    return await architecture_repository.get_db_schemas(db, project_id)


@router.post("/schemas/generate")
async def generate_schemas(
    data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)
):
    """Generate DB schemas from approved system design + APIs."""
    task_id = f"arch-db-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_db_schemas(
            tid, db, data.project_id, data.instructions or "", data.source_type, data.source_id
        )

    await task_queue.submit("architecture", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "db_schemas"}


@router.patch("/schemas/{schema_id}/status", response_model=DBSchemaResponse)
async def update_schema_status(
    schema_id: str,
    data: ArchitectureStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a DB schema."""
    result = await db.execute(select(DBSchema).where(DBSchema.id == schema_id))
    schema = result.scalar_one_or_none()
    if not schema:
        raise NotFoundException("DBSchema", schema_id)
    schema.status = data.status
    if data.status == "approved":
        schema.locked = True
    await db.flush()
    await db.refresh(schema)
    return schema


# ═══════════════════════════════════════════
# SSE Stream
# ═══════════════════════════════════════════

@router.get("/stream/{task_id}")
async def stream_architecture_events(task_id: str):
    """SSE stream for architecture generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
