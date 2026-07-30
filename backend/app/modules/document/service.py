"""
SDLC Brain — Document Service

Business logic for document upload, storage, and text extraction.
"""

import logging
import shutil
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.modules.document.extractor import extract_text
from app.modules.document.models import Document

logger = logging.getLogger(__name__)


class DocumentService:
    """Business logic for document management."""

    async def upload_document(
        self, db: AsyncSession, project_id: str, file: UploadFile
    ) -> Document:
        """Upload a document, save to disk, and extract text."""
        # Create upload directory
        upload_dir = Path(settings.WORKSPACE_ROOT) / project_id / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = upload_dir / (file.filename or "document")
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Get file size
        size_bytes = file_path.stat().st_size

        # Create DB record
        doc = Document(
            project_id=project_id,
            filename=file.filename or "document",
            content_type=file.content_type or "application/octet-stream",
            file_path=str(file_path),
            size_bytes=size_bytes,
            status="processing",
        )
        db.add(doc)
        await db.flush()

        # Extract text
        try:
            extracted_text, page_count = await extract_text(
                str(file_path), doc.content_type
            )
            doc.extracted_text = extracted_text
            doc.page_count = page_count
            doc.status = "ready" if extracted_text else "failed"
        except Exception as e:
            logger.error(f"Text extraction failed for {file.filename}: {e}")
            doc.status = "failed"

        await db.flush()
        await db.refresh(doc)
        logger.info(f"Uploaded document: {doc.filename} ({doc.status})")
        return doc

    async def get_document(self, db: AsyncSession, document_id: str) -> Document:
        """Get a document by ID."""
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundException("Document", document_id)
        return doc

    async def get_project_documents(
        self, db: AsyncSession, project_id: str
    ) -> list[Document]:
        """Get all documents for a project."""
        result = await db.execute(
            select(Document)
            .where(Document.project_id == project_id)
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_sow_text(self, db: AsyncSession, project_id: str) -> str:
        """Get concatenated text from all uploaded documents for a project."""
        docs = await self.get_project_documents(db, project_id)
        texts = [doc.extracted_text for doc in docs if doc.extracted_text]
        return "\n\n---\n\n".join(texts)


document_service = DocumentService()
