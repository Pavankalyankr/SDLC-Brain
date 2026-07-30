"""
SDLC Brain — Document Schemas

Pydantic request/response models for the Document module.
"""

from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    """Document details."""
    id: str
    project_id: str
    filename: str
    content_type: str
    extracted_text: str | None
    page_count: int | None
    size_bytes: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
