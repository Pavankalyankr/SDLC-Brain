"""
SDLC Brain — Agile Agent

LangGraph-style agent for the Agile Assist module.
Handles the Generate → Parse → Save → Notify pipeline.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.agile import agile_prompts
from app.core.events import event_manager
from app.modules.agile.models import Epic, Feature, Requirement, Story
from app.modules.agile.repository import agile_repository

logger = logging.getLogger(__name__)


class AgileAgent:
    """
    Agile generation agent.

    Each method follows the pipeline:
    1. Build prompt from approved parent artifacts
    2. Call orchestrator (streams via SSE)
    3. Parse JSON response
    4. Save artifacts to DB
    5. Notify completion
    """

    # --- Requirements ---
    async def generate_requirements(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        sow_text: str,
        instructions: str = "",
    ) -> list[Requirement]:
        """Generate requirements from SOW text."""
        await event_manager.publish_thinking(task_id, "Analyzing Statement of Work...")

        system_prompt, messages = agile_prompts.requirements_prompt(sow_text, instructions)

        result = await orchestrator.generate(
            task_type="agile",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        requirements = []

        for item in items:
            req = Requirement(
                project_id=project_id,
                title=item.get("title", "Untitled Requirement"),
                description=item.get("description", ""),
                priority=item.get("priority", "medium"),
                category=item.get("category", "functional"),
                confidence=self._estimate_confidence(item),
            )
            created = await agile_repository.create_requirement(db, req)
            requirements.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "requirements",
            "count": len(requirements),
        })

        logger.info(f"Generated {len(requirements)} requirements for project {project_id}")
        return requirements

    # --- Epics ---
    async def generate_epics(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> list[Epic]:
        """Generate epics from approved requirements."""
        await event_manager.publish_thinking(task_id, "Generating epics from requirements...")

        # Get approved requirements
        reqs = await agile_repository.get_requirements(db, project_id)
        approved = [r for r in reqs if r.status == "approved"]

        if not approved:
            await event_manager.publish_error(task_id, "No approved requirements found. Approve requirements first.")
            return []

        reqs_text = "\n".join(
            f"[{r.id}] **{r.title}** ({r.priority}): {r.description}"
            for r in approved
        )

        system_prompt, messages = agile_prompts.epics_prompt(reqs_text, instructions)

        result = await orchestrator.generate(
            task_type="agile",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        epics = []

        for item in items:
            epic = Epic(
                project_id=project_id,
                title=item.get("title", "Untitled Epic"),
                description=item.get("description", ""),
                confidence=self._estimate_confidence(item),
            )
            created = await agile_repository.create_epic(db, epic)
            epics.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "epics",
            "count": len(epics),
        })

        logger.info(f"Generated {len(epics)} epics for project {project_id}")
        return epics

    # --- Features ---
    async def generate_features(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> list[Feature]:
        """Generate features from approved epics."""
        await event_manager.publish_thinking(task_id, "Generating features from epics...")

        epics = await agile_repository.get_epics(db, project_id)
        approved = [e for e in epics if e.status == "approved"]

        if not approved:
            await event_manager.publish_error(task_id, "No approved epics found. Approve epics first.")
            return []

        epics_text = "\n".join(
            f"[{e.id}] **{e.title}**: {e.description}"
            for e in approved
        )

        system_prompt, messages = agile_prompts.features_prompt(epics_text, instructions)

        result = await orchestrator.generate(
            task_type="agile",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        features = []

        for item in items:
            feature = Feature(
                project_id=project_id,
                title=item.get("title", "Untitled Feature"),
                description=item.get("description", ""),
                confidence=self._estimate_confidence(item),
            )
            created = await agile_repository.create_feature(db, feature)
            features.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "features",
            "count": len(features),
        })

        logger.info(f"Generated {len(features)} features for project {project_id}")
        return features

    # --- Stories ---
    async def generate_stories(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> list[Story]:
        """Generate stories from approved features."""
        await event_manager.publish_thinking(task_id, "Generating user stories from features...")

        features = await agile_repository.get_features(db, project_id)
        approved = [f for f in features if f.status == "approved"]

        if not approved:
            await event_manager.publish_error(task_id, "No approved features found. Approve features first.")
            return []

        features_text = "\n".join(
            f"[{f.id}] **{f.title}**: {f.description}"
            for f in approved
        )

        system_prompt, messages = agile_prompts.stories_prompt(features_text, instructions)

        result = await orchestrator.generate(
            task_type="agile",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        items = self._parse_json_array(result)
        stories = []

        for item in items:
            story = Story(
                project_id=project_id,
                title=item.get("title", "Untitled Story"),
                description=item.get("description", ""),
                acceptance_criteria=item.get("acceptance_criteria", ""),
                story_points=item.get("story_points"),
                priority=item.get("priority", "medium"),
                sprint=item.get("sprint"),
                confidence=self._estimate_confidence(item),
            )
            created = await agile_repository.create_story(db, story)
            stories.append(created)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "stories",
            "count": len(stories),
        })

        logger.info(f"Generated {len(stories)} stories for project {project_id}")
        return stories

    # --- Helpers ---
    def _parse_json_array(self, content: str) -> list[dict]:
        """Parse JSON array from AI response, handling markdown code blocks."""
        content = content.strip()
        # Strip markdown code fences
        if content.startswith("```"):
            lines = content.split("\n")
            # Remove first and last lines (``` markers)
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and any(isinstance(v, list) for v in parsed.values()):
                # Sometimes LLMs wrap arrays in {"requirements": [...]}
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
            return [parsed] if isinstance(parsed, dict) else []
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse AI response as JSON: {content[:200]}")
            return []

    def _estimate_confidence(self, item: dict) -> float:
        """Estimate AI confidence based on response quality signals."""
        score = 0.5
        if item.get("title") and len(item["title"]) > 5:
            score += 0.1
        if item.get("description") and len(item["description"]) > 20:
            score += 0.15
        if item.get("priority"):
            score += 0.05
        if item.get("category"):
            score += 0.05
        if item.get("acceptance_criteria"):
            score += 0.1
        if item.get("story_points"):
            score += 0.05
        return min(score, 1.0)


# Singleton
agile_agent = AgileAgent()
