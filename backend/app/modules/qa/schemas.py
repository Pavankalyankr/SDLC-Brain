"""
SDLC Brain — QA Schemas
"""

from datetime import datetime

from pydantic import BaseModel


class TestCaseResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    test_type: str
    preconditions: str | None
    steps: str
    expected_result: str
    code: str | None
    story_id: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TestPlanResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    scope: str
    strategy: str
    coverage_summary: str
    status: str
    version: int
    confidence: float
    locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateQARequest(BaseModel):
    project_id: str
    target_stage: str | None = None
    target_id: str | None = None
    instructions: str | None = None


class TestCaseStatusUpdate(BaseModel):
    status: str
    feedback: str | None = None
