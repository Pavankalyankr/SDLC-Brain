"""
SDLC Brain — Code Review Prompt Templates

Structured prompts for AI-powered code review analysis.
"""

from app.ai.prompts.base import BasePromptBuilder


class CodeReviewPromptBuilder(BasePromptBuilder):
    """Builds prompts for code review generation."""

    def code_review_prompt(
        self, code_files_text: str, stories_text: str, instructions: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for generated code → Review findings."""
        system = self.build_system_prompt(
            role="an expert Senior Software Engineer and Code Reviewer with 15+ years experience",
            instructions="""Perform a thorough, professional code review of the provided source files.

For EACH file reviewed, provide a review object with:
- **file_path**: The file being reviewed
- **severity**: Overall severity: "critical", "warning", "info", or "pass"
- **score**: Quality score 0-100 (higher is better)
- **review_comments**: JSON-stringified array of finding objects, each with:
  - line: line number (approximate if not exact)
  - type: "bug" | "security" | "performance" | "style" | "maintainability"
  - message: Clear explanation of the issue
  - suggestion: Specific fix recommendation
- **suggestions**: JSON-stringified array of top-level improvement suggestions (strings)
- **original_code**: The reviewed file content (copy from input)

Review categories to check:
1. **Bugs & Logic Errors** — Off-by-one, null references, incorrect conditionals
2. **Security Vulnerabilities** — SQL injection, XSS, hardcoded secrets, path traversal, IDOR
3. **Performance Issues** — N+1 queries, unnecessary loops, missing indexes, blocking I/O
4. **Code Quality** — DRY violations, god objects, dead code, poor naming
5. **Error Handling** — Missing try/catch, swallowed exceptions, no logging
6. **Test Coverage** — Untested branches, missing edge cases
7. **Documentation** — Missing docstrings, unclear variable names

Be specific and actionable. Include line numbers where possible.
Respond in valid JSON as an array of review objects (one per file)."""
        )

        user_content = f"## Source Files to Review\n\n{code_files_text}"
        if stories_text:
            user_content += f"\n\n## User Stories (for context)\n\n{stories_text}"
        if instructions:
            user_content += f"\n\n## Review Focus\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
code_review_prompts = CodeReviewPromptBuilder()
