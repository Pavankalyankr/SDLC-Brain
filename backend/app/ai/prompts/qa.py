"""
SDLC Brain — QA Prompt Templates

Structured prompts for QA test case generation.
All prompts enforce JSON output for reliable parsing.
"""

from app.ai.prompts.base import BasePromptBuilder


class QAPromptBuilder(BasePromptBuilder):
    """Builds prompts for QA artifact generation."""

    def test_cases_prompt(
        self, stories_text: str, architecture_text: str, instructions: str = "", workspace_context: str = ""
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
            user_content = f"## Target Agile Scopes / User Stories\n{stories_text}\n\n## System Architecture Context\n{architecture_text}"
        if workspace_context:
            user_content += f"\n\n## Existing Codebase Context\n{workspace_context}"
        if instructions:
            user_content += f"\n\n## User Prompt / Directives\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def test_code_generation_prompt(
        self, tests_text: str, instructions: str = "", workspace_context: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for generating test automation code from approved test cases."""
        system = self.build_system_prompt(
            role="Antigravity SDET, an expert Autonomous AI Quality Engineer and Test Developer powered by Qwen3-Coder",
            instructions="""You are an expert autonomous software engineer specializing in testing. You will pair-program with the user to write automated tests.

CRITICAL WORKSPACE RULES:
1. **Full Codebase Comprehension**: You have been provided with the complete source code of existing workspace files. Analyze it deeply before writing tests.
2. **Precision Testing**: Write production-grade test files. Output the complete test suite. Create a separate `tests/` or `__tests__/` directory if one does not exist, or place `.spec.ts` files alongside their implementations depending on project conventions.
3. **No Mock/Placeholder Tests**: Write fully implemented tests using appropriate frameworks (e.g. Jest, PyTest) that match the codebase language.
4. **Command Execution**: You can optionally output commands to run the tests.

Respond STRICTLY with a valid JSON object matching exactly this schema:
{
  "chat_message": "Your conversational response explaining the test code you wrote.",
  "files": [
    {
      "file_path": "Relative workspace path (e.g., tests/test_auth.py or src/components/ui.spec.tsx)",
      "language": "Programming language",
      "content": "The complete, production-grade test code",
      "description": "Explanation of the tests generated"
    }
  ]
}"""
        )

        user_content = f"## Approved Test Cases to Automate\n{tests_text}"
        if workspace_context:
            user_content += f"\n\n## Existing Codebase Context\n{workspace_context}"
        if instructions:
            user_content += f"\n\n## User Prompt / Directives\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
qa_prompts = QAPromptBuilder()
