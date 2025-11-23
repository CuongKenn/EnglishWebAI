"""
Pydantic schemas for Chat Room API
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


# Chat Room Schemas
class ChatRoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_participants: int = 10


class ChatRoomCreate(ChatRoomBase):
    pass


class ChatRoomResponse(ChatRoomBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    is_active: bool
    theme: str
    room_code: str
    participant_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Chat Participant Schemas
class ChatParticipantResponse(BaseModel):
    id: int
    user_id: int
    username: str
    nickname: Optional[str]
    joined_at: datetime
    is_online: bool
    is_video_on: bool
    is_audio_on: bool
    peer_id: Optional[str]

    class Config:
        from_attributes = True


class ChatParticipantUpdate(BaseModel):
    nickname: Optional[str] = None
    is_video_on: Optional[bool] = None
    is_audio_on: Optional[bool] = None
    peer_id: Optional[str] = None


# Chat Message Schemas
class ChatMessageCreate(BaseModel):
    message_type: str = "text"  # text, image, emoji, system
    content: str
    media_url: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    sender_name: str
    message_type: str
    content: str
    media_url: Optional[str]
    created_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


# WebSocket message types
class WSMessage(BaseModel):
    type: str  # join, leave, message, video_toggle, audio_toggle, peer_signal
    data: dict


class ChatRoomJoin(BaseModel):
    room_code: str
    nickname: Optional[str] = None


class ChatRoomDetail(ChatRoomResponse):
    participants: List[ChatParticipantResponse]
    participant_count: int
