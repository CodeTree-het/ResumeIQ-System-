from fastapi import APIRouter, Depends

from backend.utils.auth_dependencies import require_candidate


router = APIRouter(
    prefix="/api/candidate",
    tags=["Candidate"]
)


@router.get("/dashboard")
async def candidate_dashboard(
    current_user: dict = Depends(require_candidate)
):
    return {
        "message": "Candidate dashboard access granted.",
        "user": current_user
    }