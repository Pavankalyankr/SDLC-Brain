"""
SDLC Brain — AI Router (Configuration)

Loads ai_config.yaml and provides routing decisions.
Determines which model handles which task type.
"""

from pathlib import Path
from typing import Any

import yaml

from app.core.config import settings


class AIRouter:
    """
    Reads AI configuration and resolves which model + provider
    should handle each task type.
    """

    def __init__(self, config_path: str | None = None) -> None:
        self._config_path = Path(config_path or settings.AI_CONFIG_PATH)
        self._config: dict[str, Any] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Load configuration from YAML file."""
        if self._config_path.exists():
            with open(self._config_path) as f:
                self._config = yaml.safe_load(f) or {}
        else:
            # Fallback defaults
            self._config = {
                "providers": {
                    "nvidia_nim": {
                        "name": "NVIDIA NIM",
                        "api_base": settings.NVIDIA_NIM_API_BASE,
                        "api_key": settings.NVIDIA_NIM_API_KEY,
                        "enabled": True,
                    }
                },
                "models": {
                    "deepseek-r1": {
                        "provider": "nvidia_nim",
                        "model_id": settings.DEFAULT_REASONING_MODEL,
                        "max_tokens": 8192,
                        "temperature": 0.7,
                        "category": "reasoning",
                    },
                    "qwen3-coder": {
                        "provider": "nvidia_nim",
                        "model_id": settings.DEFAULT_CODING_MODEL,
                        "max_tokens": 8192,
                        "temperature": 0.3,
                        "category": "engineering",
                    },
                },
                "routing": {
                    "agile": "deepseek-r1",
                    "architecture": "deepseek-r1",
                    "development": "qwen3-coder",
                    "qa": "qwen3-coder",
                    "code_review": "qwen3-coder",
                    "knowledge": "qwen3-coder",
                    "devops": "qwen3-coder",
                    "production": "deepseek-r1",
                    "project_management": "deepseek-r1",
                },
                "defaults": {
                    "max_tokens": 4096,
                    "temperature": 0.5,
                    "top_p": 0.95,
                    "stream": True,
                },
            }

    def reload(self) -> None:
        """Reload configuration from file (hot reload)."""
        self._load_config()

    @property
    def config(self) -> dict[str, Any]:
        return self._config

    def get_model_for_task(self, task_type: str) -> str:
        """Get the model name assigned to a task type."""
        routing = self._config.get("routing", {})
        return routing.get(task_type, "deepseek-r1")

    def get_model_config(self, model_name: str) -> dict[str, Any]:
        """Get full configuration for a model."""
        models = self._config.get("models", {})
        model_cfg = models.get(model_name, {})
        defaults = self._config.get("defaults", {})
        # Merge defaults with model-specific config
        return {**defaults, **model_cfg}

    def get_provider_config(self, provider_name: str) -> dict[str, Any]:
        """Get configuration for a provider."""
        providers = self._config.get("providers", {})
        return providers.get(provider_name, {})

    def resolve_task(self, task_type: str) -> dict[str, Any]:
        """
        Fully resolve a task type to its model ID, provider, and parameters.
        This is the main method the orchestrator calls.
        """
        model_name = self.get_model_for_task(task_type)
        model_cfg = self.get_model_config(model_name)
        provider_name = model_cfg.get("provider", "nvidia_nim")
        provider_cfg = self.get_provider_config(provider_name)

        return {
            "model_name": model_name,
            "model_id": model_cfg.get("model_id", ""),
            "provider": provider_name,
            "api_base": provider_cfg.get("api_base", ""),
            "api_key": provider_cfg.get("api_key", ""),
            "max_tokens": model_cfg.get("max_tokens", 4096),
            "temperature": model_cfg.get("temperature", 0.5),
            "top_p": model_cfg.get("top_p", 0.95),
            "stream": model_cfg.get("stream", True),
        }

    def get_all_models(self) -> dict[str, Any]:
        """Get all configured models (for the UI selector)."""
        return self._config.get("models", {})

    def get_all_providers(self) -> dict[str, Any]:
        """Get all configured providers (for the AI Config page)."""
        return self._config.get("providers", {})

    def get_routing_table(self) -> dict[str, str]:
        """Get the full task → model routing table."""
        return self._config.get("routing", {})

    def update_routing(self, task_type: str, model_name: str) -> None:
        """Update routing for a task type (from UI)."""
        if "routing" not in self._config:
            self._config["routing"] = {}
        self._config["routing"][task_type] = model_name
        self._save_config()

    def _save_config(self) -> None:
        """Save current config back to YAML file."""
        with open(self._config_path, "w") as f:
            yaml.dump(self._config, f, default_flow_style=False, sort_keys=False)


# Singleton
ai_router = AIRouter()
