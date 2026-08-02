"""
SDLC Brain — QA Router

Routes:
  GET  /test-cases/{project_id}       — list test cases
  GET  /test-plans/{project_id}       — list test plans
  POST /generate                      — generate test cases
  PATCH /test-cases/{id}/status       — approve test case
  GET  /stream/{task_id}              — SSE
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.qa.repository import qa_repository
from app.modules.qa.schemas import (
    GenerateQARequest,
    TestCaseResponse,
    TestCaseStatusUpdate,
    TestPlanResponse,
)

router = APIRouter()


@router.get("/test-cases/{project_id}", response_model=list[TestCaseResponse])
async def list_test_cases(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all test cases for a project."""
    return await qa_repository.get_test_cases(db, project_id)


@router.get("/test-plans/{project_id}", response_model=list[TestPlanResponse])
async def list_test_plans(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all test plans for a project."""
    return await qa_repository.get_test_plans(db, project_id)


@router.post("/generate")
async def generate_tests(data: GenerateQARequest, db: AsyncSession = Depends(get_session)):
    """Queue AI test case generation from approved stories."""
    task_id = f"qa-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.qa.service import qa_service
        return await qa_service.generate_tests(
            tid, db, data.project_id, data.instructions or ""
        )

    await task_queue.submit("qa", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "test_cases"}


@router.patch("/test-cases/{test_case_id}/status", response_model=TestCaseResponse)
async def update_test_case_status(
    test_case_id: str,
    data: TestCaseStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a test case."""
    from datetime import UTC, datetime
    from sqlalchemy import select
    from app.modules.qa.models import TestCase

    result = await db.execute(select(TestCase).where(TestCase.id == test_case_id))
    test_case = result.scalar_one_or_none()
    if not test_case:
        raise NotFoundException("TestCase", test_case_id)

    test_case.status = data.status
    if data.status == "approved":
        test_case.locked = True
        test_case.approved_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(test_case)
    return test_case


@router.get("/stream/{task_id}")
async def stream_qa_events(task_id: str):
    """SSE stream for QA generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
