from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.schemas.ai_analytics import AIAnalyticsResponse
from app.services.ai_analytics_service import AIAnalyticsService


router = APIRouter(prefix="/api/v1/admin/ai", tags=["AI Analytics (Admin)"])


@router.get("/analytics", response_model=AIAnalyticsResponse)
def get_ai_analytics(
    range: str = Query("30d", pattern=r"^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    data = AIAnalyticsService.get_analytics(db, range_value=range)
    return data

