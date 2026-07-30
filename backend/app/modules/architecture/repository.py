"""
SDLC Brain — Architecture Repository

Database queries for the Architecture module.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.architecture.models import APIContract, DBSchema, SystemDesign


class ArchitectureRepository:
    """Database access for architecture artifacts."""

    # --- System Design ---
    async def get_designs(self, db: AsyncSession, project_id: str) -> list[SystemDesign]:
        result = await db.execute(
            select(SystemDesign).where(SystemDesign.project_id == project_id).order_by(SystemDesign.created_at)
        )
        return list(result.scalars().all())

    async def get_design(self, db: AsyncSession, design_id: str) -> SystemDesign | None:
        result = await db.execute(select(SystemDesign).where(SystemDesign.id == design_id))
        return result.scalar_one_or_none()

    async def create_design(self, db: AsyncSession, design: SystemDesign) -> SystemDesign:
        db.add(design)
        await db.flush()
        await db.refresh(design)
        return design

    # --- API Contracts ---
    async def get_api_contracts(self, db: AsyncSession, project_id: str) -> list[APIContract]:
        result = await db.execute(
            select(APIContract).where(APIContract.project_id == project_id).order_by(APIContract.created_at)
        )
        return list(result.scalars().all())

    async def create_api_contract(self, db: AsyncSession, contract: APIContract) -> APIContract:
        db.add(contract)
        await db.flush()
        await db.refresh(contract)
        return contract

    # --- DB Schemas ---
    async def get_db_schemas(self, db: AsyncSession, project_id: str) -> list[DBSchema]:
        result = await db.execute(
            select(DBSchema).where(DBSchema.project_id == project_id).order_by(DBSchema.created_at)
        )
        return list(result.scalars().all())

    async def create_db_schema(self, db: AsyncSession, schema: DBSchema) -> DBSchema:
        db.add(schema)
        await db.flush()
        await db.refresh(schema)
        return schema


architecture_repository = ArchitectureRepository()
