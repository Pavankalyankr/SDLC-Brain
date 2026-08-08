"""
SDLC Brain — DevOps Service

Delegates to the DevOps Agent for the 3-step pipeline.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.devops_agent import devops_agent


class DevOpsService:
    async def generate_devops(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> None:
        """Step 1+2: Analyze project and generate DevOps artifacts."""
        await devops_agent.generate_devops(task_id, db, project_id, instructions)

    async def generate_release(
        self, task_id: str, db: AsyncSession, project_id: str, version: str = "", changes: str = ""
    ) -> None:
        """Step 3: Generate release notes and deployment instructions."""
        await devops_agent.generate_release(task_id, db, project_id, version, changes)


devops_service = DevOpsService()
