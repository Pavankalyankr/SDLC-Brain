"""
SDLC Brain — DevOps Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.devops.models import ImageVersion, InfraConfig, PipelineConfig, ReleaseNote


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

    # --- Image Version Registry ---

    async def get_image_versions(self, db: AsyncSession, project_id: str) -> list[ImageVersion]:
        result = await db.execute(
            select(ImageVersion).where(ImageVersion.project_id == project_id).order_by(ImageVersion.service_name)
        )
        return list(result.scalars().all())

    async def create_image_version(self, db: AsyncSession, img: ImageVersion) -> ImageVersion:
        db.add(img)
        await db.flush()
        await db.refresh(img)
        return img

    async def update_image_version(self, db: AsyncSession, img_id: str, new_version: str, change_summary: str) -> ImageVersion | None:
        result = await db.execute(select(ImageVersion).where(ImageVersion.id == img_id))
        img = result.scalar_one_or_none()
        if not img:
            return None
        img.previous_version = img.current_version
        img.current_version = new_version
        img.change_summary = change_summary
        img.status = "new"
        await db.flush()
        await db.refresh(img)
        return img

    # --- Release Notes ---

    async def get_release_notes(self, db: AsyncSession, project_id: str) -> list[ReleaseNote]:
        result = await db.execute(
            select(ReleaseNote).where(ReleaseNote.project_id == project_id).order_by(ReleaseNote.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_release_note(self, db: AsyncSession, note: ReleaseNote) -> ReleaseNote:
        db.add(note)
        await db.flush()
        await db.refresh(note)
        return note


devops_repository = DevOpsRepository()
