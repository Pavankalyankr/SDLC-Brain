"""
SDLC Brain — Production Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.production.models import Incident, IncidentAnalysis, Runbook


class ProductionRepository:

    async def get_incidents(self, db: AsyncSession, project_id: str) -> list[Incident]:
        result = await db.execute(
            select(Incident).where(Incident.project_id == project_id).order_by(Incident.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_incident(self, db: AsyncSession, incident_id: str) -> Incident | None:
        result = await db.execute(select(Incident).where(Incident.id == incident_id))
        return result.scalar_one_or_none()

    async def create_incident(self, db: AsyncSession, incident: Incident) -> Incident:
        db.add(incident)
        await db.flush()
        await db.refresh(incident)
        return incident

    async def get_analyses(self, db: AsyncSession, incident_id: str) -> list[IncidentAnalysis]:
        result = await db.execute(
            select(IncidentAnalysis).where(IncidentAnalysis.incident_id == incident_id).order_by(IncidentAnalysis.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_analyses_for_project(self, db: AsyncSession, project_id: str) -> list[IncidentAnalysis]:
        result = await db.execute(
            select(IncidentAnalysis)
            .join(Incident, IncidentAnalysis.incident_id == Incident.id)
            .where(Incident.project_id == project_id)
            .order_by(IncidentAnalysis.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_analysis(self, db: AsyncSession, analysis: IncidentAnalysis) -> IncidentAnalysis:
        db.add(analysis)
        await db.flush()
        await db.refresh(analysis)
        return analysis

    async def get_runbooks(self, db: AsyncSession, project_id: str) -> list[Runbook]:
        result = await db.execute(
            select(Runbook).where(Runbook.project_id == project_id).order_by(Runbook.created_at)
        )
        return list(result.scalars().all())


production_repository = ProductionRepository()
