"""
SDLC Brain — Development Service

Simulates AI generation of code files and streams progress via SSE.
"""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import EventType, SSEEvent, event_manager
from app.modules.development.models import CodeFile
from app.modules.development.repository import development_repository


class DevelopmentService:
    async def generate_code_files(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str
    ) -> None:
        """Simulate generating code files and saving to DB."""

        # 1. Start
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Analyzing architecture...", "progress": 10}))
        await asyncio.sleep(2)

        # 2. Generating
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Drafting code structures...", "progress": 50}))
        await asyncio.sleep(2)

        # 3. Finalizing
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Finalizing implementations...", "progress": 85}))
        await asyncio.sleep(1.5)

        # 4. Save to DB
        file1 = CodeFile(
            project_id=project_id,
            file_path="src/services/user_service.py",
            language="python",
            description="Handles user authentication and profile management.",
            content="class UserService:\n    def get_user(self, user_id: str):\n        return {'id': user_id, 'name': 'Mock'}",
            status="draft",
            confidence=0.92,
        )
        file2 = CodeFile(
            project_id=project_id,
            file_path="src/api/routes/users.py",
            language="python",
            description="FastAPI routes for user endpoints.",
            content="@router.get('/users/{id}')\ndef get_user(id: str):\n    return user_service.get_user(id)",
            status="draft",
            confidence=0.88,
        )

        await development_repository.create_code_file(db, file1)
        await development_repository.create_code_file(db, file2)

        # 5. Complete
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Code generation complete.", "progress": 100, "status": "complete"}))

        # Force a reload event
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data={"type": "data", "action": "reload", "target": "development"}))


development_service = DevelopmentService()
