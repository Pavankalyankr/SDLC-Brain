"""
SDLC Brain — Agile Repository

Database queries for the Agile module.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agile.models import Epic, Feature, Requirement, Story


class AgileRepository:
    """Database access for agile artifacts."""

    # --- Requirements ---
    async def get_requirements(self, db: AsyncSession, project_id: str) -> list[Requirement]:
        result = await db.execute(
            select(Requirement).where(Requirement.project_id == project_id).order_by(Requirement.created_at)
        )
        return list(result.scalars().all())

    async def get_requirement(self, db: AsyncSession, requirement_id: str) -> Requirement | None:
        result = await db.execute(select(Requirement).where(Requirement.id == requirement_id))
        return result.scalar_one_or_none()

    async def create_requirement(self, db: AsyncSession, requirement: Requirement) -> Requirement:
        db.add(requirement)
        await db.flush()
        await db.refresh(requirement)
        return requirement

    # --- Epics ---
    async def get_epics(self, db: AsyncSession, project_id: str) -> list[Epic]:
        result = await db.execute(
            select(Epic).where(Epic.project_id == project_id).order_by(Epic.created_at)
        )
        return list(result.scalars().all())

    async def get_epic(self, db: AsyncSession, epic_id: str) -> Epic | None:
        result = await db.execute(select(Epic).where(Epic.id == epic_id))
        return result.scalar_one_or_none()

    async def create_epic(self, db: AsyncSession, epic: Epic) -> Epic:
        db.add(epic)
        await db.flush()
        await db.refresh(epic)
        return epic

    # --- Features ---
    async def get_features(self, db: AsyncSession, project_id: str) -> list[Feature]:
        result = await db.execute(
            select(Feature).where(Feature.project_id == project_id).order_by(Feature.created_at)
        )
        return list(result.scalars().all())

    async def get_feature(self, db: AsyncSession, feature_id: str) -> Feature | None:
        result = await db.execute(select(Feature).where(Feature.id == feature_id))
        return result.scalar_one_or_none()

    async def create_feature(self, db: AsyncSession, feature: Feature) -> Feature:
        db.add(feature)
        await db.flush()
        await db.refresh(feature)
        return feature

    # --- Stories ---
    async def get_stories(self, db: AsyncSession, project_id: str) -> list[Story]:
        result = await db.execute(
            select(Story).where(Story.project_id == project_id).order_by(Story.created_at)
        )
        return list(result.scalars().all())

    async def get_story(self, db: AsyncSession, story_id: str) -> Story | None:
        result = await db.execute(select(Story).where(Story.id == story_id))
        return result.scalar_one_or_none()

    async def create_story(self, db: AsyncSession, story: Story) -> Story:
        db.add(story)
        await db.flush()
        await db.refresh(story)
        return story

    async def get_approved_stories(self, db: AsyncSession, project_id: str) -> list[Story]:
        result = await db.execute(
            select(Story).where(Story.project_id == project_id, Story.status == "approved")
        )
        return list(result.scalars().all())


agile_repository = AgileRepository()
