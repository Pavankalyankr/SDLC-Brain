"""
SDLC Brain — Development Agent

AI agent for generating production-quality code files.
Uses Qwen3-Coder via the orchestrator.
Gate: requires approved stories + architecture.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.development import development_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.repository import architecture_repository
from app.modules.development.models import CodeFile
from app.modules.development.repository import development_repository

logger = logging.getLogger(__name__)


class DevelopmentAgent:
    """Code generation agent powered by Qwen3-Coder."""

    async def generate_code_files(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> list[CodeFile]:
        """Generate code files from approved stories + architecture."""
        await event_manager.publish_thinking(task_id, "Analyzing approved stories and architecture...")

        # Gather context
        stories = await agile_repository.get_approved_stories(db, project_id)
        if not stories:
            await event_manager.publish_error(
                task_id, "No approved stories found. Complete and approve the Agile flow first."
            )
            return []

        designs = await architecture_repository.get_designs(db, project_id)
        api_contracts = await architecture_repository.get_api_contracts(db, project_id)
        db_schemas = await architecture_repository.get_db_schemas(db, project_id)

        stories_text = "\n".join(
            f"**{s.title}** ({s.priority}):\n{s.description}\nCriteria: {s.acceptance_criteria}"
            for s in stories
        )
        arch_text = "\n".join(f"**{d.title}**: {d.description}" for d in designs) if designs else "Not yet defined"
        api_text = "\n".join(
            f"{c.method} {c.path}: {c.summary}" for c in api_contracts
        ) if api_contracts else "Not yet defined"
        db_text = "\n".join(
            f"Table `{s.table_name}`: {s.description}" for s in db_schemas
        ) if db_schemas else "Not yet defined"

        await event_manager.publish_thinking(task_id, "Generating code with Qwen3-Coder...")

        system_prompt, messages = development_prompts.code_generation_prompt(
            stories_text, arch_text, api_text, db_text, instructions
        )

        result = await orchestrator.generate(
            task_type="development",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        code_files = []

        await event_manager.publish_thinking(task_id, f"Saving {len(items)} generated files...")

        for item in items:
            code_file = CodeFile(
                project_id=project_id,
                file_path=item.get("file_path", "src/unknown.py"),
                language=item.get("language", "python"),
                content=item.get("content", ""),
                description=item.get("description", ""),
                status="draft",
                confidence=0.88,
            )
            created = await development_repository.create_code_file(db, code_file)
            code_files.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "code_files",
            "count": len(code_files),
        })
        logger.info(f"Generated {len(code_files)} code files for project {project_id}")
        return code_files

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
            return [parsed] if isinstance(parsed, dict) else []
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse AI response as JSON: {content[:300]}")
            return []


# Singleton
development_agent = DevelopmentAgent()
