from fastapi import APIRouter, Depends

from backend.utils.auth_dependencies import require_recruiter


router = APIRouter(
    prefix="/api/recruiter",
    tags=["Recruiter"]
)


@router.get("/dashboard")
async def recruiter_dashboard(
    current_user: dict = Depends(require_recruiter)
):
    return {
        "message": "Recruiter dashboard access granted.",
        "user": current_user
    }