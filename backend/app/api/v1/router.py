"""
SDLC Brain — API v1 Router

Aggregates all module routers into a single v1 API prefix.
"""

from fastapi import APIRouter

from app.modules.agile.router import router as agile_router
from app.modules.ai_config.router import router as ai_config_router
from app.modules.architecture.router import router as architecture_router
from app.modules.code_review.router import router as code_review_router
from app.modules.development.router import router as development_router
from app.modules.devops.router import router as devops_router
from app.modules.document.router import router as document_router
from app.modules.export.router import router as export_router
from app.modules.knowledge.router import router as knowledge_router
from app.modules.production.router import router as production_router
from app.modules.project.router import router as project_router
from app.modules.qa.router import router as qa_router
from app.modules.search.router import router as search_router
from app.modules.version.router import router as version_router

api_v1_router = APIRouter()

api_v1_router.include_router(project_router, prefix="/projects", tags=["Projects"])
api_v1_router.include_router(document_router, prefix="/documents", tags=["Documents"])
api_v1_router.include_router(agile_router, prefix="/agile", tags=["Agile"])
api_v1_router.include_router(architecture_router, prefix="/architecture", tags=["Architecture"])
api_v1_router.include_router(development_router, prefix="/development", tags=["Development"])
api_v1_router.include_router(qa_router, prefix="/qa", tags=["QA"])
api_v1_router.include_router(code_review_router, prefix="/code-review", tags=["Code Review"])
api_v1_router.include_router(devops_router, prefix="/devops", tags=["DevOps"])
api_v1_router.include_router(production_router, prefix="/production", tags=["Production Support"])
api_v1_router.include_router(knowledge_router, prefix="/knowledge", tags=["Knowledge"])
api_v1_router.include_router(version_router, prefix="/versions", tags=["Versions"])
api_v1_router.include_router(search_router, prefix="/search", tags=["Search"])
api_v1_router.include_router(export_router, prefix="/export", tags=["Export"])
api_v1_router.include_router(ai_config_router, prefix="/ai-config", tags=["AI Configuration"])
