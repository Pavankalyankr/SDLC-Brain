"""
SDLC Brain — Base Prompt Builder

Shared infrastructure for building prompts with project context.
"""

from typing import Any


class BasePromptBuilder:
    """
    Base class for all module-specific prompt builders.
    Provides common methods for structuring prompts.
    """

    def build_system_prompt(self, role: str, instructions: str, context: str = "") -> str:
        """Build a system prompt with role, instructions, and optional context."""
        parts = [
            f"You are {role}.",
            "",
            "## Instructions",
            instructions,
        ]

        if context:
            parts.extend(["", "## Project Context", context])

        parts.extend([
            "",
            "## Output Requirements",
            "- Respond ONLY with the requested output format",
            "- Be precise, thorough, and professional",
            "- Use industry best practices",
            "- Do not include explanations unless asked",
        ])

        return "\n".join(parts)

    def format_json_instruction(self, schema: dict[str, Any]) -> str:
        """Instruct the LLM to respond in a specific JSON format."""
        import json
        return (
            "Respond in valid JSON matching this schema:\n"
            f"```json\n{json.dumps(schema, indent=2)}\n```"
        )
