"""
SDLC Brain — Architecture Models

SQLAlchemy ORM models for architecture artifacts:
system design, API contracts, DB schemas, and diagrams.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SystemDesign(Base):
    """High-level system architecture design."""

    __tablename__ = "system_designs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    architecture_type: Mapped[str] = mapped_column(String(50), default="microservices")  # monolith, microservices, serverless, event-driven
    components: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of components
    mermaid_diagram: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[str] = mapped_column(Text, default="{}")  # JSON: {frontend, backend, database, ...}
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class APIContract(Base):
    """API endpoint contract."""

    __tablename__ = "api_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    system_design_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("system_designs.id"), nullable=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)  # GET, POST, PUT, DELETE, PATCH
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    request_body: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON schema
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON schema
    status_codes: Mapped[str] = mapped_column(Text, default="[]")  # JSON array
    service: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DBSchema(Base):
    """Database table schema."""

    __tablename__ = "db_schemas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    system_design_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("system_designs.id"), nullable=True)
    table_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    columns: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of column definitions
    relationships: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of FK relationships
    indexes: Mapped[str] = mapped_column(Text, default="[]")  # JSON array
    mermaid_diagram: Mapped[str | None] = mapped_column(Text, nullable=True)  # ER diagram
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
