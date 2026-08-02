"""
SDLC Brain — Provider Registry

Registry of all available LLM providers.
Resolves provider name → provider instance.
"""

from app.ai.providers.base import BaseLLMProvider
from app.ai.providers.gemini_provider import GeminiProvider


class ProviderRegistry:
    """Manages LLM provider instances."""

    def __init__(self) -> None:
        self._providers: dict[str, BaseLLMProvider] = {}

    def register(self, name: str, provider: BaseLLMProvider) -> None:
        """Register a provider instance."""
        self._providers[name] = provider

    def get(self, name: str) -> BaseLLMProvider:
        """Get a provider by name."""
        if name not in self._providers:
            raise ValueError(f"Provider '{name}' not registered. Available: {list(self._providers.keys())}")
        return self._providers[name]

    def list_providers(self) -> list[str]:
        """List all registered provider names."""
        return list(self._providers.keys())

    def initialize_from_config(self, providers_config: dict) -> None:
        """Initialize providers from ai_config.yaml providers section."""
        import os

        for name, cfg in providers_config.items():
            if not cfg.get("enabled", True):
                continue

            api_key = cfg.get("api_key", "")

            # Resolve environment variable references like ${GEMINI_API_KEY}
            if api_key.startswith("${") and api_key.endswith("}"):
                api_key = os.environ.get(api_key[2:-1], api_key)

            if name == "gemini":
                provider = GeminiProvider(api_key=api_key or None)
                self.register(name, provider)
            # Add future providers here if needed


# Singleton
provider_registry = ProviderRegistry()
