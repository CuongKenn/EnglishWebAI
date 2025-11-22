"""
Chat room models for Group Communication mode
Supports text chat, video call, screen sharing with WebRTC
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ChatRoom(Base):
    """Group chat room for students"""
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    theme = Column(String, default="light")  # light or dark
    max_participants = Column(Integer, default=10)
    room_code = Column(String, unique=True, index=True, nullable=False)  # Join code
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    participants = relationship("ChatParticipant", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")


class ChatParticipant(Base):
    """Participants in a chat room"""
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String, nullable=True)  # Custom nickname in room
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_online = Column(Boolean, default=True)
    is_video_on = Column(Boolean, default=False)
    is_audio_on = Column(Boolean, default=False)
    peer_id = Column(String, nullable=True)  # WebRTC peer ID

    # Relationships
    room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User")


class ChatMessage(Base):
    """Messages in chat room"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_type = Column(String, default="text")  # text, image, emoji, system
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)  # For images
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User")
