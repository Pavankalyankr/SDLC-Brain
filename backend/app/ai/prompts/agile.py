"""
SDLC Brain — Agile Prompt Templates

Structured prompts for each agile artifact tier.
All prompts enforce JSON output for reliable parsing.
"""

from app.ai.prompts.base import BasePromptBuilder


class AgilePromptBuilder(BasePromptBuilder):
    """Builds prompts for agile artifact generation."""

    def requirements_prompt(self, sow_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for SOW → Requirements."""
        system = self.build_system_prompt(
            role="an expert Business Analyst and Requirements Engineer",
            instructions="""Analyze the provided Statement of Work (SOW) and extract clear, actionable software requirements.

For each requirement, provide:
- **title**: A concise, specific title (NOT generic like "Requirement 1")
- **description**: Detailed description covering the what, why, and acceptance criteria
- **priority**: "high", "medium", or "low" based on business impact
- **category**: "functional", "non_functional", "technical", or "business"

Guidelines:
- Extract EVERY requirement mentioned or implied in the SOW
- Be specific — avoid vague descriptions
- Group related requirements logically
- Each requirement should be independently testable
- Non-functional requirements (performance, security, scalability) are equally important

Respond in valid JSON as an array of requirement objects."""
        )

        user_content = f"## Statement of Work\n\n{sow_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def epics_prompt(self, requirements_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for Requirements → Epics."""
        system = self.build_system_prompt(
            role="an expert Agile Coach and Product Owner",
            instructions="""From the approved requirements, generate well-structured Epics.

Each epic should:
- Represent a large, cohesive body of work
- Group logically related requirements
- Have a clear business objective
- Be decomposable into features

For each epic, provide:
- **title**: A descriptive title
- **description**: What this epic covers, its business value, and scope
- **requirement_ids**: Array of requirement IDs this epic addresses

Respond in valid JSON as an array of epic objects."""
        )

        user_content = f"## Approved Requirements\n\n{requirements_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def features_prompt(self, epics_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for Epics → Features."""
        system = self.build_system_prompt(
            role="an expert Product Owner and Feature Analyst",
            instructions="""From the approved epics, generate specific Features.

Each feature should:
- Deliver a distinct piece of user-visible functionality
- Be independently demonstrable
- Fit within a single sprint for implementation
- Have clear boundaries

For each feature, provide:
- **title**: A specific, action-oriented title
- **description**: What the feature does, who benefits, and how it works
- **epic_id**: The parent epic ID

Respond in valid JSON as an array of feature objects."""
        )

        user_content = f"## Approved Epics\n\n{epics_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def stories_prompt(self, features_text: str, instructions: str = "") -> tuple[str, list[dict]]:
        """Build prompt for Features → Stories."""
        system = self.build_system_prompt(
            role="an expert Scrum Master and Story Writer",
            instructions="""From the approved features, generate detailed User Stories.

Each story MUST follow this format:
"As a [user role], I want [goal/action], so that [benefit/value]"

For each story, provide:
- **title**: Story title (concise)
- **description**: Full user story in As a/I want/So that format
- **acceptance_criteria**: Bullet-pointed list of acceptance criteria (use \\n for newlines)
- **story_points**: Estimated complexity (1, 2, 3, 5, 8, or 13)
- **priority**: "high", "medium", or "low"
- **sprint**: Suggested sprint ("Sprint 1", "Sprint 2", etc.)
- **feature_id**: The parent feature ID

Guidelines:
- Stories should be small enough to complete in 1-3 days
- Each story should be independently deployable
- Acceptance criteria must be specific and testable
- Story points follow Fibonacci estimation
- Prioritize by business value and dependencies

Respond in valid JSON as an array of story objects."""
        )

        user_content = f"## Approved Features\n\n{features_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
agile_prompts = AgilePromptBuilder()
