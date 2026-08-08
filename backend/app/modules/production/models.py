"""
SDLC Brain — Production Models

Incident + IncidentAnalysis for the full RCA pipeline:
  Incident Ingestion → Classification → Investigation → RCA → Runbook → Patch
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Incident(Base):
    """Production incident / support ticket."""

    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high, critical
    service: Mapped[str] = mapped_column(String(200), default="")  # affected service name
    raw_logs: Mapped[str] = mapped_column(Text, default="")  # pasted stack trace / error logs
    root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open, investigating, rca_complete, resolved, closed
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IncidentAnalysis(Base):
    """AI-generated analysis for an incident: classification, RCA, impact, runbook, code patch."""

    __tablename__ = "incident_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    classification: Mapped[str] = mapped_column(String(100), default="")  # e.g. "cache_timeout", "db_connection", "memory_leak"
    root_cause: Mapped[str] = mapped_column(Text, default="")  # detailed RCA
    impact: Mapped[str] = mapped_column(Text, default="")  # impact analysis
    affected_files: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of file paths
    mitigation_runbook: Mapped[str] = mapped_column(Text, default="")  # step-by-step mitigation
    proposed_fix: Mapped[str] = mapped_column(Text, default="")  # explanation of the fix
    code_patch: Mapped[str] = mapped_column(Text, default="")  # unified diff / code changes
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="pending_review")  # pending_review, approved, rejected, applied
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Runbook(Base):
    """Generated operational runbook."""

    __tablename__ = "runbooks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), default="general")  # deployment, monitoring, recovery, scaling
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
