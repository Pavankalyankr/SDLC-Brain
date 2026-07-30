"""
SDLC Brain — QA Service

Simulates test plan and test case generation.
"""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import EventType, SSEEvent, event_manager
from app.modules.qa.models import TestCase
from app.modules.qa.repository import qa_repository


class QAService:
    async def generate_tests(
        self, task_id: str, db: AsyncSession, project_id: str
    ) -> None:
        """Simulate generating test cases and save to DB."""

        # 1. Start
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Analyzing requirements and code...", "progress": 20}))
        await asyncio.sleep(1.5)

        # 2. Generating
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Drafting test cases...", "progress": 60}))
        await asyncio.sleep(2)

        # 3. Finalizing
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Finalizing edge cases...", "progress": 85}))
        await asyncio.sleep(1.5)

        # 4. Save to DB
        test1 = TestCase(
            project_id=project_id,
            title="User Profile Authentication",
            description="Verify that an authenticated user can retrieve their profile via /users/{id}.",
            test_type="integration",
            preconditions="User account exists in database and valid JWT token is provided.",
            steps="1. Send GET request to /users/1 with Bearer token.\n2. Verify response status is 200 OK.",
            expected_result="JSON object containing user profile data is returned.",
            status="draft",
            confidence=0.96,
        )

        test2 = TestCase(
            project_id=project_id,
            title="User Profile Unauthorized Access",
            description="Verify that an unauthenticated request returns 401 Unauthorized.",
            test_type="security",
            preconditions="No valid JWT token is provided.",
            steps="1. Send GET request to /users/1 without Authorization header.\n2. Verify response status is 401 Unauthorized.",
            expected_result="Error message 'Not authenticated' is returned.",
            status="draft",
            confidence=0.99,
        )

        await qa_repository.create_test_case(db, test1)
        await qa_repository.create_test_case(db, test2)

        # 5. Complete
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Test generation complete.", "progress": 100, "status": "complete"}))

        # Force a reload event
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data={"type": "data", "action": "reload", "target": "qa"}))


qa_service = QAService()
