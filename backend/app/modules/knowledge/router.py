"""SDLC Brain — Knowledge Router"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/{project_id}")
async def get_knowledge(project_id: str):
    return {"project_id": project_id, "index": []}

@router.post("/{project_id}/query")
async def query_knowledge(project_id: str):
    return {"answer": "", "sources": []}
