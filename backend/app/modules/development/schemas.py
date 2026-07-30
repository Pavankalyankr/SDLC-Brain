"""
SDLC Brain — Development Schemas
"""

from datetime import datetime

from pydantic import BaseModel


class CodeFileResponse(BaseModel):
    id: str
    project_id: str
    file_path: str
    language: str
    content: str
    description: str
    story_id: str | None
    component: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateCodeRequest(BaseModel):
    project_id: str
    story_id: str | None = None
    instructions: str | None = None
