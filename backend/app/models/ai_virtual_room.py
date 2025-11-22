"""
AI Virtual Room Models - Interactive English Learning with AI Teachers
Supports voice chat, pronunciation practice, and real-time conversation
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AIVirtualRoom(Base):
    """AI Virtual Room for English conversation practice"""
    __tablename__ = "ai_virtual_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    room_type = Column(String, nullable=False)  # speaking, pronunciation, conversation, group_chat
    level = Column(String, nullable=False)  # beginner, intermediate, advanced
    topic = Column(String, nullable=True)  # Conversation topic (e.g., "Travel", "Business")
    ai_teacher_persona = Column(JSON, nullable=True)  # AI teacher configuration
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    max_participants = Column(Integer, default=6)
    room_code = Column(String, unique=True, index=True, nullable=False)
    background_image = Column(String, nullable=True)  # Virtual room background
    
    # Settings
    enable_pronunciation_scoring = Column(Boolean, default=True)
    enable_grammar_correction = Column(Boolean, default=True)
    enable_vocabulary_hints = Column(Boolean, default=True)
    session_duration = Column(Integer, default=30)  # minutes
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    participants = relationship("AIRoomParticipant", back_populates="room", cascade="all, delete-orphan")
    messages = relationship("AIRoomMessage", back_populates="room", cascade="all, delete-orphan")
    sessions = relationship("AIRoomSession", back_populates="room", cascade="all, delete-orphan")


class AIRoomParticipant(Base):
    """Participants in AI Virtual Room"""
    __tablename__ = "ai_room_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("ai_virtual_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String, nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)
    is_online = Column(Boolean, default=True)
    is_speaking = Column(Boolean, default=False)
    is_audio_on = Column(Boolean, default=False)
    
    # Performance tracking
    total_speaking_time = Column(Integer, default=0)  # seconds
    pronunciation_score = Column(Float, nullable=True)
    grammar_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    
    # Relationships
    room = relationship("AIVirtualRoom", back_populates="participants")
    user = relationship("User")


class AIRoomMessage(Base):
    """Messages in AI Virtual Room (text + AI responses)"""
    __tablename__ = "ai_room_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("ai_virtual_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Null for AI
    sender_type = Column(String, default="user")  # user, ai_teacher, system
    message_type = Column(String, default="text")  # text, voice, correction, suggestion
    content = Column(Text, nullable=False)
    voice_url = Column(String, nullable=True)  # Audio file URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # AI Analysis (if voice message)
    transcription = Column(Text, nullable=True)
    pronunciation_score = Column(Float, nullable=True)
    grammar_issues = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    
    # Relationships
    room = relationship("AIVirtualRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


class AIRoomSession(Base):
    """Practice sessions in AI Virtual Room"""
    __tablename__ = "ai_room_sessions"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("ai_virtual_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, default=0)  # seconds
    
    # Session metrics
    messages_sent = Column(Integer, default=0)
    words_spoken = Column(Integer, default=0)
    avg_pronunciation_score = Column(Float, nullable=True)
    avg_grammar_score = Column(Float, nullable=True)
    avg_fluency_score = Column(Float, nullable=True)
    
    # AI feedback
    session_summary = Column(Text, nullable=True)
    strengths = Column(JSON, nullable=True)
    areas_to_improve = Column(JSON, nullable=True)
    recommended_topics = Column(JSON, nullable=True)
    
    # Relationships
    room = relationship("AIVirtualRoom", back_populates="sessions")
    user = relationship("User")


class ConversationTopic(Base):
    """Pre-defined conversation topics for AI practice"""
    __tablename__ = "conversation_topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String, nullable=False)  # beginner, intermediate, advanced
    category = Column(String, nullable=True)  # travel, business, daily_life, etc.
    keywords = Column(JSON, nullable=True)  # Key vocabulary
    sample_questions = Column(JSON, nullable=True)  # Questions AI might ask
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


