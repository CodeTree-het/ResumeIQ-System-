from fastapi import APIRouter, Depends

from backend.utils.auth_dependencies import require_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
async def admin_dashboard(
    current_user: dict = Depends(require_admin)
):
    return {
        "message": "Admin dashboard access granted.",
        "user": current_user
    }