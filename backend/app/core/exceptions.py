"""
SDLC Brain — Exception Handling

Unified exception classes and FastAPI exception handlers.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class SDLCBrainException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, status_code: int = 500, detail: str | None = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(SDLCBrainException):
    """Resource not found."""

    def __init__(self, resource: str, identifier: str | None = None):
        msg = f"{resource} not found"
        if identifier:
            msg = f"{resource} with id '{identifier}' not found"
        super().__init__(message=msg, status_code=404)


class ValidationException(SDLCBrainException):
    """Validation error."""

    def __init__(self, message: str, detail: str | None = None):
        super().__init__(message=message, status_code=422, detail=detail)


class AIException(SDLCBrainException):
    """AI/LLM related error."""

    def __init__(self, message: str, detail: str | None = None):
        super().__init__(message=message, status_code=502, detail=detail)


class WorkflowException(SDLCBrainException):
    """Workflow constraint violation (e.g., trying to edit approved artifact)."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=409)


class ApprovalLockException(WorkflowException):
    """Attempt to modify an approved (locked) artifact."""

    def __init__(self, artifact_type: str, artifact_id: str):
        super().__init__(
            message=f"{artifact_type} '{artifact_id}' is approved and locked. "
                    f"Create a new version instead of modifying."
        )


class StoryGateException(WorkflowException):
    """Attempt to generate downstream artifacts without approved story."""

    def __init__(self, story_id: str | None = None):
        msg = "Architecture and Development require an approved story."
        if story_id:
            msg = f"Story '{story_id}' must be approved before generating architecture."
        super().__init__(message=msg)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    def _get_cors_headers(request: Request) -> dict[str, str]:
        from app.core.config import settings
        origin = request.headers.get("origin")
        headers = {}
        if origin and (origin in settings.CORS_ORIGINS or "*" in settings.CORS_ORIGINS):
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
        return headers

    @app.exception_handler(SDLCBrainException)
    async def sdlc_exception_handler(request: Request, exc: SDLCBrainException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.message,
                "detail": exc.detail,
            },
            headers=_get_cors_headers(request),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "An unexpected error occurred",
                "detail": str(exc) if __debug__ else None,
            },
            headers=_get_cors_headers(request),
        )
