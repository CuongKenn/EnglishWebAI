from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageUpdate, MessageResponse, ConversationPreview, SenderInfo, ReceiverInfo

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationPreview])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of conversations with other users"""
    # Get all users the current user has exchanged messages with
    # Subquery to get the latest message for each conversation
    from sqlalchemy import case
    
    conversations = []
    
    # Get all unique users who have sent or received messages from current user
    sent_to = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct()
    received_from = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct()
    
    user_ids = set()
    for row in sent_to:
        user_ids.add(row.receiver_id)
    for row in received_from:
        user_ids.add(row.sender_id)
    
    for user_id in user_ids:
        other_user = db.query(User).filter(User.id == user_id).first()
        if not other_user:
            continue
        
        # Get last message in conversation
        last_message = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.desc()).first()
        
        # Count unread messages from this user
        unread_count = db.query(Message).filter(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        
        if last_message:
            conversations.append(ConversationPreview(
                user_id=other_user.id,
                user_name=other_user.full_name,
                user_email=other_user.email,
                user_role=other_user.role,
                user_avatar=other_user.avatar_url,
                last_message=last_message.content[:100] + ('...' if len(last_message.content) > 100 else ''),
                last_message_time=last_message.created_at,
                unread_count=unread_count
            ))
    
    # Sort by last message time
    conversations.sort(key=lambda x: x.last_message_time, reverse=True)
    
    return conversations


@router.get("/conversation/{user_id}", response_model=List[MessageResponse])
def get_conversation_with_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in conversation with a specific user"""
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    
    # Format response with sender/receiver info
    result = []
    for msg in messages:
        result.append(MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            receiver_id=msg.receiver_id,
            subject=msg.subject,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender=SenderInfo(
                id=msg.sender.id,
                full_name=msg.sender.full_name,
                email=msg.sender.email,
                role=msg.sender.role,
                avatar=msg.sender.avatar_url
            ),
            receiver=ReceiverInfo(
                id=msg.receiver.id,
                full_name=msg.receiver.full_name,
                email=msg.receiver.email,
                role=msg.receiver.role,
                avatar=msg.receiver.avatar_url
            )
        ))
    
    return result


@router.post("/", response_model=MessageResponse, status_code=201)
def send_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to another user"""
    # Check if receiver exists
    receiver = db.query(User).filter(User.id == message.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        subject=message.subject,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return MessageResponse(
        id=db_message.id,
        sender_id=db_message.sender_id,
        receiver_id=db_message.receiver_id,
        subject=db_message.subject,
        content=db_message.content,
        is_read=db_message.is_read,
        created_at=db_message.created_at,
        sender=SenderInfo(
            id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            role=current_user.role,
            avatar=current_user.avatar_url
        ),
        receiver=ReceiverInfo(
            id=receiver.id,
            full_name=receiver.full_name,
            email=receiver.email,
            role=receiver.role,
            avatar=receiver.avatar_url
        )
    )


@router.patch("/{message_id}/read", response_model=MessageResponse)
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a message as read (only receiver can do this)"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.receiver_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        subject=message.subject,
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
        sender=SenderInfo(
            id=message.sender.id,
            full_name=message.sender.full_name,
            email=message.sender.email,
            role=message.sender.role,
            avatar=message.sender.avatar
        ),
        receiver=ReceiverInfo(
            id=message.receiver.id,
            full_name=message.receiver.full_name,
            email=message.receiver.email,
            role=message.receiver.role,
            avatar=message.receiver.avatar
        )
    )


@router.patch("/conversation/{user_id}/mark-all-read")
def mark_conversation_as_read(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all messages from a specific user as read"""
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All messages marked as read"}


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread messages"""
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    return {"count": count}


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a message (sender or receiver can delete)"""
    message = db.query(Message).filter(
        Message.id == message_id,
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    return {"message": "Message deleted"}
