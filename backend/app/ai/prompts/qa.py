"""
SDLC Brain — QA Prompt Templates

Structured prompts for QA test case generation.
All prompts enforce JSON output for reliable parsing.
"""

from app.ai.prompts.base import BasePromptBuilder


class QAPromptBuilder(BasePromptBuilder):
    """Builds prompts for QA artifact generation."""

    def test_cases_prompt(
        self, stories_text: str, architecture_text: str, instructions: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for Stories + Architecture → Test Cases."""
        system = self.build_system_prompt(
            role="an expert QA Engineer and Test Architect",
            instructions="""Generate comprehensive, professional test cases from the provided user stories and architecture.

For each test case, provide:
- **title**: A concise, descriptive title
- **description**: What this test verifies and why it matters
- **test_type**: One of: "unit", "integration", "e2e", "security", "performance", "regression"
- **preconditions**: Setup state required before the test runs (e.g., "User is logged in with admin role")
- **steps**: Numbered step-by-step execution instructions, newline-separated
- **expected_result**: The exact observable outcome that defines a PASS
- **priority**: "high", "medium", or "low"

Coverage MUST include:
1. **Happy path** — Primary success scenario
2. **Edge cases** — Boundary values, empty inputs, max values
3. **Negative cases** — Invalid input, unauthorized access, 4xx errors
4. **Security cases** — SQL injection, XSS, CSRF, auth bypass attempts
5. **Integration cases** — Multi-service interactions, DB consistency

Generate at least 8-12 test cases. Be specific and technically precise.

Respond in valid JSON as an array of test case objects."""
        )

        user_content = f"## User Stories\n\n{stories_text}"
        if architecture_text:
            user_content += f"\n\n## System Architecture\n\n{architecture_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
qa_prompts = QAPromptBuilder()
