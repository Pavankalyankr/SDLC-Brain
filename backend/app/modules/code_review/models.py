"""
SDLC Brain — Code Review Models
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CodeReview(Base):
    """An AI-generated code review."""

    __tablename__ = "code_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    original_code: Mapped[str] = mapped_column(Text, default="")
    review_comments: Mapped[str] = mapped_column(Text, default="[]")  # JSON array of comments
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info, warning, error, critical
    suggestions: Mapped[str] = mapped_column(Text, default="[]")  # JSON array
    score: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100 code quality score
    status: Mapped[str] = mapped_column(String(20), default="draft")
    version: Mapped[int] = mapped_column(Integer, default=1)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
