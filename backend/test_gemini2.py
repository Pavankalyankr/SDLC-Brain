import asyncio
import logging
from app.ai.agents.development_agent import development_agent
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory

logging.basicConfig(level=logging.INFO)

async def main():
    async with async_session_factory() as db:
        await development_agent.generate_code_files(
            task_id="test1234",
            db=db,
            project_id="09dad52c-866f-4de4-b041-2d91a9893678",
            instructions="explain frontend code that is written"
        )

if __name__ == "__main__":
    asyncio.run(main())
