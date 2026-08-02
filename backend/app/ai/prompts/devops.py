"""
SDLC Brain — DevOps Prompt Templates

Structured prompts for CI/CD and infrastructure generation.
"""

from app.ai.prompts.base import BasePromptBuilder


class DevOpsPromptBuilder(BasePromptBuilder):
    """Builds prompts for DevOps artifact generation."""

    def devops_prompt(
        self, architecture_text: str, stories_text: str, tech_stack: str, instructions: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for architecture → CI/CD + Infra configs."""
        system = self.build_system_prompt(
            role="an expert DevOps Engineer and Platform Engineer specializing in cloud-native systems",
            instructions="""Generate production-ready DevOps configuration files based on the system architecture and tech stack.

Generate TWO types of artifacts:

### Type 1: Pipeline Configs (CI/CD)
For each pipeline, provide:
- **type**: "pipeline"
- **name**: Descriptive name (e.g., "Backend CI/CD Pipeline")
- **platform**: "github_actions", "gitlab_ci", or "jenkins"
- **config_content**: Complete, working YAML configuration
- **description**: What this pipeline does (build, test, deploy stages)

Pipelines MUST include:
- Build stage (compile/install dependencies)
- Test stage (unit + integration tests)
- Security scan (e.g., trivy for Docker images)
- Build Docker image and push to registry
- Deploy to staging (on branch push)
- Deploy to production (on tag/release with manual approval)

### Type 2: Infrastructure Configs
For each infra file, provide:
- **type**: "infra"
- **name**: Descriptive name (e.g., "Backend Dockerfile", "docker-compose.yml")
- **config_type**: "dockerfile", "docker_compose", "kubernetes", "terraform", "nginx"
- **config_content**: Complete, production-ready configuration
- **description**: Purpose and usage

Infra files MUST include at minimum:
- Multi-stage Dockerfile for the main application
- docker-compose.yml for local development
- Kubernetes deployment YAML (if applicable)

Use best practices:
- Non-root users in Docker
- Health checks
- Resource limits in K8s
- Secret management (env vars, not hardcoded)
- Proper caching in CI

Respond in valid JSON as an array of artifact objects."""
        )

        user_content = f"## System Architecture\n\n{architecture_text}"
        if stories_text:
            user_content += f"\n\n## User Stories (for deployment context)\n\n{stories_text}"
        if tech_stack:
            user_content += f"\n\n## Tech Stack\n\n{tech_stack}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
devops_prompts = DevOpsPromptBuilder()
