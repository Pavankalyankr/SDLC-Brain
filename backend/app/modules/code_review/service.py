"""
SDLC Brain — Code Review Service

Delegates AI code review to the CodeReviewAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.code_review_agent import code_review_agent


class CodeReviewService:
    async def generate_code_review(
        self, task_id: str, db: AsyncSession, project_id: str, target_stage: str | None, target_id: str | None, instructions: str = ""
    ) -> None:
        """Generate code review using the real Code Review AI agent."""
        await code_review_agent.generate_code_review(task_id, db, project_id, target_stage, target_id, instructions)


code_review_service = CodeReviewService()
