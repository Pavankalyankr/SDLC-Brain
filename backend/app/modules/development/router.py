"""
SDLC Brain — Development Router

API endpoints for code generation.
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.development.repository import development_repository
from app.modules.development.schemas import CodeFileResponse, GenerateCodeRequest

router = APIRouter()


@router.get("/files/{project_id}", response_model=list[CodeFileResponse])
async def list_code_files(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all generated code files for a project."""
    return await development_repository.get_code_files(db, project_id)


@router.get("/files/{project_id}/{file_id}", response_model=CodeFileResponse)
async def get_code_file(file_id: str, db: AsyncSession = Depends(get_session)):
    """Get a specific code file."""
    return await development_repository.get_code_file(db, file_id)


@router.post("/generate")
async def generate_code(data: GenerateCodeRequest, db: AsyncSession = Depends(get_session)):
    """Generate code files from approved stories + architecture."""
    task_id = f"dev-code-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.development.service import development_service
        return await development_service.generate_code_files(tid, db, data.project_id, data.instructions or "")

    from app.ai.orchestrator.task_queue import task_queue
    await task_queue.submit("development", data.project_id, _worker)

    return {"task_id": task_id, "status": "generating", "type": "code_files"}


@router.get("/stream/{task_id}")
async def stream_dev_events(task_id: str):
    """SSE stream for code generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
