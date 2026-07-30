"""
SDLC Brain — LiteLLM Provider

Provider-agnostic LLM client using LiteLLM.
Supports NVIDIA NIM, Ollama, Groq, OpenRouter, and any OpenAI-compatible API.
"""

import logging
from collections.abc import AsyncGenerator
from typing import Any

import litellm

from app.ai.providers.base import BaseLLMProvider

logger = logging.getLogger(__name__)

# Suppress LiteLLM's verbose logging
litellm.suppress_debug_info = True


class LiteLLMProvider(BaseLLMProvider):
    """
    LiteLLM-based provider. Translates between different LLM API formats
    automatically. Supports all providers that LiteLLM supports.
    """

    def __init__(
        self,
        api_base: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self.api_base = api_base
        self.api_key = api_key

    async def generate(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> str:
        """Generate a complete response."""
        try:
            response = await litellm.acompletion(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                api_base=self.api_base,
                api_key=self.api_key,
                drop_params=True,
                **kwargs,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"LiteLLM generation error: {e}")
            raise

    async def stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """Stream tokens as they arrive."""
        try:
            response = await litellm.acompletion(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                api_base=self.api_base,
                api_key=self.api_key,
                stream=True,
                drop_params=True,
                **kwargs,
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception as e:
            logger.error(f"LiteLLM streaming error: {e}")
            raise

    async def health_check(self) -> bool:
        """Verify the provider is reachable with a minimal request."""
        try:
            test_model = "openrouter/openai/gpt-3.5-turbo" if (self.api_base and "openrouter" in self.api_base) else "gpt-3.5-turbo"
            response = await litellm.acompletion(
                model=test_model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
                api_base=self.api_base,
                api_key=self.api_key,
                drop_params=True,
            )
            return bool(response.choices)
        except Exception as e:
            logger.warning(f"LiteLLM health check failed: {e}")
            return False
