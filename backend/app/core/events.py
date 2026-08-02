"""
SDLC Brain — SSE Event Manager

Server-Sent Events for streaming AI generation output to the frontend.
Includes event buffering so late subscribers don't miss events.
"""

import asyncio
import json
from collections import defaultdict
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import uuid4


class EventType(str, Enum):
    """Types of SSE events the frontend can receive."""
    AI_THINKING = "ai_thinking"
    AI_TOKEN = "ai_token"
    AI_COMPLETE = "ai_complete"
    AI_ERROR = "ai_error"
    TASK_STATUS = "task_status"
    ARTIFACT_UPDATED = "artifact_updated"


@dataclass
class SSEEvent:
    """A single Server-Sent Event."""
    event_type: EventType
    data: dict[str, Any]
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def format(self) -> str:
        """Format as SSE wire protocol."""
        payload = {
            "id": self.event_id,
            "type": self.event_type.value,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        return f"data: {json.dumps(payload)}\n\n"


class EventManager:
    """
    Manages SSE event streams for AI task progress.

    Each task_id gets its own event queue. Frontend subscribes to a task_id
    and receives events as they are published.

    IMPORTANT: Events are buffered so late subscribers (due to race conditions
    between task start and stream connection) still receive all events.
    """

    def __init__(self) -> None:
        self._queues: dict[str, list[asyncio.Queue[SSEEvent | None]]] = defaultdict(list)
        # Buffer stores (event_or_None, is_done) tuples per task
        self._buffers: dict[str, list[SSEEvent | None]] = defaultdict(list)
        self._done: set[str] = set()

    def subscribe(self, task_id: str) -> asyncio.Queue[SSEEvent | None]:
        """Subscribe to events for a specific task. Replays buffered events."""
        queue: asyncio.Queue[SSEEvent | None] = asyncio.Queue()
        # Replay any events that happened before subscription (race condition fix)
        for buffered_event in self._buffers.get(task_id, []):
            queue.put_nowait(buffered_event)
        self._queues[task_id].append(queue)
        return queue

    def unsubscribe(self, task_id: str, queue: asyncio.Queue[SSEEvent | None]) -> None:
        """Unsubscribe from events."""
        if task_id in self._queues:
            self._queues[task_id] = [q for q in self._queues[task_id] if q is not queue]
            if not self._queues[task_id]:
                del self._queues[task_id]

    async def publish(self, task_id: str, event: SSEEvent) -> None:
        """Publish an event to all subscribers. Also buffers for late subscribers."""
        # Buffer the event for late subscribers
        self._buffers[task_id].append(event)
        # Send to current subscribers
        for queue in self._queues.get(task_id, []):
            await queue.put(event)

    async def publish_token(self, task_id: str, token: str, metadata: dict[str, Any] | None = None) -> None:
        """Convenience: publish a single streaming token."""
        await self.publish(task_id, SSEEvent(
            event_type=EventType.AI_TOKEN,
            data={"token": token, **(metadata or {})},
        ))

    async def publish_thinking(self, task_id: str, message: str = "Analyzing...") -> None:
        """Convenience: publish AI thinking status."""
        await self.publish(task_id, SSEEvent(
            event_type=EventType.AI_THINKING,
            data={"message": message},
        ))

    async def publish_complete(self, task_id: str, result: dict[str, Any]) -> None:
        """Convenience: publish task completion."""
        await self.publish(task_id, SSEEvent(
            event_type=EventType.AI_COMPLETE,
            data=result,
        ))
        # Signal end of stream (None = sentinel)
        self._buffers[task_id].append(None)
        self._done.add(task_id)
        for queue in self._queues.get(task_id, []):
            await queue.put(None)

    async def publish_error(self, task_id: str, error: str) -> None:
        """Convenience: publish an error."""
        await self.publish(task_id, SSEEvent(
            event_type=EventType.AI_ERROR,
            data={"error": error},
        ))
        # Signal end of stream
        self._buffers[task_id].append(None)
        self._done.add(task_id)
        for queue in self._queues.get(task_id, []):
            await queue.put(None)

    async def stream(self, task_id: str) -> AsyncGenerator[str, None]:
        """Async generator that yields SSE-formatted events for a task.

        Handles late subscription: if events were already published before
        this stream was opened, they are replayed from the buffer.
        """
        queue = self.subscribe(task_id)
        try:
            while True:
                try:
                    # Timeout after 120s in case task was already done before subscribe
                    event = await asyncio.wait_for(queue.get(), timeout=120.0)
                except asyncio.TimeoutError:
                    # Send a heartbeat and break — task likely finished before stream opened
                    yield "data: {\"type\": \"ai_complete\", \"data\": {\"timeout\": true}}\n\n"
                    break
                if event is None:
                    break
                yield event.format()
        finally:
            self.unsubscribe(task_id, queue)

    def cleanup(self, task_id: str) -> None:
        """Clean up buffers for a completed task."""
        self._buffers.pop(task_id, None)
        self._done.discard(task_id)


# Singleton event manager
event_manager = EventManager()
