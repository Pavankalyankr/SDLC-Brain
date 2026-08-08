"""
SDLC Brain — DevOps Models
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PipelineConfig(Base):
    """Generated CI/CD pipeline configuration."""

    __tablename__ = "pipeline_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), default="github_actions")  # github_actions, gitlab_ci, jenkins
    config_content: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InfraConfig(Base):
    """Generated infrastructure configuration (Docker, docker-compose, K8s)."""

    __tablename__ = "infra_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    config_type: Mapped[str] = mapped_column(String(50), default="dockerfile")  # dockerfile, docker_compose, k8s, env_template, dockerignore
    config_content: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ImageVersion(Base):
    """Container image version tracking for release management."""

    __tablename__ = "image_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    service_name: Mapped[str] = mapped_column(String(200), nullable=False)  # e.g. "backend", "frontend", "worker"
    image_name: Mapped[str] = mapped_column(String(500), nullable=False)  # e.g. "myapp/backend"
    current_version: Mapped[str] = mapped_column(String(100), default="v1.0.0")
    previous_version: Mapped[str] = mapped_column(String(100), default="")
    tag_type: Mapped[str] = mapped_column(String(20), default="semver")  # semver, commit_sha
    status: Mapped[str] = mapped_column(String(20), default="new")  # new, unchanged, outdated
    base_image: Mapped[str] = mapped_column(String(500), default="")  # e.g. "python:3.12-slim"
    change_summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ReleaseNote(Base):
    """Generated release notes and deployment instructions."""

    __tablename__ = "release_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version: Mapped[str] = mapped_column(String(100), default="v1.0.0")
    release_notes: Mapped[str] = mapped_column(Text, default="")  # markdown
    deploy_instructions: Mapped[str] = mapped_column(Text, default="")  # markdown
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
