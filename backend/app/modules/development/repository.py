"""
SDLC Brain — Development Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.development.models import CodeFile


class DevelopmentRepository:

    async def get_code_files(self, db: AsyncSession, project_id: str) -> list[CodeFile]:
        result = await db.execute(
            select(CodeFile).where(CodeFile.project_id == project_id).order_by(CodeFile.file_path)
        )
        return list(result.scalars().all())

    async def get_code_file(self, db: AsyncSession, file_id: str) -> CodeFile | None:
        result = await db.execute(select(CodeFile).where(CodeFile.id == file_id))
        return result.scalar_one_or_none()

    async def create_code_file(self, db: AsyncSession, code_file: CodeFile) -> CodeFile:
        db.add(code_file)
        await db.flush()
        await db.refresh(code_file)
        return code_file


development_repository = DevelopmentRepository()
