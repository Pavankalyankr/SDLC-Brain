"""
SDLC Brain — Architecture Agent

AI agent for generating system designs, API contracts, and DB schemas.
Gate: requires approved stories from Agile module.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.architecture import architecture_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.models import APIContract, DBSchema, SystemDesign
from app.modules.architecture.repository import architecture_repository

logger = logging.getLogger(__name__)


class ArchitectureAgent:
    """Architecture generation agent."""

    async def _get_source_context(
        self, db: AsyncSession, project_id: str, source_type: str | None, source_id: str | None
    ) -> tuple[str, bool]:
        """Fetch targeted agile item text if source is selected, otherwise fallback to stories."""
        if source_type and source_id:
            if source_type == "requirements":
                item = await agile_repository.get_requirement(db, source_id)
                if item:
                    return f"Selected Requirement [{item.id}] **{item.title}** ({item.priority}): {item.description}", True
            elif source_type == "epics":
                item = await agile_repository.get_epic(db, source_id)
                if item:
                    return f"Selected Epic [{item.id}] **{item.title}**: {item.description}", True
            elif source_type == "features":
                item = await agile_repository.get_feature(db, source_id)
                if item:
                    return f"Selected Feature [{item.id}] **{item.title}** ({item.priority}): {item.description}", True
            elif source_type == "stories":
                item = await agile_repository.get_story(db, source_id)
                if item:
                    return f"Selected Story [{item.id}] **{item.title}** ({item.priority}): {item.description}\nAcceptance: {item.acceptance_criteria}", True
            return "Item not found", False

        # Default fallback to approved stories
        stories = await agile_repository.get_approved_stories(db, project_id)
        if not stories:
            return "", False
        text = "\n".join(
            f"[{s.id}] **{s.title}** ({s.priority}): {s.description}\nAcceptance: {s.acceptance_criteria}"
            for s in stories
        )
        return text, True

    async def generate_system_design(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "",
        source_type: str | None = None, source_id: str | None = None
    ) -> SystemDesign | None:
        """Generate system design from approved stories or selected item."""
        await event_manager.publish_thinking(task_id, "Analyzing agile specifications for architecture design...")

        context_text, ok = await self._get_source_context(db, project_id, source_type, source_id)
        if not ok:
            await event_manager.publish_error(task_id, "No valid source item or approved stories found. Please select an agile artifact.")
            return None

        system_prompt, messages = architecture_prompts.system_design_prompt(context_text, instructions)

        result = await orchestrator.generate(
            task_type="architecture", messages=messages,
            project_id=project_id, task_id=task_id, system_prompt=system_prompt,
        )

        parsed = self._parse_json(result)
        if not parsed:
            await event_manager.publish_error(task_id, "Failed to parse architecture response")
            return None

        design = SystemDesign(
            project_id=project_id,
            source_type=source_type,
            source_id=source_id,
            title=parsed.get("title", "System Architecture"),
            description=parsed.get("description", ""),
            architecture_type=parsed.get("architecture_type", "microservices"),
            components=json.dumps(parsed.get("components", [])),
            mermaid_diagram=parsed.get("mermaid_diagram"),
            tech_stack=json.dumps(parsed.get("tech_stack", {})),
            confidence=0.85,
        )
        created = await architecture_repository.create_design(db, design)

        await db.commit()
        await event_manager.publish_complete(task_id, {"type": "system_design", "id": created.id})
        logger.info(f"Generated system design for project {project_id} (source: {source_type}/{source_id})")
        return created

    async def generate_api_contracts(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "",
        source_type: str | None = None, source_id: str | None = None
    ) -> list[APIContract]:
        """Generate API contracts from system design + source item."""
        await event_manager.publish_thinking(task_id, "Generating API contracts...")

        designs = await architecture_repository.get_designs(db, project_id)
        if source_id:
            scoped_designs = [d for d in designs if d.source_id == source_id]
            design = scoped_designs[-1] if scoped_designs else (designs[-1] if designs else None)
        else:
            approved_designs = [d for d in designs if d.status == "approved"]
            design = approved_designs[-1] if approved_designs else (designs[-1] if designs else None)

        if not design:
            await event_manager.publish_error(task_id, "No reference system design found. Generate a system design first.")
            return []

        context_text, _ = await self._get_source_context(db, project_id, source_type, source_id)

        system_prompt, messages = architecture_prompts.api_contracts_prompt(
            design.description, context_text, instructions
        )

        result = await orchestrator.generate(
            task_type="architecture", messages=messages,
            project_id=project_id, task_id=task_id, system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        contracts = []

        for item in items:
            contract = APIContract(
                project_id=project_id,
                system_design_id=design.id,
                source_type=source_type,
                source_id=source_id,
                method=item.get("method", "GET"),
                path=item.get("path", "/"),
                summary=item.get("summary", ""),
                description=item.get("description", ""),
                request_body=json.dumps(item.get("request_body")) if item.get("request_body") else None,
                response_body=json.dumps(item.get("response_body")) if item.get("response_body") else None,
                status_codes=json.dumps(item.get("status_codes", [])),
                service=item.get("service"),
                confidence=0.8,
            )
            created = await architecture_repository.create_api_contract(db, contract)
            contracts.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {"type": "api_contracts", "count": len(contracts)})
        return contracts

    async def generate_db_schemas(
        self, task_id: str, db: AsyncSession, project_id: str, instructions: str = "",
        source_type: str | None = None, source_id: str | None = None
    ) -> list[DBSchema]:
        """Generate DB schemas from system design + API contracts + source item."""
        await event_manager.publish_thinking(task_id, "Generating database schema...")

        designs = await architecture_repository.get_designs(db, project_id)
        if source_id:
            scoped_designs = [d for d in designs if d.source_id == source_id]
            design = scoped_designs[-1] if scoped_designs else (designs[-1] if designs else None)
        else:
            approved_designs = [d for d in designs if d.status == "approved"]
            design = approved_designs[-1] if approved_designs else (designs[-1] if designs else None)

        if not design:
            await event_manager.publish_error(task_id, "No reference system design found. Generate a system design first.")
            return []

        contracts = await architecture_repository.get_api_contracts(db, project_id)
        if source_id:
            scoped_contracts = [c for c in contracts if c.source_id == source_id]
            target_contracts = scoped_contracts if scoped_contracts else contracts
        else:
            target_contracts = contracts

        api_text = "\n".join(f"{c.method} {c.path}: {c.summary}" for c in target_contracts)
        context_text, _ = await self._get_source_context(db, project_id, source_type, source_id)

        system_prompt, messages = architecture_prompts.db_schema_prompt(
            design.description, api_text, instructions, context_text
        )

        result = await orchestrator.generate(
            task_type="architecture", messages=messages,
            project_id=project_id, task_id=task_id, system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        schemas = []

        for item in items:
            schema = DBSchema(
                project_id=project_id,
                system_design_id=design.id,
                source_type=source_type,
                source_id=source_id,
                table_name=item.get("table_name", "unknown"),
                description=item.get("description", ""),
                columns=json.dumps(item.get("columns", [])),
                relationships=json.dumps(item.get("relationships", [])),
                indexes=json.dumps(item.get("indexes", [])),
                mermaid_diagram=item.get("mermaid_diagram"),
                confidence=0.8,
            )
            created = await architecture_repository.create_db_schema(db, schema)
            schemas.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {"type": "db_schemas", "count": len(schemas)})
        return schemas

    def _parse_json(self, content: str) -> dict | None:
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON: {content[:200]}")
            return None

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
            return []


architecture_agent = ArchitectureAgent()
