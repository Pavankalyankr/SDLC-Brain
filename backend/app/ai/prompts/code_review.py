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

    def auto_fix_prompt(
        self, file_path: str, original_code: str, review_comments: str, suggestions: str, severity: str
    ) -> tuple[str, list[dict]]:
        """Build prompt for auto-fixing a file based on review findings."""
        system = self.build_system_prompt(
            role="an expert Senior Software Engineer specialized in automated code repair",
            instructions="""You are given a source file along with code review findings (bugs, style issues,
security vulnerabilities, performance problems, etc.) and improvement suggestions.

Your task is to APPLY ALL the suggested fixes directly to the code and return the
complete, corrected file content.

Rules:
1. Output ONLY the fixed source code — no markdown fences, no explanations, no commentary.
2. Preserve the original file structure, imports, and formatting conventions.
3. Fix every issue mentioned in the review comments and suggestions.
4. Do NOT remove existing comments or docstrings unrelated to the fixes.
5. Do NOT add placeholder comments like "// Fixed" — just fix the code silently.
6. If a suggestion is ambiguous or risky, apply the safest interpretation."""
        )

        user_content = (
            f"## File: {file_path}\n"
            f"**Review Severity**: {severity.upper()}\n\n"
            f"```\n{original_code}\n```\n\n"
            f"## Review Findings\n{review_comments}\n\n"
            f"## Improvement Suggestions\n{suggestions}"
        )

        return system, [{"role": "user", "content": user_content}]


# Singleton
code_review_prompts = CodeReviewPromptBuilder()
