"""
SDLC Brain — SSE Streaming Handler

Connects the AI orchestrator's streaming output to FastAPI SSE responses.
"""

from collections.abc import AsyncGenerator
from typing import Any

from sse_starlette.sse import EventSourceResponse
from starlette.requests import Request

from app.core.events import event_manager


async def create_sse_response(request: Request, task_id: str) -> EventSourceResponse:
    """
    Create an SSE response that streams events for a given task.
    The frontend connects to this endpoint and receives real-time updates.
    """

    async def event_generator() -> AsyncGenerator[dict[str, Any], None]:
        async for event_data in event_manager.stream(task_id):
            if await request.is_disconnected():
                break
            yield {"data": event_data}

    return EventSourceResponse(event_generator())
