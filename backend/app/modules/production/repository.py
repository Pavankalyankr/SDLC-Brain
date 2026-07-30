"""
SDLC Brain — Production Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.production.models import Incident, Runbook


class ProductionRepository:

    async def get_incidents(self, db: AsyncSession, project_id: str) -> list[Incident]:
        result = await db.execute(
            select(Incident).where(Incident.project_id == project_id).order_by(Incident.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_runbooks(self, db: AsyncSession, project_id: str) -> list[Runbook]:
        result = await db.execute(
            select(Runbook).where(Runbook.project_id == project_id).order_by(Runbook.created_at)
        )
        return list(result.scalars().all())

    async def create_incident(self, db: AsyncSession, incident: Incident) -> Incident:
        db.add(incident)
        await db.flush()
        await db.refresh(incident)
        return incident


production_repository = ProductionRepository()
