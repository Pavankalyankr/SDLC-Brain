"""
SDLC Brain — Prompt Version Registry

Stores and retrieves versioned prompt templates.
Enables reproducibility: every generation records which prompt version produced it.
"""

from datetime import UTC, datetime


class PromptRegistry:
    """
    Tracks prompt template versions.
    MVP: In-memory registry. Post-MVP: Database-backed.
    """

    def __init__(self) -> None:
        self._versions: dict[str, list[dict]] = {}

    def register(self, module: str, template_name: str, content: str) -> int:
        """Register a prompt version. Returns the version number."""
        key = f"{module}:{template_name}"
        if key not in self._versions:
            self._versions[key] = []

        version = len(self._versions[key]) + 1
        self._versions[key].append({
            "version": version,
            "content": content,
            "created_at": datetime.now(UTC).isoformat(),
        })
        return version

    def get_latest(self, module: str, template_name: str) -> dict | None:
        """Get the latest version of a prompt template."""
        key = f"{module}:{template_name}"
        versions = self._versions.get(key, [])
        return versions[-1] if versions else None

    def get_version(self, module: str, template_name: str, version: int) -> dict | None:
        """Get a specific version of a prompt template."""
        key = f"{module}:{template_name}"
        versions = self._versions.get(key, [])
        if 0 < version <= len(versions):
            return versions[version - 1]
        return None

    def get_history(self, module: str, template_name: str) -> list[dict]:
        """Get all versions of a prompt template."""
        key = f"{module}:{template_name}"
        return self._versions.get(key, [])


# Singleton
prompt_registry = PromptRegistry()
