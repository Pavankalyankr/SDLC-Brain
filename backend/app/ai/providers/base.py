"""
SDLC Brain — LLM Provider Base

Abstract base class for LLM providers.
All providers implement this interface.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any


class BaseLLMProvider(ABC):
    """Abstract interface for LLM providers."""

    @abstractmethod
    async def generate(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> str:
        """Generate a complete response (non-streaming)."""
        ...

    @abstractmethod
    def stream(
        self,
        model: str,
        messages: list[dict[str, str]],
        max_tokens: int = 4096,
        temperature: float = 0.5,
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        """Stream tokens as they are generated."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is reachable."""
        ...
