from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.agile.models import Epic, Feature, Requirement, Story

router = APIRouter()

@router.get("/")
async def global_search(q: str = "", project_id: str | None = None, db: AsyncSession = Depends(get_session)):
    """Global search across all artifact types (Ctrl+K)."""
    if not q:
        return {"query": q, "results": []}

    search_term = f"%{q}%"
    results = []

    # Helper function to query a model
    async def _search_model(model, type_name, icon):
        stmt = select(model).where(
            or_(
                model.title.ilike(search_term),
                model.description.ilike(search_term)
            )
        )
        if project_id:
            stmt = stmt.where(model.project_id == project_id)

        result = await db.execute(stmt)
        for item in result.scalars().all():
            results.append({
                "id": item.id,
                "title": item.title,
                "type": type_name,
                "icon": icon,
                "description": item.description[:100] + "..." if len(item.description) > 100 else item.description,
                "url": f"/projects/{item.project_id}/requirements" # Simplified routing for MVP
            })

    await _search_model(Requirement, "Requirement", "ClipboardList")
    await _search_model(Epic, "Epic", "Layers")
    await _search_model(Feature, "Feature", "Layout")
    await _search_model(Story, "Story", "FileText")

    return {"query": q, "results": results}
