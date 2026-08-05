"""
SDLC Brain — QA Agent

AI agent for generating comprehensive test cases.
Uses Qwen3-Coder via the orchestrator.
Gate: requires approved stories.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.qa import qa_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.repository import architecture_repository
from app.modules.qa.models import TestCase
from app.modules.qa.repository import qa_repository

logger = logging.getLogger(__name__)


class QAAgent:
    """Test case generation agent powered by Qwen3-Coder."""

    async def generate_test_cases(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
        target_stage: str | None = None,
        target_id: str | None = None,
    ) -> list[TestCase]:
        """Generate test cases from approved stories."""
        await event_manager.publish_thinking(task_id, "Gathering approved stories for test generation...")

        stories = await agile_repository.get_approved_stories(db, project_id)
        if target_stage == "stories" and target_id:
            stories = [s for s in stories if s.id == target_id]

        if not stories:
            await event_manager.publish_error(
                task_id, "No approved stories found for the target scope."
            )
            return []

        stories_text = "\n".join(
            f"**Story: {s.title}** (Priority: {s.priority}, Points: {s.story_points})\n"
            f"Description: {s.description}\n"
            f"Acceptance Criteria: {s.acceptance_criteria}"
            for s in stories
        )

        # Get architecture context for integration tests
        designs = await architecture_repository.get_designs(db, project_id)
        arch_text = "\n".join(f"{d.title}: {d.description}" for d in designs) if designs else ""

        await event_manager.publish_thinking(task_id, "Scanning complete project codebase for QA test generation...")
        
        from app.modules.development.workspace import workspace_manager
        workspace_files = await workspace_manager.list_files(project_id)
        workspace_summary = ""
        
        for wf in workspace_files:
            if not wf["is_dir"]:
                try:
                    content = await workspace_manager.read_file(project_id, wf["path"])
                    if len(content) < 50000:
                        workspace_summary += f"\n--- {wf['path']} ---\n{content}\n"
                except Exception:
                    pass

        await event_manager.publish_thinking(task_id, "Generating test cases with Qwen3-Coder...")

        system_prompt, messages = qa_prompts.test_cases_prompt(stories_text, arch_text, instructions, workspace_context=workspace_summary)

        result = await orchestrator.generate(
            task_type="qa",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        test_cases = []

        await event_manager.publish_thinking(task_id, f"Saving {len(items)} test cases...")

        for item in items:
            test_case = TestCase(
                project_id=project_id,
                title=item.get("title", "Untitled Test"),
                description=item.get("description", ""),
                test_type=item.get("test_type", "unit"),
                preconditions=item.get("preconditions"),
                steps=item.get("steps", ""),
                expected_result=item.get("expected_result", ""),
                status="draft",
                confidence=self._estimate_confidence(item),
            )
            created = await qa_repository.create_test_case(db, test_case)
            test_cases.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "test_cases",
            "count": len(test_cases),
        })
        logger.info(f"Generated {len(test_cases)} test cases for project {project_id}")
        return test_cases

    def _estimate_confidence(self, item: dict) -> float:
        score = 0.6
        if item.get("steps") and len(item["steps"]) > 20:
            score += 0.15
        if item.get("expected_result") and len(item["expected_result"]) > 10:
            score += 0.1
        if item.get("preconditions"):
            score += 0.05
        if item.get("test_type") in ["security", "performance", "e2e"]:
            score += 0.05
        return min(score, 1.0)

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
            logger.warning(f"Failed to parse QA AI response as JSON: {content[:300]}")
            return []


# Singleton
qa_agent = QAAgent()
