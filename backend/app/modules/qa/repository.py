"""
SDLC Brain — QA Repository
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.qa.models import TestCase, TestPlan


class QARepository:

    async def get_test_cases(self, db: AsyncSession, project_id: str) -> list[TestCase]:
        result = await db.execute(
            select(TestCase).where(TestCase.project_id == project_id).order_by(TestCase.created_at)
        )
        return list(result.scalars().all())

    async def create_test_case(self, db: AsyncSession, test_case: TestCase) -> TestCase:
        db.add(test_case)
        await db.flush()
        await db.refresh(test_case)
        return test_case

    async def get_test_plans(self, db: AsyncSession, project_id: str) -> list[TestPlan]:
        result = await db.execute(
            select(TestPlan).where(TestPlan.project_id == project_id).order_by(TestPlan.created_at)
        )
        return list(result.scalars().all())

    async def create_test_plan(self, db: AsyncSession, test_plan: TestPlan) -> TestPlan:
        db.add(test_plan)
        await db.flush()
        await db.refresh(test_plan)
        return test_plan


qa_repository = QARepository()
