"""
SDLC Brain — Project Schemas

Pydantic request/response models for the Project module.
"""

from datetime import datetime

from pydantic import BaseModel, Field

# --- Request Schemas ---

class ProjectCreate(BaseModel):
    """Create a new project."""
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: str | None = Field(None, description="Project description")


class ProjectUpdate(BaseModel):
    """Update an existing project."""
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = None


class MemoryEntryCreate(BaseModel):
    """Create a project memory entry."""
    key: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1)


class MemoryEntryUpdate(BaseModel):
    """Update a project memory entry."""
    value: str = Field(..., min_length=1)


# --- Response Schemas ---

class MemoryEntryResponse(BaseModel):
    """A single project memory entry."""
    id: str
    key: str
    value: str
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    """Project details."""
    id: str
    name: str
    description: str | None
    workspace_path: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    memory_entries: list[MemoryEntryResponse] = []

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Project summary for list views."""
    id: str
    name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
