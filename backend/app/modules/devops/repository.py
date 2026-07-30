"""
SDLC Brain — DevOps Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.devops.models import InfraConfig, PipelineConfig


class DevOpsRepository:
    async def get_pipelines(self, db: AsyncSession, project_id: str) -> list[PipelineConfig]:
        result = await db.execute(
            select(PipelineConfig).where(PipelineConfig.project_id == project_id).order_by(PipelineConfig.created_at)
        )
        return list(result.scalars().all())

    async def get_infra(self, db: AsyncSession, project_id: str) -> list[InfraConfig]:
        result = await db.execute(
            select(InfraConfig).where(InfraConfig.project_id == project_id).order_by(InfraConfig.created_at)
        )
        return list(result.scalars().all())

    async def create_pipeline(self, db: AsyncSession, config: PipelineConfig) -> PipelineConfig:
        db.add(config)
        await db.flush()
        await db.refresh(config)
        return config

    async def create_infra(self, db: AsyncSession, config: InfraConfig) -> InfraConfig:
        db.add(config)
        await db.flush()
        await db.refresh(config)
        return config


devops_repository = DevOpsRepository()
