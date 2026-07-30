"""
SDLC Brain — Agile Service

Business logic for agile artifact generation and management.
Delegates AI generation to the AgileAgent, manages status/approval flow.
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agents.agile_agent import agile_agent
from app.ai.orchestrator.task_queue import task_queue
from app.core.exceptions import ApprovalLockException, NotFoundException
from app.modules.agile.models import Epic, Feature, Requirement, Story
from app.modules.agile.repository import agile_repository

logger = logging.getLogger(__name__)


class AgileService:
    """Business logic for agile artifact operations."""

    # ──────────────────────────────────────────
    # Requirements
    # ──────────────────────────────────────────

    async def get_requirements(self, db: AsyncSession, project_id: str) -> list[Requirement]:
        return await agile_repository.get_requirements(db, project_id)

    async def get_requirement(self, db: AsyncSession, requirement_id: str) -> Requirement:
        req = await agile_repository.get_requirement(db, requirement_id)
        if not req:
            raise NotFoundException("Requirement", requirement_id)
        return req

    async def generate_requirements(
        self, db: AsyncSession, project_id: str, sow_content: str, instructions: str = ""
    ) -> dict:
        """Queue requirement generation from SOW text."""
        task_id = f"agile-req-{uuid.uuid4().hex[:8]}"

        async def _worker(tid: str) -> list:
            return await agile_agent.generate_requirements(
                task_id=tid,
                db=db,
                project_id=project_id,
                sow_text=sow_content,
                instructions=instructions,
            )

        await task_queue.submit("agile", project_id, _worker)
        return {"task_id": task_id, "status": "generating", "type": "requirements"}

    async def update_requirement_status(
        self, db: AsyncSession, requirement_id: str, status: str, feedback: str | None = None
    ) -> Requirement:
        req = await self.get_requirement(db, requirement_id)
        if req.locked and status != "approved":
            raise ApprovalLockException("Requirement", requirement_id)

        req.status = status
        if feedback:
            req.feedback = feedback
        if status == "approved":
            req.locked = True
            req.approved_at = datetime.now(UTC)

        await db.flush()
        await db.refresh(req)
        return req

    # ──────────────────────────────────────────
    # Epics
    # ──────────────────────────────────────────

    async def get_epics(self, db: AsyncSession, project_id: str) -> list[Epic]:
        return await agile_repository.get_epics(db, project_id)

    async def generate_epics(
        self, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> dict:
        """Queue epic generation from approved requirements."""
        task_id = f"agile-epic-{uuid.uuid4().hex[:8]}"

        async def _worker(tid: str) -> list:
            return await agile_agent.generate_epics(
                task_id=tid, db=db, project_id=project_id, instructions=instructions
            )

        await task_queue.submit("agile", project_id, _worker)
        return {"task_id": task_id, "status": "generating", "type": "epics"}

    async def update_epic_status(
        self, db: AsyncSession, epic_id: str, status: str, feedback: str | None = None
    ) -> Epic:
        epic = await agile_repository.get_epic(db, epic_id)
        if not epic:
            raise NotFoundException("Epic", epic_id)
        if epic.locked and status != "approved":
            raise ApprovalLockException("Epic", epic_id)

        epic.status = status
        if feedback:
            epic.feedback = feedback
        if status == "approved":
            epic.locked = True
            epic.approved_at = datetime.now(UTC)

        await db.flush()
        await db.refresh(epic)
        return epic

    # ──────────────────────────────────────────
    # Features
    # ──────────────────────────────────────────

    async def get_features(self, db: AsyncSession, project_id: str) -> list[Feature]:
        return await agile_repository.get_features(db, project_id)

    async def generate_features(
        self, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> dict:
        """Queue feature generation from approved epics."""
        task_id = f"agile-feat-{uuid.uuid4().hex[:8]}"

        async def _worker(tid: str) -> list:
            return await agile_agent.generate_features(
                task_id=tid, db=db, project_id=project_id, instructions=instructions
            )

        await task_queue.submit("agile", project_id, _worker)
        return {"task_id": task_id, "status": "generating", "type": "features"}

    async def update_feature_status(
        self, db: AsyncSession, feature_id: str, status: str, feedback: str | None = None
    ) -> Feature:
        feature = await agile_repository.get_feature(db, feature_id)
        if not feature:
            raise NotFoundException("Feature", feature_id)
        if feature.locked and status != "approved":
            raise ApprovalLockException("Feature", feature_id)

        feature.status = status
        if feedback:
            feature.feedback = feedback
        if status == "approved":
            feature.locked = True
            feature.approved_at = datetime.now(UTC)

        await db.flush()
        await db.refresh(feature)
        return feature

    # ──────────────────────────────────────────
    # Stories
    # ──────────────────────────────────────────

    async def get_stories(self, db: AsyncSession, project_id: str) -> list[Story]:
        return await agile_repository.get_stories(db, project_id)

    async def get_approved_stories(self, db: AsyncSession, project_id: str) -> list[Story]:
        return await agile_repository.get_approved_stories(db, project_id)

    async def generate_stories(
        self, db: AsyncSession, project_id: str, instructions: str = ""
    ) -> dict:
        """Queue story generation from approved features."""
        task_id = f"agile-story-{uuid.uuid4().hex[:8]}"

        async def _worker(tid: str) -> list:
            return await agile_agent.generate_stories(
                task_id=tid, db=db, project_id=project_id, instructions=instructions
            )

        await task_queue.submit("agile", project_id, _worker)
        return {"task_id": task_id, "status": "generating", "type": "stories"}

    async def update_story_status(
        self, db: AsyncSession, story_id: str, status: str, feedback: str | None = None
    ) -> Story:
        story = await agile_repository.get_story(db, story_id)
        if not story:
            raise NotFoundException("Story", story_id)
        if story.locked and status != "approved":
            raise ApprovalLockException("Story", story_id)

        story.status = status
        if feedback:
            story.feedback = feedback
        if status == "approved":
            story.locked = True
            story.approved_at = datetime.now(UTC)

        await db.flush()
        await db.refresh(story)
        return story


agile_service = AgileService()
