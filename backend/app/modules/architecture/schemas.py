"""
SDLC Brain — Architecture Schemas

Pydantic request/response models for the Architecture module.
"""

from datetime import datetime

from pydantic import BaseModel


class SystemDesignResponse(BaseModel):
    id: str
    project_id: str
    source_type: str | None = None
    source_id: str | None = None
    title: str
    description: str
    architecture_type: str
    components: str  # JSON string
    mermaid_diagram: str | None
    tech_stack: str  # JSON string
    status: str
    version: int
    confidence: float
    locked: bool
    feedback: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class APIContractResponse(BaseModel):
    id: str
    project_id: str
    system_design_id: str | None
    source_type: str | None = None
    source_id: str | None = None
    method: str
    path: str
    summary: str
    description: str
    request_body: str | None
    response_body: str | None
    status_codes: str
    service: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DBSchemaResponse(BaseModel):
    id: str
    project_id: str
    system_design_id: str | None
    source_type: str | None = None
    source_id: str | None = None
    table_name: str
    description: str
    columns: str  # JSON string
    relationships: str
    indexes: str
    mermaid_diagram: str | None
    status: str
    version: int
    confidence: float
    locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateArchitectureRequest(BaseModel):
    project_id: str
    instructions: str | None = None
    source_type: str | None = None
    source_id: str | None = None


class ArchitectureStatusUpdate(BaseModel):
    status: str
    feedback: str | None = None
