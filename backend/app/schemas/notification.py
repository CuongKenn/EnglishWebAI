from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str  # grade, info, success, warning, alert, error


class NotificationCreate(NotificationBase):
    user_id: int
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
