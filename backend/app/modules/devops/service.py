"""
SDLC Brain — DevOps Service

Delegates AI DevOps generation to the DevOpsAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.devops_agent import devops_agent


class DevOpsService:
    async def generate_devops(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> None:
        """Generate CI/CD and infra configs using the real DevOps AI agent."""
        await devops_agent.generate_devops(task_id, db, project_id, instructions)


devops_service = DevOpsService()
