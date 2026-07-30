"""
SDLC Brain — Context Builder

Builds context strings from project memory for AI prompt injection.
"""

import logging

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Builds context strings from project memory to inject into AI prompts.
    Ensures all AI generations are consistent with prior approved decisions.
    """

    async def build_context(self, project_id: str) -> str:
        """
        Build a context string from project memory.
        This is injected into the system prompt for every AI call.
        """
        # Lazy import to avoid circular dependencies
        from app.ai.memory.manager import memory_manager
        from app.core.database import async_session_factory

        try:
            async with async_session_factory() as db:
                memory = await memory_manager.get_memory(db, project_id)

            if not memory:
                return ""

            lines = ["The following decisions have been approved for this project:"]
            for key, value in memory.items():
                # Format key nicely: backend_framework → Backend Framework
                display_key = key.replace("_", " ").title()
                lines.append(f"- **{display_key}**: {value}")

            lines.append(
                "\nYou MUST use these decisions consistently. "
                "Do not suggest alternatives unless explicitly asked."
            )

            return "\n".join(lines)

        except Exception as e:
            logger.warning(f"Failed to build context for project {project_id}: {e}")
            return ""
