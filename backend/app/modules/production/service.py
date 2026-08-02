"""
SDLC Brain — Production Service

Delegates AI incident analysis to the ProductionAgent.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.production_agent import production_agent


class ProductionService:
    async def analyze_incident(
        self, task_id: str, db: AsyncSession, project_id: str, description: str = ""
    ) -> None:
        """Run Root Cause Analysis using the real Production AI agent."""
        await production_agent.analyze_incident(task_id, db, project_id, description)


production_service = ProductionService()
