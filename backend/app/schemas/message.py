from datetime import datetime

from pydantic import BaseModel


class MessageBase(BaseModel):
    receiver_id: int
    subject: str | None = None
    content: str


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    is_read: bool | None = None


class SenderInfo(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    avatar: str | None = None

    class Config:
        from_attributes = True


class ReceiverInfo(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    avatar: str | None = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    subject: str | None
    content: str
    is_read: bool
    created_at: datetime
    sender: SenderInfo
    receiver: ReceiverInfo

    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    """Preview of a conversation with another user"""
    user_id: int
    user_name: str
    user_email: str
    user_role: str
    user_avatar: str | None
    last_message: str
    last_message_time: datetime
    unread_count: int
