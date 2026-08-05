"""
SDLC Brain — QA Code Agent

AI agent for autonomous generation of automated test suites from approved test cases.
Uses Qwen3-Coder via the orchestrator.
Writes generated code directly to the workspace sandbox.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.qa import qa_prompts
from app.core.events import event_manager
from app.modules.development.workspace import workspace_manager
from app.modules.qa.models import TestCase

logger = logging.getLogger(__name__)


class QACodeAgent:
    """Agent for autonomous automated test generation."""

    async def generate_test_code_files(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
        target_stage: str | None = None,
        target_id: str | None = None,
    ) -> None:
        """Generate test code files directly into the workspace."""
        await event_manager.publish_thinking(task_id, "Scanning complete project codebase for testing context...")

        workspace_files = await workspace_manager.list_files(project_id)
        workspace_summary = ""
        file_count = 0
        
        for wf in workspace_files:
            if not wf["is_dir"]:
                file_count += 1
                try:
                    content = await workspace_manager.read_file(project_id, wf["path"])
                    if len(content) < 50000:
                        workspace_summary += f"\n--- {wf['path']} ---\n{content}\n"
                except Exception:
                    pass

        await event_manager.publish_thinking(task_id, "Gathering approved test cases...")
        
        # Get approved test cases
        query = select(TestCase).where(TestCase.project_id == project_id, TestCase.status == "approved")
        result = await db.execute(query)
        test_cases = result.scalars().all()
        
        if not test_cases:
            await event_manager.publish_error(task_id, "No approved test cases found to generate code for. Please approve tests first.")
            return

        tests_text = "\n".join(
            f"**Test Case: {t.title}** ({t.test_type})\nDescription: {t.description}\nPreconditions: {t.preconditions}\nSteps:\n{t.steps}\nExpected: {t.expected_result}"
            for t in test_cases
        )

        await event_manager.publish_thinking(task_id, f"Generating code for {len(test_cases)} approved test cases...")

        system_prompt, new_messages = qa_prompts.test_code_generation_prompt(
            tests_text, instructions, workspace_context=workspace_summary
        )

        # Call orchestrator with full context
        result_json = await orchestrator.generate(
            task_type="qa",
            messages=new_messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
            json_mode=True,
        )

        # Result is published via event manager by orchestrator, but we still write to disk
        parsed_data = self._parse_json_object(result_json)
        chat_msg = parsed_data.get("chat_message", "Generated test code successfully.")
        
        files_to_write = parsed_data.get("files", [])
        
        if not files_to_write:
             await event_manager.publish_error(task_id, "AI failed to generate any test code files.")
             return

        await event_manager.publish_thinking(task_id, f"Writing {len(files_to_write)} test files to workspace...")

        written_count = 0
        for f in files_to_write:
            fpath = f.get("file_path")
            content = f.get("content")
            if fpath and content:
                # Determine language to append extension if missing, though LLM should be accurate
                await workspace_manager.write_file(project_id, fpath, content)
                written_count += 1
                
        # Mark test cases as having code generated
        for t in test_cases:
             t.code = "Generated"
        await db.commit()

        await event_manager.publish_complete(task_id, {
            "type": "code_files",
            "count": written_count,
            "message": chat_msg
        })
        logger.info(f"Generated {written_count} test files for project {project_id}")

    def _parse_json_object(self, content: str) -> dict:
        content = content.strip()
        if content.startswith("```json"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        elif content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            
        start_idx = content.find('{')
        if start_idx != -1:
             content = content[start_idx:]
             end_idx = content.rfind('}')
             if end_idx != -1:
                 content = content[:end_idx + 1]

        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
            return {}
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse QA Code AI response as JSON object: {content[:300]}")
            return {}

# Singleton
qa_code_agent = QACodeAgent()
