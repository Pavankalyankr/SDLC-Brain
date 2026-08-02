"""
SDLC Brain — Code Review Agent

AI agent for generating code review analysis.
Uses Qwen3-Coder via the orchestrator.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.code_review import code_review_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.code_review.models import CodeReview
from app.modules.development.repository import development_repository

logger = logging.getLogger(__name__)


class CodeReviewAgent:
    """Code review agent powered by Qwen3-Coder."""

    async def generate_code_review(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> list[CodeReview]:
        """Generate code review findings for generated code files."""
        await event_manager.publish_thinking(task_id, "Fetching generated code files for review...")

        # Get the code files to review
        code_files = await development_repository.get_code_files(db, project_id)

        if not code_files:
            await event_manager.publish_error(
                task_id,
                "No generated code files found. Generate code in the Development module first."
            )
            return []

        # Build code content text (limit to avoid context overflow)
        code_text_parts = []
        for cf in code_files[:5]:  # Limit to 5 files per review
            code_text_parts.append(
                f"### File: {cf.file_path} ({cf.language})\n```{cf.language}\n{cf.content}\n```"
            )
        code_files_text = "\n\n".join(code_text_parts)

        # Get story context
        stories = await agile_repository.get_approved_stories(db, project_id)
        stories_text = "\n".join(f"- {s.title}: {s.description}" for s in stories[:5])

        await event_manager.publish_thinking(task_id, "Analyzing code quality with Qwen3-Coder...")

        system_prompt, messages = code_review_prompts.code_review_prompt(
            code_files_text, stories_text, instructions
        )

        result = await orchestrator.generate(
            task_type="code_review",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        reviews = []

        await event_manager.publish_thinking(task_id, f"Saving {len(items)} review findings...")

        for item in items:
            # Find matching code file
            file_path = item.get("file_path", "unknown")

            review_comments = item.get("review_comments", "[]")
            if isinstance(review_comments, list):
                review_comments = json.dumps(review_comments)

            suggestions = item.get("suggestions", "[]")
            if isinstance(suggestions, list):
                suggestions = json.dumps(suggestions)

            review = CodeReview(
                project_id=project_id,
                file_path=file_path,
                original_code=item.get("original_code", ""),
                review_comments=review_comments,
                severity=item.get("severity", "info"),
                suggestions=suggestions,
                score=float(item.get("score", 75)),
                status="draft",
                confidence=0.87,
            )
            db.add(review)
            await db.flush()
            await db.refresh(review)
            reviews.append(review)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "code_reviews",
            "count": len(reviews),
        })
        logger.info(f"Generated {len(reviews)} code reviews for project {project_id}")
        return reviews

    def _parse_json_array(self, content: str) -> list[dict]:
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
            return []
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse code review AI response: {content[:300]}")
            return []


# Singleton
code_review_agent = CodeReviewAgent()
