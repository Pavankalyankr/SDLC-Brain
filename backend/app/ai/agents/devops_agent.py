"""
SDLC Brain — DevOps Agent

AI agent for generating CI/CD pipelines and infrastructure configs.
Uses Qwen3-Coder via the orchestrator.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.devops import devops_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.repository import architecture_repository
from app.modules.devops.models import InfraConfig, PipelineConfig
from app.modules.devops.repository import devops_repository

logger = logging.getLogger(__name__)


class DevOpsAgent:
    """DevOps artifact generation agent powered by Qwen3-Coder."""

    async def generate_devops(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> dict:
        """Generate CI/CD pipelines and infra configs from architecture."""
        await event_manager.publish_thinking(task_id, "Analyzing architecture for DevOps generation...")

        # Gather architecture context
        designs = await architecture_repository.get_designs(db, project_id)
        stories = await agile_repository.get_approved_stories(db, project_id)

        arch_text = "\n\n".join(
            f"**{d.title}** ({d.architecture_type}):\n{d.description}"
            for d in designs
        ) if designs else "No architecture defined yet"

        # Extract tech stack from design
        tech_stack = ""
        for d in designs:
            try:
                stack = json.loads(d.tech_stack) if d.tech_stack else {}
                tech_stack = json.dumps(stack, indent=2)
                break
            except (json.JSONDecodeError, TypeError):
                pass

        stories_text = "\n".join(
            f"- {s.title}: {s.description}" for s in stories[:5]
        ) if stories else ""

        await event_manager.publish_thinking(task_id, "Generating CI/CD pipelines and Dockerfiles...")

        system_prompt, messages = devops_prompts.devops_prompt(
            arch_text, stories_text, tech_stack, instructions
        )

        result = await orchestrator.generate(
            task_type="devops",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        pipelines = []
        infra_configs = []

        for item in items:
            artifact_type = item.get("type", "")

            if artifact_type == "pipeline":
                pipeline = PipelineConfig(
                    project_id=project_id,
                    name=item.get("name", "CI/CD Pipeline"),
                    platform=item.get("platform", "github_actions"),
                    config_content=item.get("config_content", ""),
                    description=item.get("description", ""),
                    status="generated",
                    confidence=0.90,
                )
                created = await devops_repository.create_pipeline(db, pipeline)
                pipelines.append(created)
            elif artifact_type == "infra":
                infra = InfraConfig(
                    project_id=project_id,
                    name=item.get("name", "Infrastructure Config"),
                    config_type=item.get("config_type", "dockerfile"),
                    config_content=item.get("config_content", ""),
                    description=item.get("description", ""),
                    status="generated",
                    confidence=0.92,
                )
                created = await devops_repository.create_infra(db, infra)
                infra_configs.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "devops",
            "pipelines": len(pipelines),
            "infra": len(infra_configs),
        })
        logger.info(
            f"Generated {len(pipelines)} pipelines + {len(infra_configs)} infra configs for project {project_id}"
        )
        return {"pipelines": len(pipelines), "infra": len(infra_configs)}

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
            logger.warning(f"Failed to parse DevOps AI response: {content[:300]}")
            return []


# Singleton
devops_agent = DevOpsAgent()
