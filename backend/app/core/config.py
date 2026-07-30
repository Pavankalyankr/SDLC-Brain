"""
SDLC Brain — Application Configuration

All settings are loaded from environment variables or .env file.
Nothing is hardcoded. Every value is configurable.
"""

from pathlib import Path
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "SDLC Brain"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://sdlcbrain:sdlcbrain@localhost:5432/sdlcbrain"

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Synchronous database URL for Alembic migrations."""
        return self.DATABASE_URL.replace("+asyncpg", "")

    # --- AI Configuration ---
    NVIDIA_NIM_API_KEY: str = ""
    NVIDIA_NIM_API_BASE: str = "https://integrate.api.nvidia.com/v1/"
    DEFAULT_REASONING_MODEL: str = "nvidia_nim/deepseek-ai/deepseek-r1"
    DEFAULT_CODING_MODEL: str = "nvidia_nim/qwen/qwen3-coder"
    AI_CONFIG_PATH: str = "ai_config.yaml"

    # --- Workspace ---
    WORKSPACE_ROOT: str = "./workspace"
    UPLOAD_MAX_SIZE_MB: int = 50

    @property
    def WORKSPACE_PATH(self) -> Path:
        return Path(self.WORKSPACE_ROOT).resolve()

    @property
    def UPLOAD_MAX_BYTES(self) -> int:
        return self.UPLOAD_MAX_SIZE_MB * 1024 * 1024

    # --- Logging ---
    LOG_LEVEL: str = "INFO"


# Singleton settings instance
settings = Settings()
