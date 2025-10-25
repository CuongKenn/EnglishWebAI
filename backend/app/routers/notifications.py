from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    notification_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications with optional filters"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    if notification_type:
        query = query.filter(Notification.type == notification_type)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.post("/", response_model=NotificationResponse, status_code=201)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a notification (admin only for now - can be extended)"""
    # For now, anyone can create notifications
    # In production, you might want to restrict this to admins or system events
    
    db_notification = Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@router.patch("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    update_data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read/unread"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if update_data.is_read is not None:
        notification.is_read = update_data.is_read
    
    db.commit()
    db.refresh(notification)
    return notification


@router.patch("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all user's notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}


@router.delete("/")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all user's notifications"""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All notifications deleted"}
