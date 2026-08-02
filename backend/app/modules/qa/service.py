"""
SDLC Brain — QA Service

Delegates AI test case generation to the QAAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.qa_agent import qa_agent


class QAService:
    async def generate_tests(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> None:
        """Generate test cases using the real QA AI agent."""
        await qa_agent.generate_test_cases(task_id, db, project_id, instructions)


qa_service = QAService()
