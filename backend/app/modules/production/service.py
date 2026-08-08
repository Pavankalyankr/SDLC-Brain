"""
SDLC Brain — Production Service
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.production_agent import production_agent


class ProductionService:
    async def analyze_incident(
        self, task_id: str, db: AsyncSession, project_id: str,
        title: str = "", raw_logs: str = "", severity: str = "medium",
        service: str = "", description: str = "",
    ) -> None:
        await production_agent.analyze_incident(
            task_id, db, project_id, title, raw_logs, severity, service, description
        )


production_service = ProductionService()
