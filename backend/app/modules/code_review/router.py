"""
SDLC Brain — Code Review Router

IMPORTANT: Route order matters in FastAPI. All specific paths come before
wildcard `/{id}` paths to avoid shadowing. The pattern used here:
  /reviews/{project_id}  — list
  /generate              — generate
  /reviews/{id}/status   — update
  /stream/{task_id}      — SSE
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.task_queue import task_queue
from app.api.deps import get_session
from app.core.events import event_manager
from app.core.exceptions import NotFoundException
from app.modules.code_review.models import CodeReview
from app.modules.code_review.schemas import (
    CodeReviewResponse,
    GenerateReviewRequest,
    ReviewStatusUpdate,
)

router = APIRouter()


# ─── GET list ───────────────────────────────────────────────
@router.get("/reviews/{project_id}", response_model=list[CodeReviewResponse])
async def list_reviews(project_id: str, db: AsyncSession = Depends(get_session)):
    """Get all code reviews for a project."""
    result = await db.execute(
        select(CodeReview)
        .where(CodeReview.project_id == project_id)
        .order_by(CodeReview.created_at.desc())
    )
    return list(result.scalars().all())


# ─── Generate ───────────────────────────────────────────────
@router.post("/generate")
async def generate_review(data: GenerateReviewRequest, db: AsyncSession = Depends(get_session)):
    """Queue AI code review generation for a project."""
    task_id = f"review-{uuid.uuid4().hex[:8]}"

    async def _worker(tid: str):
        from app.modules.code_review.service import code_review_service
        return await code_review_service.generate_code_review(
            tid, db, data.project_id, data.target_stage, data.target_id, data.instructions or ""
        )

    await task_queue.submit("code_review", data.project_id, _worker, task_id=task_id)
    return {"task_id": task_id, "status": "generating", "type": "code_review"}


# ─── PATCH status ───────────────────────────────────────────
@router.patch("/reviews/{review_id}/status", response_model=CodeReviewResponse)
async def update_review_status(
    review_id: str,
    data: ReviewStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    """Approve or update a code review result."""
    result = await db.execute(select(CodeReview).where(CodeReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundException("CodeReview", review_id)
    review.status = data.status
    if data.status == "approved":
        review.locked = True
        review.approved_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(review)
    return review


# ─── Auto-Fix ──────────────────────────────────────────────
@router.post("/auto-fix/{review_id}", response_model=CodeReviewResponse)
async def auto_fix_review(
    review_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Auto-fix the file referenced by a code review using AI."""
    from app.ai.agents.code_review_agent import code_review_agent

    result = await db.execute(select(CodeReview).where(CodeReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundException("CodeReview", review_id)
    if review.status == "fixed":
        raise HTTPException(status_code=400, detail="This review has already been fixed.")

    try:
        await code_review_agent.auto_fix_file(db, review)
        await db.commit()
        await db.refresh(review)
        return review
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        await db.rollback()
        
        error_msg = str(e)
        try:
            start = error_msg.find("{")
            if start != -1:
                dict_str = error_msg[start:]
                parsed = None
                try:
                    import ast
                    parsed = ast.literal_eval(dict_str)
                except Exception:
                    import json
                    parsed = json.loads(dict_str)
                
                if isinstance(parsed, dict) and "error" in parsed:
                    err = parsed["error"]
                    if isinstance(err, dict) and "message" in err:
                        error_msg = err["message"]
        except Exception:
            pass
            
        raise HTTPException(status_code=500, detail=f"Auto-fix failed: {error_msg}")


# ─── Revert Fix ─────────────────────────────────────────────
@router.post("/revert/{review_id}", response_model=CodeReviewResponse)
async def revert_review_fix(
    review_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Revert a previously auto-fixed file back to its original code."""
    from app.modules.development.workspace import workspace_manager

    result = await db.execute(select(CodeReview).where(CodeReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundException("CodeReview", review_id)
    if review.status != "fixed":
        raise HTTPException(status_code=400, detail="This review has not been fixed yet.")
    if not review.original_code:
        raise HTTPException(status_code=400, detail="No original code stored for this review.")

    try:
        await workspace_manager.write_file(review.project_id, review.file_path, review.original_code)
        review.status = "draft"
        review.locked = False
        await db.commit()
        await db.refresh(review)
        return review
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Revert failed: {str(e)}")


# ─── SSE stream ─────────────────────────────────────────────
@router.get("/stream/{task_id}")
async def stream_review_events(task_id: str):
    """SSE stream for code review generation progress."""
    return StreamingResponse(
        event_manager.stream(task_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )

