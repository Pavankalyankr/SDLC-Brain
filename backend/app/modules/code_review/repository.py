"""
SDLC Brain — Code Review Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.code_review.models import CodeReview


class CodeReviewRepository:

    async def get_code_reviews(self, db: AsyncSession, project_id: str) -> list[CodeReview]:
        result = await db.execute(
            select(CodeReview).where(CodeReview.project_id == project_id).order_by(CodeReview.file_path)
        )
        return list(result.scalars().all())

    async def get_code_review(self, db: AsyncSession, review_id: str) -> CodeReview | None:
        result = await db.execute(select(CodeReview).where(CodeReview.id == review_id))
        return result.scalar_one_or_none()

    async def create_code_review(self, db: AsyncSession, review: CodeReview) -> CodeReview:
        db.add(review)
        await db.flush()
        await db.refresh(review)
        return review


code_review_repository = CodeReviewRepository()
