from datetime import datetime

from pydantic import BaseModel


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str  # grade, info, success, warning, alert, error


class NotificationCreate(NotificationBase):
    user_id: int
    related_id: int | None = None
    related_type: str | None = None


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    related_id: int | None = None
    related_type: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
