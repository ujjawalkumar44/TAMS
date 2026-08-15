from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = DashboardService(db)
    return service.get_dashboard_data()
