"""
SDLC Brain — DevOps Schemas
"""

from datetime import datetime

from pydantic import BaseModel


class PipelineConfigResponse(BaseModel):
    id: str
    project_id: str
    name: str
    platform: str
    config_content: str
    description: str
    status: str
    version: int
    confidence: float
    locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InfraConfigResponse(BaseModel):
    id: str
    project_id: str
    name: str
    config_type: str
    config_content: str
    description: str
    status: str
    version: int
    confidence: float
    locked: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateDevOpsRequest(BaseModel):
    project_id: str
