"""
SDLC Brain — QA Router
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.qa.repository import qa_repository
from app.modules.qa.schemas import GenerateQARequest, TestCaseResponse, TestPlanResponse

router = APIRouter()


@router.get("/test-cases/{project_id}", response_model=list[TestCaseResponse])
async def list_test_cases(project_id: str, db: AsyncSession = Depends(get_session)):
    return await qa_repository.get_test_cases(db, project_id)


@router.get("/test-plans/{project_id}", response_model=list[TestPlanResponse])
async def list_test_plans(project_id: str, db: AsyncSession = Depends(get_session)):
    return await qa_repository.get_test_plans(db, project_id)


@router.post("/generate")
async def generate_tests(data: GenerateQARequest, db: AsyncSession = Depends(get_session)):
    task_id = f"qa-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.qa.service import qa_service
        return await qa_service.generate_tests(tid, db, data.project_id)

    from app.ai.orchestrator.task_queue import task_queue
    await task_queue.submit("qa", data.project_id, _worker)

    return {"task_id": task_id, "status": "generating", "type": "test_cases"}


@router.get("/stream/{task_id}")
async def stream_qa_events(task_id: str):
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
