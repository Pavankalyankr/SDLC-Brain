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
    target_stage: str | None = None
    target_id: str | None = None
    instructions: str | None = None
    chat_history: list[dict[str, str]] | None = None


class CodeFileStatusUpdate(BaseModel):
    status: str
    feedback: str | None = None
