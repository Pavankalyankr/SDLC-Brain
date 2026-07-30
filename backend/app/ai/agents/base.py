"""
SDLC Brain — Base Agent

Base class for LangGraph agent definitions.
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """
    Base class for all SDLC module agents.
    Each agent defines a LangGraph workflow for its module.
    """

    @abstractmethod
    async def run(self, input_data: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
        """Execute the agent workflow."""
        ...

    @property
    @abstractmethod
    def task_type(self) -> str:
        """The task type this agent handles (for orchestrator routing)."""
        ...
