"""
SDLC Brain — Production Support Prompt Templates

Structured prompts for incident analysis and Root Cause Analysis.
"""

from app.ai.prompts.base import BasePromptBuilder


class ProductionPromptBuilder(BasePromptBuilder):
    """Builds prompts for production support generation."""

    def rca_prompt(
        self, incident_description: str, system_architecture: str, instructions: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for incident description → Root Cause Analysis."""
        system = self.build_system_prompt(
            role="an expert Site Reliability Engineer (SRE) and Production Support specialist with deep systems knowledge",
            instructions="""Perform a thorough Root Cause Analysis (RCA) for the described production incident.

Respond with a single JSON object containing:
- **title**: Concise incident title
- **severity**: "critical", "high", "medium", or "low"
- **executive_summary**: 2-3 sentence non-technical summary of what happened and impact
- **root_cause**: The primary technical root cause (be specific — not "server overload" but WHY the server overloaded)
- **contributing_factors**: Array of secondary factors that enabled or worsened the incident
- **timeline**: Array of timeline events, each with {"time": "HH:MM", "event": "description"}
- **impact_assessment**: What was affected (users, data, services, revenue)
- **immediate_remediation**: Steps taken (or to take) to stop the bleeding RIGHT NOW
- **resolution**: Complete fix to fully resolve the issue
- **prevention**: Array of specific action items to prevent recurrence, each with:
  - action: What to do
  - owner: Which team (e.g., "Backend", "DevOps", "Database")
  - priority: "P0", "P1", "P2"
  - timeline: e.g., "48 hours", "1 week"
- **ai_analysis**: Technical deep-dive analysis of the failure mode
- **lessons_learned**: Key learnings for the post-mortem

Use the 5 Whys methodology. Be technically precise and actionable.
Respond in valid JSON as a single object."""
        )

        user_content = f"## Incident Description\n\n{incident_description}"
        if system_architecture:
            user_content += f"\n\n## System Architecture Context\n\n{system_architecture}"
        if instructions:
            user_content += f"\n\n## Additional Context\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
production_prompts = ProductionPromptBuilder()
