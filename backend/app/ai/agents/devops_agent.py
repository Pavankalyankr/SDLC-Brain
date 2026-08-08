"""
SDLC Brain — DevOps Agent

3-step pipeline:
  1. Analyze project (detect stack from architecture)
  2. Generate artifacts (Dockerfile, docker-compose, CI/CD, .env)
  3. Release assist (release notes, deploy steps, image versions)
"""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.devops import devops_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.repository import architecture_repository
from app.modules.devops.models import ImageVersion, InfraConfig, PipelineConfig, ReleaseNote
from app.modules.devops.repository import devops_repository

logger = logging.getLogger(__name__)


class DevOpsAgent:
    """DevOps artifact generation agent — simple 3-step pipeline."""

    async def generate_devops(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
    ) -> dict:
        """Step 1+2: Analyze project → Generate DevOps artifacts."""

        # ── Step 1: Analyze ──
        await event_manager.publish_thinking(task_id, "Step 1/3: Analyzing project — scanning codebase, detecting language, framework, dependencies...")

        designs = await architecture_repository.get_designs(db, project_id)
        stories = await agile_repository.get_approved_stories(db, project_id)

        arch_text = "\n\n".join(
            f"**{d.title}** ({d.architecture_type}):\n{d.description}"
            for d in designs
        ) if designs else "No architecture defined yet"

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

        # ── Read actual codebase from workspace (same as Dev/QA/CodeReview) ──
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
                task_id, f"Step 1/3: Found {len(source_files)} files in workspace. Reading key files..."
            )

            # Priority files for DevOps analysis
            priority_patterns = [
                "package.json", "requirements.txt", "pyproject.toml", "Pipfile",
                "pubspec.yaml", "build.gradle", "pom.xml", "go.mod", "Cargo.toml",
                "Gemfile", "composer.json", "Makefile", "Dockerfile", "docker-compose",
                ".env", ".env.example", "tsconfig.json", "next.config",
            ]

            snippets = []
            total_chars = 0
            max_chars = 30000  # keep prompt reasonable

            # Read priority files first
            for wf in source_files:
                fp = wf["path"]
                is_priority = any(p in fp.lower() for p in priority_patterns)
                if is_priority and total_chars < max_chars:
                    try:
                        content = await workspace_manager.read_file(project_id, fp)
                        snippet = content[:3000]  # cap per file
                        snippets.append(f"### {fp}\n```\n{snippet}\n```")
                        total_chars += len(snippet)
                    except Exception:
                        pass

            # Then read a sample of other source files for structure
            for wf in source_files:
                if total_chars >= max_chars:
                    break
                fp = wf["path"]
                is_priority = any(p in fp.lower() for p in priority_patterns)
                if not is_priority:
                    try:
                        content = await workspace_manager.read_file(project_id, fp)
                        snippet = content[:1500]
                        snippets.append(f"### {fp}\n```\n{snippet}\n```")
                        total_chars += len(snippet)
                    except Exception:
                        pass

            if snippets:
                codebase_text = "\n\n".join(snippets)

            # Also include the file tree
            file_tree = "\n".join(f"- {f['path']}" for f in source_files[:100])
            codebase_text = f"## Project File Tree\n{file_tree}\n\n## File Contents\n\n{codebase_text}"

        except Exception as e:
            logger.warning(f"Could not read workspace for project {project_id}: {e}")
            codebase_text = "No workspace files available"

        # ── Step 2: Generate ──
        await event_manager.publish_thinking(task_id, "Step 2/3: Generating Dockerfile, docker-compose, CI/CD pipeline, .env template...")

        system_prompt, messages = devops_prompts.devops_prompt(
            arch_text, stories_text, tech_stack, instructions, codebase_text
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
        image_versions = []

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

            elif artifact_type == "image_versions":
                # Save image version suggestions to the registry
                services = item.get("services", [])
                for svc in services:
                    img = ImageVersion(
                        project_id=project_id,
                        service_name=svc.get("service_name", "app"),
                        image_name=svc.get("image_name", "app"),
                        current_version=svc.get("suggested_version", "v1.0.0"),
                        previous_version="",
                        tag_type="semver",
                        status="new",
                        base_image=svc.get("base_image", ""),
                        change_summary="Initial version",
                    )
                    created = await devops_repository.create_image_version(db, img)
                    image_versions.append(created)

        await db.commit()

        # ── Step 3 indicator ──
        await event_manager.publish_thinking(task_id, "Step 3/3: Ready — use 'Generate Release' to create release notes and deployment instructions.")

        await event_manager.publish_complete(task_id, {
            "type": "devops",
            "pipelines": len(pipelines),
            "infra": len(infra_configs),
            "image_versions": len(image_versions),
        })

        logger.info(
            f"Generated {len(pipelines)} pipelines + {len(infra_configs)} infra + {len(image_versions)} image versions for {project_id}"
        )
        return {"pipelines": len(pipelines), "infra": len(infra_configs), "image_versions": len(image_versions)}

    async def generate_release(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        version: str = "",
        changes: str = "",
    ) -> dict:
        """Step 3: Generate release notes, deployment instructions, and image version bumps."""
        await event_manager.publish_thinking(task_id, "Generating release notes and deployment instructions...")

        designs = await architecture_repository.get_designs(db, project_id)
        arch_text = "\n\n".join(
            f"**{d.title}** ({d.architecture_type}):\n{d.description}"
            for d in designs
        ) if designs else "No architecture defined yet"

        # Get current image versions
        image_versions = await devops_repository.get_image_versions(db, project_id)
        img_text = "\n".join(
            f"- {iv.service_name}: {iv.image_name}:{iv.current_version} (base: {iv.base_image})"
            for iv in image_versions
        ) if image_versions else "No image versions tracked yet"

        system_prompt, messages = devops_prompts.release_prompt(
            arch_text, img_text, changes, version
        )

        result = await orchestrator.generate(
            task_type="devops",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
        )

        release_data = self._parse_json_object(result)

        # Save release note
        note = ReleaseNote(
            project_id=project_id,
            version=release_data.get("version", version or "v1.0.0"),
            release_notes=release_data.get("release_notes", ""),
            deploy_instructions=release_data.get("deploy_instructions", ""),
            status="generated",
        )
        await devops_repository.create_release_note(db, note)

        # Update image versions if suggested
        for update in release_data.get("image_updates", []):
            svc_name = update.get("service_name", "")
            new_ver = update.get("new_version", "")
            summary = update.get("change_summary", "")
            # Find existing image version and update it
            for iv in image_versions:
                if iv.service_name == svc_name:
                    await devops_repository.update_image_version(db, iv.id, new_ver, summary)
                    break

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "release",
            "version": note.version,
        })

        logger.info(f"Generated release {note.version} for project {project_id}")
        return {"version": note.version}

    def _parse_json_array(self, content: str) -> list[dict]:
        import re
        content = content.strip()
        # Find the first '[' and last ']'
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            content = match.group(0)
        
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
            return []
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse DevOps AI response: {e}. Content: {content[:300]}")
            return []

    def _parse_json_object(self, content: str) -> dict:
        import re
        content = content.strip()
        # Find the first '{' and last '}'
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            content = match.group(0)
            
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
            return {}
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse release AI response: {e}. Content: {content[:300]}")
            return {}

# Singleton
devops_agent = DevOpsAgent()
