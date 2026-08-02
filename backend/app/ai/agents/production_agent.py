"""
SDLC Brain — Production Support Agent

AI agent for generating Root Cause Analysis and incident reports.
Uses DeepSeek-R1 (reasoning model) via the orchestrator.
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.production import production_prompts
from app.core.events import event_manager
from app.modules.architecture.repository import architecture_repository
from app.modules.production.models import Incident
from app.modules.production.repository import production_repository

logger = logging.getLogger(__name__)


class ProductionAgent:
    """Incident analysis agent powered by DeepSeek-R1 (reasoning model)."""

    async def analyze_incident(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        incident_description: str,
        instructions: str = "",
    ) -> Incident | None:
        """Perform Root Cause Analysis on a production incident."""
        await event_manager.publish_thinking(task_id, "Gathering system architecture context...")

        # Get architecture context for better RCA
        designs = await architecture_repository.get_designs(db, project_id)
        arch_text = "\n".join(f"{d.title}: {d.description}" for d in designs) if designs else ""

        await event_manager.publish_thinking(task_id, "Running Root Cause Analysis with DeepSeek-R1...")

        system_prompt, messages = production_prompts.rca_prompt(
            incident_description, arch_text, instructions
        )

        result = await orchestrator.generate(
            task_type="production",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        parsed = self._parse_json(result)
        if not parsed:
            await event_manager.publish_error(task_id, "Failed to parse RCA response from AI.")
            return None

        # Build prevention plan as structured text
        prevention = parsed.get("prevention", [])
        prevention_text = "\n".join(
            f"[{p.get('priority', 'P1')}] {p.get('action', '')} (Owner: {p.get('owner', 'Team')}, Timeline: {p.get('timeline', 'TBD')})"
            for p in prevention if isinstance(p, dict)
        ) if prevention else ""

        # Timeline as JSON string
        timeline_events = parsed.get("timeline", [])
        timeline_json = json.dumps(timeline_events) if timeline_events else "[]"

        incident = Incident(
            project_id=project_id,
            title=parsed.get("title", "Production Incident"),
            description=parsed.get("executive_summary", incident_description),
            severity=parsed.get("severity", "high"),
            root_cause=parsed.get("root_cause", ""),
            resolution=parsed.get("resolution", "") + (
                f"\n\n**Prevention Plan:**\n{prevention_text}" if prevention_text else ""
            ),
            ai_analysis=(
                parsed.get("ai_analysis", "") + "\n\n"
                + f"**Timeline:** {timeline_json}\n\n"
                + f"**Impact:** {parsed.get('impact_assessment', '')}\n\n"
                + f"**Immediate Actions:** {parsed.get('immediate_remediation', '')}\n\n"
                + f"**Lessons Learned:** {parsed.get('lessons_learned', '')}"
            ),
            status="investigating",
            confidence=0.88,
        )

        created = await production_repository.create_incident(db, incident)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "incident_analysis",
            "id": created.id,
            "severity": created.severity,
        })
        logger.info(f"Generated RCA for incident in project {project_id}")
        return created

    def _parse_json(self, content: str) -> dict | None:
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        try:
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse Production AI response: {content[:300]}")
            return None


# Singleton
production_agent = ProductionAgent()
