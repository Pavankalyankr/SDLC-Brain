"""
SDLC Brain — Development Agent

AI agent for generating and modifying production-quality code files.
Uses Gemini Flash via the orchestrator for full-repository understanding and modification.
"""

import json
import logging

import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.orchestrator.orchestrator import orchestrator
from app.ai.prompts.development import development_prompts
from app.core.events import event_manager
from app.modules.agile.repository import agile_repository
from app.modules.architecture.repository import architecture_repository
from app.modules.development.models import CodeFile
from app.modules.development.repository import development_repository
from app.modules.development.workspace import workspace_manager

logger = logging.getLogger(__name__)


class DevelopmentAgent:
    """Code generation and refactoring agent powered by Gemini Flash."""

    async def generate_code_files(
        self,
        task_id: str,
        db: AsyncSession,
        project_id: str,
        instructions: str = "",
        chat_history: list[dict[str, str]] | None = None,
    ) -> list[CodeFile]:
        """Generate or modify code files from existing workspace code, instructions, and architecture."""
        await event_manager.publish_thinking(task_id, "Scanning complete project codebase and directory structure for full repository understanding...")
        
        workspace_summary = "Workspace is currently empty (no existing project files found)."
        file_count = 0
        try:
            workspace_files = await workspace_manager.list_files(project_id)
            file_paths = [
                f["path"] for f in workspace_files 
                if not f.get("is_dir") and not any(f["path"].endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".ico", ".webp", ".pdf", ".zip", ".pyc", ".exe"])
            ]
            if file_paths:
                codebase_snippets = []
                for fp in file_paths[:35]:  # Analyze up to 35 core source files in full detail
                    try:
                        f_content = await workspace_manager.read_file(project_id, fp)
                        lines = f_content.splitlines()
                        if len(lines) > 450:
                            f_content = "\n".join(lines[:450]) + "\n...[truncated remainder of large file]"
                        codebase_snippets.append(f"### File: `{fp}`\n```\n{f_content}\n```")
                    except Exception:
                        continue
                file_count = len(codebase_snippets)
                workspace_summary = f"Complete Existing Codebase ({len(file_paths)} total source files in workspace):\n\n" + "\n\n".join(codebase_snippets)
                await event_manager.publish_thinking(task_id, f"📖 Ingested complete codebase! Analyzed {file_count} live source files in your sandbox.")
            else:
                await event_manager.publish_thinking(task_id, "📁 Workspace currently clean/empty. Ready for new project generation.")
        except Exception:
            workspace_summary = "Workspace currently empty or unreadable."

        # Gather agile and architectural context
        stories = await agile_repository.get_approved_stories(db, project_id)
        if not stories and file_count == 0 and not instructions:
            await event_manager.publish_error(
                task_id, "No approved agile stories, instructions, or existing code found. Provide prompt instructions or open an existing codebase folder."
            )
            return []

        designs = await architecture_repository.get_designs(db, project_id)
        api_contracts = await architecture_repository.get_api_contracts(db, project_id)
        db_schemas = await architecture_repository.get_db_schemas(db, project_id)

        stories_text = "\n".join(
            f"**{s.title}** ({s.priority}):\n{s.description}\nCriteria: {s.acceptance_criteria}"
            for s in stories
        ) if stories else "No formal agile stories selected — prioritize user chat directives and existing codebase refactoring."
        arch_text = "\n".join(f"**{d.title}**: {d.description}" for d in designs) if designs else "Rely entirely on modular software engineering principles."
        api_text = "\n".join(
            f"{c.method} {c.path}: {c.summary}" for c in api_contracts
        ) if api_contracts else "Not specified"
        db_text = "\n".join(
            f"Table `{s.table_name}`: {s.description}" for s in db_schemas
        ) if db_schemas else "Not specified"

        await event_manager.publish_thinking(task_id, "🚀 Generating architectural modifications and enterprise code with Gemini Flash...")

        system_prompt, new_messages = development_prompts.code_generation_prompt(
            stories_text, arch_text, api_text, db_text, instructions, workspace_context=workspace_summary
        )

        # Inject chat history
        messages = (chat_history or []) + new_messages

        result = await orchestrator.generate(
            task_type="development",
            messages=messages,
            project_id=project_id,
            task_id=task_id,
            system_prompt=system_prompt,
            json_mode=True,
        )

        parsed_data = self._parse_json_object(result)
        logger.info(f"Raw Gemini Result: {result}")
        logger.info(f"Parsed Data: {parsed_data}")
        chat_message = parsed_data.get("chat_message", "")
        items = parsed_data.get("files", [])
        if not isinstance(items, list):
            items = []

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
            try:
                await workspace_manager.write_file(project_id, created.file_path, created.content)
                await event_manager.publish_thinking(task_id, f"📝 Saved file `{created.file_path}`")
            except Exception as e:
                logger.error(f"Failed to write generated code file to workspace: {e}")

            # Execute background terminal command if requested by the agent
            cmd = item.get("command_to_run")
            if cmd:
                await event_manager.publish_thinking(task_id, f"⚡ Executing command in terminal: `{cmd}`")
                cmd_output = await self._execute_terminal_command(project_id, cmd)
                display_output = cmd_output[:500] + ("\n...(truncated)" if len(cmd_output) > 500 else "")
                await event_manager.publish_thinking(task_id, f"💻 Terminal Output (`{cmd}`):\n```\n{display_output}\n```")

        await db.commit()
        await event_manager.publish_complete(task_id, {
            "type": "code_files",
            "count": len(code_files),
            "message": chat_message,
        })
        logger.info(f"Generated {len(code_files)} code files for project {project_id}")
        return code_files

    def _parse_json_object(self, content: str) -> dict:
        content = content.strip()
        if content.startswith("```"):
            import re
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
            
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                return parsed[0]
            return {}
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse AI response as JSON. Salvaging fully completed JSON object from truncated response...")
            
        # Bracket counting fallback for truncated JSON object
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
                            # If we parse the outermost object successfully, return it!
                            parsed_obj = json.loads(obj_str)
                            return parsed_obj
                        except Exception:
                            pass
                            
        # If fallback fails, attempt to manually extract just the message using regex as a last resort
        import re
        match = re.search(r'"chat_message"\s*:\s*"([^"]+)"', content)
        if match:
            return {"chat_message": match.group(1), "files": []}
            
        return {}

    async def _execute_terminal_command(self, project_id: str, command: str) -> str:
        workspace_dir = Path("/app/workspace") / project_id
        workspace_dir.mkdir(parents=True, exist_ok=True)
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=str(workspace_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30.0)
            output = stdout.decode('utf-8', errors='replace').strip() if stdout else ""
            return output or f"Command `{command}` finished successfully (exit code {proc.returncode})."
        except asyncio.TimeoutError:
            return f"Command `{command}` timed out after 30 seconds."
        except Exception as e:
            return f"Error executing command `{command}`: {e}"


# Singleton
development_agent = DevelopmentAgent()
