"""
SDLC Brain — QA Service

Delegates AI test case generation to the QAAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.qa_agent import qa_agent


class QAService:
    async def generate_tests(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "", target_stage: str | None = None, target_id: str | None = None
    ) -> None:
        """Generate test cases using QA AI agent."""
        await qa_agent.generate_test_cases(task_id, db, project_id, instructions, target_stage, target_id)

    async def generate_test_code(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "", target_stage: str | None = None, target_id: str | None = None
    ) -> None:
        """Generate test code files using QA Code AI agent."""
        from app.ai.agents.qa_code_agent import qa_code_agent
        await qa_code_agent.generate_test_code_files(task_id, db, project_id, instructions, target_stage, target_id)


qa_service = QAService()
