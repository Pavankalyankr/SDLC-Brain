"""
SDLC Brain — Architecture Router

API endpoints for architecture artifact management.
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.architecture_agent import architecture_agent
from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.architecture.repository import architecture_repository
from app.modules.architecture.schemas import (
    APIContractResponse,
    DBSchemaResponse,
    GenerateArchitectureRequest,
    SystemDesignResponse,
)

router = APIRouter()


# --- System Design ---

@router.get("/designs/{project_id}", response_model=list[SystemDesignResponse])
async def list_designs(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all system designs for a project."""
    return await architecture_repository.get_designs(db, project_id)


@router.post("/designs/generate")
async def generate_design(data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)):
    """Generate system design from approved stories."""
    task_id = f"arch-design-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_system_design(tid, db, data.project_id, data.instructions or "")

    await task_queue.submit("architecture", data.project_id, _worker)
    return {"task_id": task_id, "status": "generating", "type": "system_design"}


# --- API Contracts ---

@router.get("/apis/{project_id}", response_model=list[APIContractResponse])
async def list_api_contracts(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all API contracts for a project."""
    return await architecture_repository.get_api_contracts(db, project_id)


@router.post("/apis/generate")
async def generate_apis(data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)):
    """Generate API contracts from approved system design."""
    task_id = f"arch-api-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_api_contracts(tid, db, data.project_id, data.instructions or "")

    await task_queue.submit("architecture", data.project_id, _worker)
    return {"task_id": task_id, "status": "generating", "type": "api_contracts"}


# --- DB Schemas ---

@router.get("/schemas/{project_id}", response_model=list[DBSchemaResponse])
async def list_db_schemas(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all DB schemas for a project."""
    return await architecture_repository.get_db_schemas(db, project_id)


@router.post("/schemas/generate")
async def generate_schemas(data: GenerateArchitectureRequest, db: AsyncSession = Depends(get_session)):
    """Generate DB schemas from approved system design + APIs."""
    task_id = f"arch-db-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        return await architecture_agent.generate_db_schemas(tid, db, data.project_id, data.instructions or "")

    await task_queue.submit("architecture", data.project_id, _worker)
    return {"task_id": task_id, "status": "generating", "type": "db_schemas"}


# --- SSE Stream ---

@router.get("/stream/{task_id}")
async def stream_architecture_events(task_id: str):
    """SSE stream for architecture generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
