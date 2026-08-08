"""
SDLC Brain — Production Agent

Full RCA pipeline:
  Incident Ingestion → Classification → AI Investigation → RCA → Impact → Runbook → Proposed Fix → Patch
"""

import json
import logging
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.production import production_prompts
from app.core.events import event_manager
from app.modules.architecture.repository import architecture_repository
from app.modules.production.models import Incident, IncidentAnalysis
from app.modules.production.repository import production_repository

logger = logging.getLogger(__name__)


class ProductionAgent:
    """Incident analysis agent — codebase & architecture-aware RCA."""

    async def analyze_incident(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        title: str = "",
        raw_logs: str = "",
        severity: str = "medium",
        service: str = "",
        description: str = "",
    ) -> Incident | None:
        """Full RCA pipeline: Ingest → Classify → Investigate → RCA → Runbook → Patch."""

        # ── Step 1: Create incident record ──
        await event_manager.publish_thinking(task_id, "Step 1/4: Ingesting incident and creating record...")

        incident = Incident(
            project_id=project_id,
            title=title or "Production Incident",
            description=description or "",
            severity=severity,
            service=service,
            raw_logs=raw_logs,
            status="investigating",
        )
        created = await production_repository.create_incident(db, incident)

        # ── Step 2: Gather context (Architecture + Codebase) ──
        await event_manager.publish_thinking(task_id, "Step 2/4: Gathering architecture and scanning codebase...")

        designs = await architecture_repository.get_designs(db, project_id)
        arch_text = "\n\n".join(
            f"**{d.title}** ({d.architecture_type}):\n{d.description}"
            for d in designs
        ) if designs else "No architecture defined"

        # Read actual codebase
        from app.modules.development.workspace import workspace_manager

        codebase_text = ""
        try:
            workspace_files = await workspace_manager.list_files(project_id)
            source_files = [
                f for f in workspace_files
                if not f.get("is_dir")
                and not f["path"].endswith((".pyc", ".class", ".o", ".exe", ".dll"))
            ]

            await event_manager.publish_thinking(
                task_id, f"Step 2/4: Found {len(source_files)} files. Reading relevant code..."
            )

            snippets = []
            total_chars = 0
            max_chars = 30000

            for wf in source_files:
                if total_chars >= max_chars:
                    break
                fp = wf["path"]
                try:
                    content = await workspace_manager.read_file(project_id, fp)
                    snippet = content[:2000]
                    snippets.append(f"### {fp}\n```\n{snippet}\n```")
                    total_chars += len(snippet)
                except Exception:
                    pass

            if snippets:
                file_tree = "\n".join(f"- {f['path']}" for f in source_files[:100])
                codebase_text = f"## File Tree\n{file_tree}\n\n## File Contents\n\n" + "\n\n".join(snippets)
        except Exception as e:
            logger.warning(f"Could not read workspace for project {project_id}: {e}")

        # ── Step 3: AI Investigation ──
        await event_manager.publish_thinking(task_id, "Step 3/4: Running AI Root Cause Analysis — tracing through architecture and code...")

        system_prompt, messages = production_prompts.rca_prompt(
            incident_title=title,
            raw_logs=raw_logs or description,
            architecture_text=arch_text,
            codebase_text=codebase_text,
            severity=severity,
            service=service,
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
            return created

        # ── Step 4: Save analysis ──
        await event_manager.publish_thinking(task_id, "Step 4/4: Saving analysis — RCA, runbook, and proposed fix ready for review...")

        # Update incident
        created.title = parsed.get("title", created.title)
        created.severity = parsed.get("severity_assessment", severity)
        created.root_cause = parsed.get("root_cause", "")
        created.ai_analysis = parsed.get("root_cause", "")
        created.status = "rca_complete"
        created.confidence = parsed.get("confidence", 0.85)

        # Create IncidentAnalysis
        affected = parsed.get("affected_files", [])
        if isinstance(affected, list):
            affected_json = json.dumps(affected)
        else:
            affected_json = "[]"

        analysis = IncidentAnalysis(
            incident_id=created.id,
            classification=parsed.get("classification", "unknown"),
            root_cause=parsed.get("root_cause", ""),
            impact=parsed.get("impact", ""),
            affected_files=affected_json,
            mitigation_runbook=parsed.get("mitigation_runbook", ""),
            proposed_fix=parsed.get("proposed_fix", ""),
            code_patch=parsed.get("code_patch", ""),
            confidence=parsed.get("confidence", 0.85),
            status="pending_review",
        )
        await production_repository.create_analysis(db, analysis)

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "incident_analysis",
            "id": created.id,
            "severity": created.severity,
            "classification": analysis.classification,
        })

        logger.info(f"Generated RCA for incident {created.id} in project {project_id}")
        return created

    async def apply_fix(
        self,
        task_id: str,
        db: AsyncSession,
        analysis: IncidentAnalysis,
        project_id: str,
    ) -> dict:
        """Apply the approved code fix to workspace files."""
        import re as _re
        from app.ai.prompts.base import BasePromptBuilder
        from app.modules.development.workspace import workspace_manager

        affected_files: list[str] = []
        try:
            affected_files = json.loads(analysis.affected_files)
        except (json.JSONDecodeError, TypeError):
            pass

        if not affected_files:
            await event_manager.publish_error(task_id, "No affected files to fix.")
            return {"fixed": 0}

        await event_manager.publish_thinking(task_id, f"Applying fix to {len(affected_files)} file(s)...")

        fixed_count = 0
        prompt_builder = BasePromptBuilder()

        for file_path in affected_files:
            try:
                current_code = await workspace_manager.read_file(project_id, file_path)
            except Exception:
                logger.warning(f"Cannot read file {file_path} for auto-fix, skipping")
                continue

            await event_manager.publish_thinking(task_id, f"Fixing {file_path}...")

            system = prompt_builder.build_system_prompt(
                role="an expert software engineer applying a production incident hotfix",
                instructions=f"""You are given a source code file and a Root Cause Analysis with a proposed fix.
Apply the fix to the code and return ONLY the complete corrected file content.

## Root Cause
{analysis.root_cause}

## Proposed Fix
{analysis.proposed_fix}

## Code Patch Reference
{analysis.code_patch}

RULES:
- Return ONLY the corrected file content, no markdown fences, no explanation.
- Keep all existing functionality intact — only fix the identified issue.
- Do not remove comments or unrelated code."""
            )

            messages = [{"role": "user", "content": f"## File: {file_path}\n\n```\n{current_code}\n```"}]

            fixed_code = await orchestrator.generate(
                task_type="production",
                messages=messages,
                project_id=project_id,
                task_id=task_id,
                system_prompt=system,
            )

            # Strip markdown fences
            fixed_code = fixed_code.strip()
            if fixed_code.startswith("```"):
                fixed_code = _re.sub(r"^```(?:\w+)?\n?", "", fixed_code)
                fixed_code = _re.sub(r"\n?```$", "", fixed_code)

            await workspace_manager.write_file(project_id, file_path, fixed_code)
            fixed_count += 1
            logger.info(f"Auto-fixed {file_path} for incident analysis {analysis.id}")

        # Update analysis status
        analysis.status = "applied"
        await db.flush()

        # Update incident status
        incident = await production_repository.get_incident(db, analysis.incident_id)
        if incident:
            incident.status = "resolved"
            incident.resolution = f"Auto-fix applied to {fixed_count} file(s)"

        await db.commit()

        await event_manager.publish_complete(task_id, {
            "type": "auto_fix",
            "fixed_files": fixed_count,
        })

        return {"fixed": fixed_count}

    def _parse_json(self, content: str) -> dict | None:
        content = content.strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            content = match.group(0)
        try:
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse Production AI response: {content[:300]}")
            return None


# Singleton
production_agent = ProductionAgent()
