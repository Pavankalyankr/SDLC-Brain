"""
SDLC Brain — Development Router

Routes:
  GET  /files/{project_id}          — list code files
  GET  /files/{project_id}/{id}     — get one file
  POST /generate                    — generate code
  PATCH /files/{id}/status          — approve file
  GET  /stream/{task_id}            — SSE
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.development.models import CodeFile
from app.modules.development.repository import development_repository
from app.modules.development.schemas import (
    CodeFileResponse,
    CodeFileStatusUpdate,
    GenerateCodeRequest,
)

router = APIRouter()


@router.get("/files/{project_id}", response_model=list[CodeFileResponse])
async def list_code_files(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all generated code files for a project."""
    return await development_repository.get_code_files(db, project_id)


@router.get("/files/{project_id}/{file_id}", response_model=CodeFileResponse)
async def get_code_file(
    project_id: str, file_id: str, db: AsyncSession = Depends(get_session)
):
    """Get a specific generated code file."""
    code_file = await development_repository.get_code_file(db, file_id)
    if not code_file:
        raise NotFoundException("CodeFile", file_id)
    return code_file


@router.post("/generate")
async def generate_code(data: GenerateCodeRequest, db: AsyncSession = Depends(get_session)):
    """Queue AI code generation from approved stories + architecture."""
    task_id = f"dev-code-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.development.service import development_service
        return await development_service.generate_code_files(
            tid, db, data.project_id, data.instructions or ""
        )

    await task_queue.submit("development", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "code_files"}


@router.patch("/files/{file_id}/status", response_model=CodeFileResponse)
async def update_code_file_status(
    file_id: str,
    data: CodeFileStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a generated code file."""
    result = await db.execute(select(CodeFile).where(CodeFile.id == file_id))
    code_file = result.scalar_one_or_none()
    if not code_file:
        raise NotFoundException("CodeFile", file_id)
    code_file.status = data.status
    if data.status == "approved":
        code_file.locked = True
        code_file.approved_at = datetime.now(UTC)
    if data.feedback:
        code_file.feedback = data.feedback
    await db.flush()
    await db.refresh(code_file)
    return code_file


@router.get("/stream/{task_id}")
async def stream_dev_events(task_id: str):
    """SSE stream for code generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )

@router.websocket("/ws/terminal/{project_id}")
async def terminal_websocket(websocket: WebSocket, project_id: str):
    """WebSocket endpoint for real-time terminal interaction."""
    await websocket.accept()
    import asyncio

    from app.modules.development.terminal import terminal_manager

    session = await terminal_manager.create_session(project_id)

    async def read_from_terminal():
        while True:
            data = await session.read(1024)
            if data:
                await websocket.send_text(data.decode('utf-8', errors='replace'))
            else:
                break

    task = asyncio.create_task(read_from_terminal())
    try:
        while True:
            data = await websocket.receive_text()
            await session.write(data)
    except WebSocketDisconnect:
        task.cancel()
        terminal_manager.cleanup(session.id)

# --- Workspace API ---

class FileWriteRequest(BaseModel):
    content: str

@router.get("/workspace/{project_id}/files")
async def list_workspace_files(project_id: str):
    from app.modules.development.workspace import workspace_manager
    return await workspace_manager.list_files(project_id)

@router.get("/workspace/{project_id}/file/{file_path:path}")
async def read_workspace_file(project_id: str, file_path: str):
    from app.modules.development.workspace import workspace_manager
    content = await workspace_manager.read_file(project_id, file_path)
    return Response(content=content, media_type="text/plain; charset=utf-8")

@router.post("/workspace/{project_id}/file/{file_path:path}")
async def write_workspace_file(project_id: str, file_path: str, data: FileWriteRequest):
    from app.modules.development.workspace import workspace_manager
    await workspace_manager.write_file(project_id, file_path, data.content)
    return {"status": "success"}

@router.delete("/workspace/{project_id}/file/{file_path:path}")
async def delete_workspace_file(project_id: str, file_path: str):
    from app.modules.development.workspace import workspace_manager
    await workspace_manager.delete_file(project_id, file_path)
    return {"status": "success"}
