from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_analytics import AIUsageCreate
from app.services.ai_analytics_service import AIAnalyticsService


router = APIRouter(prefix="/api/v1/ai", tags=["AI Usage"])


@router.post("/usage")
def log_ai_usage(
    payload: AIUsageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        event = AIAnalyticsService.log_usage(
            db=db,
            user_id=current_user.id,
            feature=payload.feature,
            metadata=payload.metadata,
        )
        return {"id": event.id, "message": "logged"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

