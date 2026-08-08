"""
SDLC Brain — Production Schemas
"""

from datetime import datetime

from pydantic import BaseModel


class IncidentResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    severity: str
    service: str
    raw_logs: str
    root_cause: str | None
    resolution: str | None
    ai_analysis: str | None
    status: str
    confidence: float
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class IncidentAnalysisResponse(BaseModel):
    id: str
    incident_id: str
    classification: str
    root_cause: str
    impact: str
    affected_files: str
    mitigation_runbook: str
    proposed_fix: str
    code_patch: str
    confidence: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RunbookResponse(BaseModel):
    id: str
    project_id: str
    title: str
    content: str
    category: str
    version: int
    confidence: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalyzeIncidentRequest(BaseModel):
    project_id: str
    title: str | None = None
    raw_logs: str | None = None
    severity: str | None = None
    service: str | None = None
    description: str | None = None


class IncidentStatusUpdate(BaseModel):
    status: str
    resolution: str | None = None


class AnalysisStatusUpdate(BaseModel):
    status: str  # approved, rejected
