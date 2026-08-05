"""
SDLC Brain — Development Service

Delegates AI code generation to the DevelopmentAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.development_agent import development_agent


class DevelopmentService:
    async def generate_code_files(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "", chat_history: list[dict[str, str]] | None = None
    ) -> None:
        """Generate code files using the real Development AI agent."""
        await development_agent.generate_code_files(task_id, db, project_id, instructions, chat_history)


development_service = DevelopmentService()
