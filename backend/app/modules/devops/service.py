"""
SDLC Brain — DevOps Service

Simulates generation of CI/CD and infrastructure files.
"""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import EventType, SSEEvent, event_manager
from app.modules.devops.models import InfraConfig, PipelineConfig
from app.modules.devops.repository import devops_repository


class DevOpsService:
    async def generate_devops(
        self, task_id: str, db: AsyncSession, project_id: str
    ) -> None:
        """Simulate generating devops configs and save to DB."""

        # 1. Start
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Analyzing system requirements...", "progress": 15}))
        await asyncio.sleep(1.5)

        # 2. Infra
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Generating Dockerfile and K8s manifests...", "progress": 55}))
        await asyncio.sleep(2)

        # 3. Pipelines
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Drafting CI/CD pipelines...", "progress": 80}))
        await asyncio.sleep(1.5)

        # 4. Save to DB
        pipeline = PipelineConfig(
            project_id=project_id,
            name="Production CI/CD",
            platform="github_actions",
            config_content="name: Build and Deploy\n\non:\n  push:\n    branches: [ main ]",
            description="Builds the Docker image, runs tests, and deploys to Kubernetes.",
            status="generated",
            confidence=0.98,
        )

        infra = InfraConfig(
            project_id=project_id,
            name="Backend API Dockerfile",
            config_type="dockerfile",
            config_content="FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .",
            description="Production-ready multi-stage Dockerfile for FastAPI.",
            status="generated",
            confidence=0.99,
        )

        await devops_repository.create_pipeline(db, pipeline)
        await devops_repository.create_infra(db, infra)

        # 5. Complete
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "DevOps generation complete.", "progress": 100, "status": "complete"}))

        # Force a reload event
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data={"type": "data", "action": "reload", "target": "devops"}))


devops_service = DevOpsService()
