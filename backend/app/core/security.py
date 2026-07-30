"""
SDLC Brain — Security Module

Placeholder for future authentication hooks.
Currently a pass-through for MVP.
"""

# Future: JWT validation, API key auth, RBAC
# For MVP, all endpoints are open


async def get_current_user() -> dict:
    """
    FastAPI dependency for the current user.
    MVP: Returns a default user. Post-MVP: JWT/OAuth validation.
    """
    return {
        "id": "default-user",
        "name": "Developer",
        "role": "admin",
    }
