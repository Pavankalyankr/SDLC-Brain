"""
SDLC Brain — AI Configuration Router

API endpoints for managing AI models, providers, and routing.
"""

from fastapi import APIRouter

from app.ai.router import ai_router

router = APIRouter()


@router.get("/models")
async def get_models():
    """Get all configured models."""
    return ai_router.get_all_models()


@router.get("/providers")
async def get_providers():
    """Get all configured providers."""
    return ai_router.get_all_providers()


@router.get("/routing")
async def get_routing():
    """Get the task → model routing table."""
    return ai_router.get_routing_table()


@router.patch("/routing/{task_type}")
async def update_routing(task_type: str, model_name: str):
    """Update routing for a specific task type."""
    ai_router.update_routing(task_type, model_name)
    return {"task_type": task_type, "model": model_name}


@router.post("/test-connection/{provider_name}")
async def test_connection(provider_name: str):
    """Test connection to a provider."""
    from app.ai.providers.registry import provider_registry
    try:
        provider = provider_registry.get(provider_name)
        healthy = await provider.health_check()
        return {"provider": provider_name, "status": "connected" if healthy else "failed"}
    except Exception as e:
        return {"provider": provider_name, "status": "error", "detail": str(e)}


@router.post("/reload")
async def reload_config():
    """Reload AI configuration from file."""
    ai_router.reload()
    return {"status": "reloaded"}
