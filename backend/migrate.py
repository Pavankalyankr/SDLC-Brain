"""
Quick migration: add missing columns to existing tables.
Run with: python migrate.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://sdlcbrain:sdlcbrain@localhost:5432/sdlcbrain"

MIGRATIONS = [
    # test_cases - add approved_at if missing
    """
    ALTER TABLE test_cases 
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    # code_reviews - add approved_at if missing (should already be there, but safety)
    """
    ALTER TABLE code_reviews
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    # agile tables - ensure approved_at exists
    """
    ALTER TABLE requirements
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    """
    ALTER TABLE epics
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    """
    ALTER TABLE features
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    """
    ALTER TABLE stories
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    # development - code_files
    """
    ALTER TABLE code_files
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    """,
    # pipeline_configs - add locked if missing
    """
    ALTER TABLE pipeline_configs
    ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
    """,
    # infra_configs - add locked if missing
    """
    ALTER TABLE infra_configs
    ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
    """,
]

async def run():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        for sql in MIGRATIONS:
            try:
                await conn.execute(text(sql.strip()))
                print(f"OK: {sql.strip()[:60]}...")
            except Exception as e:
                print(f"SKIP (already exists or error): {e}")
    await engine.dispose()
    print("\nMigration complete!")

asyncio.run(run())
