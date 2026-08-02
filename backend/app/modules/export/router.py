"""SDLC Brain — Export Router"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.modules.agile.service import agile_service
from app.modules.architecture.repository import architecture_repository
from app.modules.export.service import export_service
from app.modules.project.service import project_service

router = APIRouter()

@router.get("/agile/{project_id}/{module_type}/{format_type}")
async def export_agile_artifact(project_id: str, module_type: str, format_type: str, db: AsyncSession = Depends(get_session)):
    """Export Agile artifacts (requirements, epics, features, stories) to PDF, DOCX, MD, or JSON."""
    if module_type not in ["requirements", "epics", "features", "stories"]:
        raise HTTPException(status_code=400, detail="Invalid module type for export.")
    if format_type not in ["pdf", "docx", "md", "json"]:
        raise HTTPException(status_code=400, detail="Invalid format type for export.")

    # Get project name
    project = await project_service.get_project(db, project_id)
    project_name = project.name if project else "Project"

    # Get items
    if module_type == "requirements":
        items = await agile_service.get_requirements(db, project_id)
    elif module_type == "epics":
        items = await agile_service.get_epics(db, project_id)
    elif module_type == "features":
        items = await agile_service.get_features(db, project_id)
    elif module_type == "stories":
        items = await agile_service.get_stories(db, project_id)
    else:
        items = []

    buffer, media_type, ext = export_service.export_agile(module_type, items, format_type, project_name)

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{project_name.replace(" ", "_")}_{module_type}.{ext}"'}
    )


@router.get("/architecture/{project_id}/{module_type}/{format_type}")
async def export_architecture_artifact(
    project_id: str,
    module_type: str,
    format_type: str,
    source_id: str | None = None,
    db: AsyncSession = Depends(get_session)
):
    """Export Architecture artifacts (system-design, api-contracts, db-schema) to PDF, DOCX, MD, or JSON."""
    if format_type not in ["pdf", "docx", "md", "json"]:
        raise HTTPException(status_code=400, detail="Invalid format type for export.")

    project = await project_service.get_project(db, project_id)
    project_name = project.name if project else "Project"

    if module_type in ["designs", "system-design", "system_design"]:
        items = await architecture_repository.get_designs(db, project_id)
        mod_label = "system-design"
    elif module_type in ["apis", "api-contracts", "api_contracts"]:
        items = await architecture_repository.get_api_contracts(db, project_id)
        mod_label = "api-contracts"
    elif module_type in ["schemas", "db-schema", "db_schemas"]:
        items = await architecture_repository.get_db_schemas(db, project_id)
        mod_label = "db-schema"
    else:
        raise HTTPException(status_code=400, detail="Invalid architecture module type for export.")

    if source_id:
        items = [item for item in items if getattr(item, "source_id", None) == source_id]

    buffer, media_type, ext = export_service.export_architecture(mod_label, items, format_type, project_name)

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{project_name.replace(" ", "_")}_{mod_label}.{ext}"'}
    )
