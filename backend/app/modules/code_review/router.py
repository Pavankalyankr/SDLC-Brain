"""
SDLC Brain — Code Review Router
"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.core.events import event_manager
from app.modules.code_review.models import CodeReview
from app.modules.code_review.schemas import GenerateReviewRequest

router = APIRouter()


@router.get("/{project_id}")
async def list_reviews(project_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(CodeReview).where(CodeReview.project_id == project_id).order_by(CodeReview.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/generate")
async def generate_review(data: GenerateReviewRequest, db: AsyncSession = Depends(get_session)):
    task_id = f"review-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.code_review.service import code_review_service
        return await code_review_service.generate_code_review(tid, db, data.project_id)

    from app.ai.orchestrator.task_queue import task_queue
    await task_queue.submit("code_review", data.project_id, _worker)

    return {"task_id": task_id, "status": "generating", "type": "code_review"}


@router.get("/stream/{task_id}")
async def stream_review_events(task_id: str):
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
