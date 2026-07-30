"""
SDLC Brain — Base AI Tool

Interface for tools that AI agents can call.
Future: MCP integration, tool-calling support.
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseTool(ABC):
    """Base interface for AI-callable tools."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description for the LLM."""
        ...

    @abstractmethod
    async def execute(self, **kwargs: Any) -> Any:
        """Execute the tool."""
        ...
