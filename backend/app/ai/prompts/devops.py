"""
SDLC Brain — DevOps Prompt Templates

Focused prompts for the 3-step DevOps pipeline:
  1. Analyze project → detect stack
  2. Generate artifacts → Dockerfile, docker-compose, CI/CD YAML, .env
  3. Release assist → release notes, deploy steps, image versions
"""

from app.ai.prompts.base import BasePromptBuilder


class DevOpsPromptBuilder(BasePromptBuilder):
    """Builds prompts for the simplified DevOps pipeline."""

    def devops_prompt(
        self, architecture_text: str, stories_text: str, tech_stack: str, instructions: str = "", codebase_text: str = ""
    ) -> tuple[str, list[dict]]:
        """Build prompt for generating DevOps artifacts (Dockerfile, CI/CD, docker-compose, .env)."""
        system = self.build_system_prompt(
            role="an expert DevOps Engineer specializing in containerization and CI/CD pipelines",
            instructions="""You are given a project's architecture, tech stack, AND the actual source code files from the workspace. Follow this 3-step pipeline:

## Step 1: Analyze Project
Examine the actual codebase files provided. Detect the language, framework, dependencies, build commands, and run commands from the real project files (package.json, requirements.txt, pyproject.toml, pubspec.yaml, etc).

## Step 2: Generate DevOps Artifacts
Generate the following deployment files. Each artifact must be a JSON object in the output array.

### Required Artifacts:

1. **Dockerfile** (type: "infra", config_type: "dockerfile")
   - Multi-stage build for production
   - Based on the ACTUAL dependencies and build commands found in the codebase
   - Non-root user
   - Health check
   - Proper .dockerignore considerations
   - Optimized layer caching

2. **docker-compose.yml** (type: "infra", config_type: "docker_compose")
   - All services (app, database, cache if needed)
   - Volume mounts for development
   - Health checks
   - Environment variables from .env

3. **GitHub Actions CI/CD** (type: "pipeline", platform: "github_actions")
   - Build & test on push/PR
   - Build Docker image
   - Tag with version
   - Deploy step (placeholder)

4. **.env.example** (type: "infra", config_type: "env_template")
   - All required environment variables with descriptions
   - Sensible defaults for development
   - Clearly marked secrets

5. **.dockerignore** (type: "infra", config_type: "dockerignore")
   - Exclude node_modules, __pycache__, .git, .env, etc.

### Optional (generate if applicable):
6. **Kubernetes Deployment YAML** (type: "infra", config_type: "k8s") — only if the architecture suggests K8s

### For each artifact, provide:
- **type**: "pipeline" or "infra"
- **name**: filename (e.g. "Dockerfile", "docker-compose.yml", ".github/workflows/ci.yml")
- **platform** (pipelines only): "github_actions"
- **config_type** (infra only): "dockerfile", "docker_compose", "env_template", "dockerignore", "k8s"
- **config_content**: Complete, working file content
- **description**: One-line description of what this file does

## Step 3: Image Version Suggestions
Also include ONE special artifact with type "image_versions" containing an array of services:
```json
{
  "type": "image_versions",
  "services": [
    {
      "service_name": "backend",
      "image_name": "myapp/backend",
      "suggested_version": "v1.0.0",
      "base_image": "python:3.12-slim"
    }
  ]
}
```

Respond ONLY with a valid JSON array of artifact objects. No markdown, no explanation."""
        )

        user_content = f"## System Architecture\n\n{architecture_text}"
        if codebase_text:
            user_content += f"\n\n## Actual Codebase\n\n{codebase_text}"
        if stories_text:
            user_content += f"\n\n## Context\n\n{stories_text}"
        if tech_stack:
            user_content += f"\n\n## Tech Stack\n\n{tech_stack}"
        if instructions:
            user_content += f"\n\n## Additional Instructions\n{instructions}"

        return system, [{"role": "user", "content": user_content}]

    def release_prompt(
        self, architecture_text: str, image_versions_text: str, changes: str, version: str
    ) -> tuple[str, list[dict]]:
        """Build prompt for generating release notes and deployment instructions."""
        system = self.build_system_prompt(
            role="a Release Manager and DevOps Engineer",
            instructions="""Generate release documentation for a software release. Respond with a JSON object containing:

{
  "version": "v1.x.x",
  "release_notes": "Full markdown release notes including: summary, new features, bug fixes, breaking changes, dependencies updated. MUST ESCAPE NEWLINES LIKE \\n",
  "deploy_instructions": "Step-by-step markdown deployment instructions including: pre-deployment checks, deployment steps, post-deployment verification, rollback procedure. MUST ESCAPE NEWLINES LIKE \\n",
  "image_updates": [
    {
      "service_name": "backend",
      "previous_version": "v1.0.0",
      "new_version": "v1.1.0",
      "change_summary": "API endpoint changes, database migration required"
    }
  ]
}

Make the release notes professional and comprehensive.
Make deployment instructions clear and actionable.
If no version is specified, suggest one based on the changes (major/minor/patch).

Respond ONLY with valid JSON. Properly escape all newlines (\\n) and quotes inside the strings. No markdown wrapping."""
        )

        user_content = f"## Project Architecture\n\n{architecture_text}"
        user_content += f"\n\n## Current Image Versions\n\n{image_versions_text}"
        if changes:
            user_content += f"\n\n## Changes in This Release\n\n{changes}"
        if version:
            user_content += f"\n\n## Target Version: {version}"

        return system, [{"role": "user", "content": user_content}]


# Singleton
devops_prompts = DevOpsPromptBuilder()
