"""
SDLC Brain — Agile Schemas

Pydantic request/response models for the Agile module.
"""

from datetime import datetime

from pydantic import BaseModel, Field

# --- Shared ---

class ArtifactStatusUpdate(BaseModel):
    """Update artifact status (review/approve)."""
    status: str = Field(..., pattern="^(draft|review|approved)$")
    feedback: str | None = None


# --- Requirements ---

class RequirementCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    priority: str | None = None
    category: str | None = None


class RequirementResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    priority: str | None
    category: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Epics ---

class EpicCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    requirement_id: str | None = None


class EpicResponse(BaseModel):
    id: str
    project_id: str
    requirement_id: str | None
    title: str
    description: str
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Features ---

class FeatureCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    epic_id: str | None = None


class FeatureResponse(BaseModel):
    id: str
    project_id: str
    epic_id: str | None
    title: str
    description: str
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Stories ---

class StoryCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    acceptance_criteria: str | None = None
    story_points: int | None = None
    sprint: str | None = None
    priority: str | None = None
    feature_id: str | None = None


class StoryResponse(BaseModel):
    id: str
    project_id: str
    feature_id: str | None
    title: str
    description: str
    acceptance_criteria: str | None
    story_points: int | None
    sprint: str | None
    priority: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Generation Request ---

class GenerateRequest(BaseModel):
    """Request to generate agile artifacts using AI."""
    project_id: str
    source_content: str | None = None  # SOW text or parent artifact content
    parent_ids: list[str] = []  # IDs of parent artifacts to generate from
    instructions: str | None = None  # Additional user instructions
