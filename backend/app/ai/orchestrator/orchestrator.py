"""
SDLC Brain — AI Orchestrator

Central orchestration layer. All AI requests go through here.
No module ever calls an LLM provider directly.

Flow: Module → Orchestrator → Router → Provider → LLM → Response
"""

import logging
from collections.abc import AsyncGenerator
from typing import Any

from app.ai.memory.context import ContextBuilder
from app.ai.providers.registry import provider_registry
from app.ai.router import ai_router
from app.core.events import event_manager

logger = logging.getLogger(__name__)


class AIOrchestrator:
    """
    Central AI Orchestrator.

    Responsibilities:
    1. Accept generation requests from modules
    2. Resolve the correct model via AI Router
    3. Build context from project memory
    4. Call the provider
    5. Stream results via SSE
    6. Return final output
    """

    def __init__(self) -> None:
        self._context_builder = ContextBuilder()
        self._initialized = False

    def initialize(self) -> None:
        """Initialize providers from config. Call once at startup."""
        if self._initialized:
            return
        providers_config = ai_router.get_all_providers()
        provider_registry.initialize_from_config(providers_config)
        self._initialized = True

    async def generate(
        self,
        task_type: str,
        messages: list[dict[str, str]],
        project_id: str | None = None,
        task_id: str | None = None,
        system_prompt: str | None = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a complete (non-streaming) response.

        Args:
            task_type: The SDLC task type (agile, architecture, development, etc.)
            messages: Chat messages to send to the LLM
            project_id: Optional project ID for memory context injection
            task_id: Optional task ID for SSE notifications
            system_prompt: Optional system prompt override
        """
        self._ensure_initialized()
        resolution = ai_router.resolve_task(task_type)

        # Build messages with project memory context
        full_messages = await self._build_messages(
            messages=messages,
            project_id=project_id,
            system_prompt=system_prompt,
        )

        # Get the provider
        provider = provider_registry.get(resolution["provider"])

        # Notify thinking status
        if task_id:
            await event_manager.publish_thinking(task_id, f"Using {resolution['model_name']}...")

        try:
            result = await provider.generate(
                model=resolution["model_id"],
                messages=full_messages,
                max_tokens=resolution["max_tokens"],
                temperature=resolution["temperature"],
                **kwargs,
            )

            # Notify completion
            if task_id:
                await event_manager.publish_complete(task_id, {"content": result})

            return result

        except Exception as e:
            logger.error(f"AI generation error ({task_type}): {e}")
            if task_id:
                await event_manager.publish_error(task_id, str(e))
            raise

    async def stream_generate(
        self,
        task_type: str,
        messages: list[dict[str, str]],
        project_id: str | None = None,
        task_id: str | None = None,
        system_prompt: str | None = None,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """
        Stream tokens from the LLM.

        Yields individual tokens and publishes them to SSE for the frontend.
        """
        self._ensure_initialized()
        resolution = ai_router.resolve_task(task_type)

        full_messages = await self._build_messages(
            messages=messages,
            project_id=project_id,
            system_prompt=system_prompt,
        )

        provider = provider_registry.get(resolution["provider"])

        if task_id:
            await event_manager.publish_thinking(task_id, f"Thinking with {resolution['model_name']}...")

        full_response = ""
        try:
            async for token in provider.stream(
                model=resolution["model_id"],
                messages=full_messages,
                max_tokens=resolution["max_tokens"],
                temperature=resolution["temperature"],
                **kwargs,
            ):
                full_response += token
                if task_id:
                    await event_manager.publish_token(task_id, token)
                yield token

            if task_id:
                await event_manager.publish_complete(task_id, {"content": full_response})

        except Exception as e:
            logger.error(f"AI streaming error ({task_type}): {e}")
            if task_id:
                await event_manager.publish_error(task_id, str(e))
            raise

    async def _build_messages(
        self,
        messages: list[dict[str, str]],
        project_id: str | None = None,
        system_prompt: str | None = None,
    ) -> list[dict[str, str]]:
        """Build the full message list with system prompt and project memory."""
        full_messages: list[dict[str, str]] = []

        # System prompt with project memory context
        if system_prompt or project_id:
            context = ""
            if project_id:
                context = await self._context_builder.build_context(project_id)

            system_content = system_prompt or "You are an AI assistant for software development."
            if context:
                system_content += f"\n\n## Project Context\n{context}"

            full_messages.append({"role": "system", "content": system_content})

        full_messages.extend(messages)
        return full_messages

    def _ensure_initialized(self) -> None:
        if not self._initialized:
            self.initialize()


# Singleton
orchestrator = AIOrchestrator()
