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
        target_stage: str | None = None,
        target_id: str | None = None,
        instructions: str = "",
    ) -> list[CodeReview]:
        """Generate code review findings for workspace files."""
        from app.modules.development.workspace import workspace_manager
        
        await event_manager.publish_thinking(task_id, "Fetching files from workspace for review...")

        # Get the code files to review from workspace
        workspace_files = []
        try:
            files_list = await workspace_manager.list_files(project_id)
            for f in files_list:
                if not f.get("is_dir") and not any(f["path"].endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".ico", ".webp", ".pdf", ".zip", ".pyc", ".exe"]):
                    workspace_files.append(f["path"])
        except Exception as e:
            logger.error(f"Failed to list workspace files: {e}")

        if not workspace_files:
            await event_manager.publish_error(
                task_id,
                "No source code files found in workspace."
            )
            return []

        # Build code content text (limit to 5 files to avoid context overflow)
        code_text_parts = []
        for fp in workspace_files[:5]:
            try:
                content = await workspace_manager.read_file(project_id, fp)
                ext = fp.split(".")[-1] if "." in fp else "text"
                code_text_parts.append(
                    f"### File: {fp} ({ext})\n```{ext}\n{content}\n```"
                )
            except Exception:
                continue
        
        code_files_text = "\n\n".join(code_text_parts)

        # Get story context
        stories = await agile_repository.get_approved_stories(db, project_id)
        if target_stage == "stories" and target_id:
            stories = [s for s in stories if s.id == target_id]
            
        stories_text = "\n".join(f"- {s.title}: {s.description}" for s in stories[:5])

        target_name = "Entire Project Workspace"
        if target_stage != "all":
            target_name = f"{target_stage}: {target_id}"

        await event_manager.publish_thinking(task_id, f"Analyzing code quality with Qwen3-Coder for target ({target_name})...")

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
            import re
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
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
            logger.warning(f"Failed to parse code review AI response (might be truncated). Attempting salvage...")
            
        # Fallback for truncated JSON arrays
        objects = []
        depth = 0
        in_string = False
        escape = False
        obj_start = -1
        
        for i, char in enumerate(content):
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == '"':
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    if depth == 0:
                        obj_start = i
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0 and obj_start != -1:
                        obj_str = content[obj_start:i+1]
                        try:
                            parsed_obj = json.loads(obj_str)
                            objects.append(parsed_obj)
                        except Exception:
                            pass
                            
        if objects:
            return objects
            
        # If still nothing, try to regex extract file_path and review_comments
        import re
        try:
            match_file = re.search(r'"file_path"\s*:\s*"([^"]+)"', content)
            if match_file:
                return [{
                    "file_path": match_file.group(1),
                    "review_comments": "[{\"line\":0,\"type\":\"error\",\"message\":\"Review generation was truncated.\"}]",
                    "score": 50,
                    "severity": "error"
                }]
        except Exception:
            pass
            
        logger.error(f"Failed to salvage code review AI response: {content[:300]}")
        return []


# Singleton
code_review_agent = CodeReviewAgent()
