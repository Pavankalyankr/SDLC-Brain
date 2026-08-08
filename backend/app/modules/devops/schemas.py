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


class ImageVersionResponse(BaseModel):
    id: str
    project_id: str
    service_name: str
    image_name: str
    current_version: str
    previous_version: str
    tag_type: str
    status: str
    base_image: str
    change_summary: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReleaseNoteResponse(BaseModel):
    id: str
    project_id: str
    version: str
    release_notes: str
    deploy_instructions: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateDevOpsRequest(BaseModel):
    project_id: str
    instructions: str | None = None


class GenerateReleaseRequest(BaseModel):
    project_id: str
    version: str | None = None
    changes: str | None = None


class DevOpsStatusUpdate(BaseModel):
    status: str
