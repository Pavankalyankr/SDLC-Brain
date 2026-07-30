"""
SDLC Brain — Development Prompts
"""

from app.ai.prompts.base import BasePromptBuilder


class DevelopmentPromptBuilder(BasePromptBuilder):

    def code_generation_prompt(
        self, story_text: str, architecture_text: str, api_text: str, db_text: str, instructions: str = ""
    ) -> tuple[str, list[dict]]:
        system = self.build_system_prompt(
            role="an expert Senior Software Engineer",
            instructions="""Generate production-quality code files based on the provided user story, architecture, API contracts, and database schema.

For each file, provide:
- **file_path**: Full file path (e.g., src/services/user_service.py)
- **language**: Programming language
- **content**: Complete, working source code
- **description**: What this file does
- **component**: Which architectural component this belongs to

Guidelines:
- Write clean, well-documented, production-ready code
- Follow language-specific best practices and conventions
- Include proper error handling and validation
- Include type hints/annotations where applicable
- Include docstrings and comments for complex logic
- Follow SOLID principles
- Include necessary imports
- Use dependency injection where appropriate

Respond in valid JSON as an array of file objects."""
        )

        user_content = f"## User Story\n{story_text}\n\n## Architecture\n{architecture_text}\n\n## API Contracts\n{api_text}\n\n## Database Schema\n{db_text}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


development_prompts = DevelopmentPromptBuilder()
