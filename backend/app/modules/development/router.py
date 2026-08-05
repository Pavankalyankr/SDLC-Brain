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
from typing import List

from fastapi import APIRouter, Depends, File, Form, UploadFile, WebSocket, WebSocketDisconnect
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
            tid, db, data.project_id, data.instructions or "", data.chat_history
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


@router.delete("/task/{task_id}")
async def cancel_generation_task(task_id: str):
    """Cancel a running AI generation task."""
    success = task_queue.cancel_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    return {"status": "cancelled", "task_id": task_id}

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

class BatchFileItem(BaseModel):
    path: str
    content: str

class BatchWriteRequest(BaseModel):
    files: list[BatchFileItem]

class ImportPathRequest(BaseModel):
    path: str

@router.get("/workspace/{project_id}/files")
async def list_workspace_files(project_id: str):
    from app.modules.development.workspace import workspace_manager
    return await workspace_manager.list_files(project_id)

@router.get("/workspace/{project_id}/export-zip")
async def export_workspace_zip(project_id: str):
    import os, zipfile, io
    from pathlib import Path
    from fastapi.responses import StreamingResponse
    from app.core.exceptions import NotFoundException
    
    workspace_dir = Path("/app/workspace") / project_id
    if not workspace_dir.exists() or not workspace_dir.is_dir():
        raise NotFoundException("Workspace directory not found")
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for root, _, files in os.walk(workspace_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, workspace_dir)
                zip_file.write(file_path, arcname)
                
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="workspace_{project_id}.zip"'}
    )

@router.post("/workspace/{project_id}/upload-batch")
async def write_workspace_files_batch(project_id: str, data: BatchWriteRequest):
    from app.modules.development.workspace import workspace_manager
    count = 0
    for item in data.files:
        try:
            await workspace_manager.write_file(project_id, item.path, item.content)
            count += 1
        except Exception as e:
            import logging
            logging.warning(f"Skipping file {item.path} during batch upload: {e}")
    return {"status": "success", "count": count}

@router.post("/workspace/{project_id}/upload-form")
async def upload_workspace_files_form(
    project_id: str,
    files: List[UploadFile] = File(...),
    paths: List[str] = Form(...)
):
    from app.modules.development.workspace import workspace_manager
    count = 0
    for file_obj, rel_path in zip(files, paths):
        try:
            content_bytes = await file_obj.read()
            content_str = content_bytes.decode("utf-8", errors="replace")
            await workspace_manager.write_file(project_id, rel_path, content_str)
            count += 1
        except Exception as e:
            import logging
            logging.warning(f"Failed to upload {rel_path}: {e}")
    return {"status": "success", "count": count}

@router.post("/workspace/{project_id}/import-path")
async def import_workspace_from_local_path(project_id: str, data: ImportPathRequest):
    import os, re
    from pathlib import Path
    from app.modules.development.workspace import workspace_manager
    
    raw_path = data.path.strip()
    possible_paths = [raw_path]
    if len(raw_path) >= 2 and raw_path[1] == ":":
        drive = raw_path[0].lower()
        subpath = raw_path[2:].replace("\\", "/").lstrip("/")
        possible_paths.extend([
            f"/mnt/{drive}/{subpath}",
            f"/{drive}/{subpath}"
        ])
    elif raw_path.startswith("C:\\") or raw_path.startswith("c:\\") or raw_path.startswith("C:/"):
        sub = raw_path[3:].replace("\\", "/")
        possible_paths.extend([f"/mnt/c/{sub}", f"/c/{sub}"])
        
    actual_dir = None
    for p in possible_paths:
        if os.path.exists(p) and os.path.isdir(p):
            actual_dir = p
            break
            
    if not actual_dir:
        raise NotFoundException("Local system folder path could not be found or accessed from Docker environment.")

    count = 0
    ignore_re = re.compile(r'(__MACOSX|\.DS_Store|node_modules|\.git|\.dart_tool|/build|/target|\.gradle|\.idea|venv|__pycache__|\.next|/dist|\.expo|\.svn|Pods|\.dSYM|/android|/ios|\.claude)', re.I)
    bin_re = re.compile(r'\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp4|mp3|pdf|zip|tar|gz|exe|dll|so|a|dylib|apk|dex|jar|class|pyc|keystore|lock|webp|bin)$', re.I)
    
    for dirpath, dirnames, filenames in os.walk(actual_dir):
        # Prune ignored directories in place so os.walk never enters massive build caches!
        dirnames[:] = [d for d in dirnames if not ignore_re.search(f"/{d}") and d not in ["build", "node_modules", ".git", ".dart_tool", "Pods", ".gradle", "android", "ios", "venv", "__pycache__", "dist", "target", ".next", ".claude"]]
        for fname in filenames:
            full_path = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(full_path, actual_dir).replace("\\", "/")
            if ignore_re.search(f"/{rel_path}") or bin_re.search(fname):
                continue
            try:
                if os.path.getsize(full_path) <= 2000000:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        content_str = f.read()
                    await workspace_manager.write_file(project_id, rel_path, content_str)
                    count += 1
            except Exception as e:
                import logging
                logging.warning(f"Skipping {rel_path}: {e}")
                
    return {"status": "success", "count": count, "resolved_path": actual_dir}

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
