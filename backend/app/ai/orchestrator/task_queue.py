"""
SDLC Brain — AI Task Queue

Async background task queue for AI generation.
Prevents frontend timeouts by running LLM calls in background tasks.

Flow: User clicks Generate → Task Created → Queue → Worker → LLM → Save → Notify
"""

import asyncio
import logging
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AITask:
    """Represents an AI generation task."""
    id: str = field(default_factory=lambda: str(uuid4()))
    task_type: str = ""
    project_id: str = ""
    status: TaskStatus = TaskStatus.PENDING
    result: Any = None
    error: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    started_at: datetime | None = None
    completed_at: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class TaskQueue:
    """
    Simple async task queue for AI operations.

    For MVP, this uses asyncio.create_task() for background execution.
    Post-MVP: Can be upgraded to Celery/Redis for distributed processing.
    """

    def __init__(self) -> None:
        self._tasks: dict[str, AITask] = {}
        self._max_concurrent: int = 5
        self._semaphore = asyncio.Semaphore(self._max_concurrent)

    async def submit(
        self,
        task_type: str,
        project_id: str,
        worker: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> AITask:
        """
        Submit a task to the queue. Returns immediately with the task ID.
        The actual work runs in the background.
        """
        task = AITask(task_type=task_type, project_id=project_id)
        self._tasks[task.id] = task

        # Run in background
        asyncio.create_task(self._execute(task, worker, *args, **kwargs))

        logger.info(f"Task {task.id} submitted ({task_type}) for project {project_id}")
        return task

    async def _execute(
        self,
        task: AITask,
        worker: Callable[..., Coroutine[Any, Any, Any]],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Execute a task with concurrency limiting."""
        async with self._semaphore:
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now(UTC)

            try:
                result = await worker(task.id, *args, **kwargs)
                task.result = result
                task.status = TaskStatus.COMPLETED
                logger.info(f"Task {task.id} completed successfully")
            except asyncio.CancelledError:
                task.status = TaskStatus.CANCELLED
                logger.info(f"Task {task.id} cancelled")
            except Exception as e:
                task.error = str(e)
                task.status = TaskStatus.FAILED
                logger.error(f"Task {task.id} failed: {e}")
                from app.core.events import event_manager
                await event_manager.publish_error(task.id, f"AI Generation failed: {str(e)}")
            finally:
                task.completed_at = datetime.now(UTC)

    def get_task(self, task_id: str) -> AITask | None:
        """Get a task by ID."""
        return self._tasks.get(task_id)

    def get_tasks_for_project(self, project_id: str) -> list[AITask]:
        """Get all tasks for a project."""
        return [t for t in self._tasks.values() if t.project_id == project_id]

    def cleanup_old_tasks(self, max_age_hours: int = 24) -> int:
        """Remove completed tasks older than max_age_hours."""
        now = datetime.now(UTC)
        to_remove = []
        for task_id, task in self._tasks.items():
            if task.completed_at:
                age = (now - task.completed_at).total_seconds() / 3600
                if age > max_age_hours:
                    to_remove.append(task_id)

        for task_id in to_remove:
            del self._tasks[task_id]

        return len(to_remove)


# Singleton
task_queue = TaskQueue()
