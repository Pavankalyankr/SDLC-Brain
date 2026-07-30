"""
SDLC Brain — Code Review Service

Simulates AI static analysis and code review.
"""

import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.events import event_manager, EventType, SSEEvent
from app.modules.code_review.models import CodeReview
from app.modules.code_review.repository import code_review_repository


class CodeReviewService:
    async def generate_code_review(
        self, task_id: str, db: AsyncSession, project_id: str
    ) -> None:
        """Simulate code review analysis and save to DB."""
        
        # 1. Start
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Cloning repository...", "progress": 10}))
        await asyncio.sleep(1.5)
        
        # 2. Analyzing
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Running static analysis (Ruff/MyPy)...", "progress": 45}))
        await asyncio.sleep(2)
        
        # 3. Generating comments
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "AI model analyzing logic and security...", "progress": 75}))
        await asyncio.sleep(2)

        # 4. Save to DB
        review1 = CodeReview(
            project_id=project_id,
            file_path="src/services/user_service.py",
            original_code="class UserService:\n    def get_user(self, id: str):\n        pass",
            review_comments=json.dumps([
                {"line": 2, "message": "Missing type hint on return value.", "type": "warning"},
                {"line": 3, "message": "Method is unimplemented.", "type": "error"}
            ]),
            severity="warning",
            suggestions=json.dumps([
                "Add `-> dict:` to `get_user`",
                "Implement database lookup logic."
            ]),
            score=65.5,
            status="reviewed",
            confidence=0.95,
        )

        review2 = CodeReview(
            project_id=project_id,
            file_path="src/api/routes/users.py",
            original_code="@router.get('/users/{id}')\ndef get_user(id: str):\n    pass",
            review_comments=json.dumps([
                {"line": 1, "message": "Missing response_model in decorator.", "type": "warning"}
            ]),
            severity="info",
            suggestions=json.dumps([
                "Add `response_model=UserResponse` to the `@router.get` decorator."
            ]),
            score=88.0,
            status="reviewed",
            confidence=0.91,
        )

        await code_review_repository.create_code_review(db, review1)
        await code_review_repository.create_code_review(db, review2)
        
        # 5. Complete
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.TASK_STATUS, data={"type": "status", "message": "Code review complete.", "progress": 100, "status": "complete"}))
        
        # Force a reload event
        await event_manager.publish(task_id, SSEEvent(event_type=EventType.ARTIFACT_UPDATED, data={"type": "data", "action": "reload", "target": "code_review"}))


code_review_service = CodeReviewService()
