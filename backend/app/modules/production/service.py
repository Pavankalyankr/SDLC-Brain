"""
SDLC Brain — Production Service

Simulates incident analysis.
"""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import EventType, SSEEvent, event_manager
from app.modules.production.models import Incident
from app.modules.production.repository import production_repository


class ProductionService:
    async def analyze_incident(
        self, task_id: str, db: AsyncSession, project_id: str, description: str
    ) -> None:
        """Simulate incident analysis and save to DB."""

        # 1. Start
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Fetching recent logs and metrics...", "progress": 20}))
        await asyncio.sleep(1.5)

        # 2. Analyzing
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Correlating errors with recent deployments...", "progress": 60}))
        await asyncio.sleep(2)

        # 3. Generating RCA
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Drafting Root Cause Analysis...", "progress": 85}))
        await asyncio.sleep(1.5)

        # 4. Save to DB
        incident = Incident(
            project_id=project_id,
            title="High API Latency on /users endpoint",
            description=description or "System reporting 5xx errors and timeouts during peak load.",
            severity="high",
            root_cause="Database connection pool was exhausted due to unoptimized queries in the user feed service.",
            resolution="Increase DB connection pool size and add a Redis cache layer for frequent queries.",
            ai_analysis="The issue started immediately after deploy v1.4. CPU on DB instance spiked to 99%.",
            status="open",
            confidence=0.91,
        )

        await production_repository.create_incident(db, incident)

        # 5. Complete
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Analysis complete.", "progress": 100, "status": "complete"}))

        # Force a reload event
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data={"type": "data", "action": "reload", "target": "production"}))


production_service = ProductionService()
