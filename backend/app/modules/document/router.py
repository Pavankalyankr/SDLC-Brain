"""
SDLC Brain — Document Router

IMPORTANT: Route ordering is critical to prevent FastAPI from matching
'sow-text' as a {document_id} value. The specific sub-path route
/{project_id}/sow-text MUST be declared before /{project_id}/{document_id}.
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.document.schemas import DocumentResponse
from app.modules.document.service import document_service

router = APIRouter()


@router.post("/{project_id}/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
):
    """Upload a SOW document. Accepts PDF, DOCX, or TXT."""
    return await document_service.upload_document(db, project_id, file)


@router.get("/{project_id}/sow-text")
async def get_sow_text(
    project_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get concatenated SOW text from all uploaded documents.

    IMPORTANT: Must come before /{project_id}/{document_id} to avoid
    'sow-text' being matched as a document_id path parameter.
    """
    text = await document_service.get_sow_text(db, project_id)
    return {"project_id": project_id, "text": text, "length": len(text)}


@router.get("/{project_id}/{document_id}", response_model=DocumentResponse)
async def get_document(
    project_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Get a specific document."""
    return await document_service.get_document(db, document_id)


@router.get("/{project_id}", response_model=list[DocumentResponse])
async def list_documents(
    project_id: str,
    db: AsyncSession = Depends(get_session),
):
    """List all documents for a project."""
    return await document_service.get_project_documents(db, project_id)

@router.delete("/{project_id}/{document_id}", status_code=204)
async def delete_document(
    project_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Delete a document."""
    await document_service.delete_document(db, document_id)
    return None
