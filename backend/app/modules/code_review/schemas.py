"""
SDLC Brain — Code Review Schemas
"""

from datetime import datetime

from pydantic import BaseModel


class CodeReviewResponse(BaseModel):
    id: str
    project_id: str
    file_path: str
    original_code: str
    review_comments: str
    severity: str
    suggestions: str
    score: float
    status: str
    version: int
    confidence: float
    locked: bool
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateReviewRequest(BaseModel):
    project_id: str
    target_stage: str | None = None
    target_id: str | None = None
    instructions: str | None = None


class ReviewStatusUpdate(BaseModel):
    status: str
    feedback: str | None = None
