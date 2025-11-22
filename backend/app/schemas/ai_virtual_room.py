"""
Pydantic schemas for AI Virtual Room API
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


# AI Virtual Room Schemas
class AIVirtualRoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    room_type: str  # speaking, pronunciation, conversation, group_chat
    level: str  # beginner, intermediate, advanced
    topic: Optional[str] = None
    max_participants: int = 6
    enable_pronunciation_scoring: bool = True
    enable_grammar_correction: bool = True
    enable_vocabulary_hints: bool = True
    session_duration: int = 30


class AIVirtualRoomCreate(AIVirtualRoomBase):
    ai_teacher_persona: Optional[Dict[str, Any]] = None
    background_image: Optional[str] = None


class AIVirtualRoomResponse(AIVirtualRoomBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    is_active: bool
    room_code: str
    background_image: Optional[str]
    ai_teacher_persona: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# AI Room Participant Schemas
class AIRoomParticipantResponse(BaseModel):
    id: int
    user_id: int
    username: str
    nickname: Optional[str]
    joined_at: datetime
    left_at: Optional[datetime]
    is_online: bool
    is_speaking: bool
    is_audio_on: bool
    total_speaking_time: int
    pronunciation_score: Optional[float]
    grammar_score: Optional[float]
    fluency_score: Optional[float]

    class Config:
        from_attributes = True


class AIRoomParticipantUpdate(BaseModel):
    nickname: Optional[str] = None
    is_speaking: Optional[bool] = None
    is_audio_on: Optional[bool] = None


# AI Room Message Schemas
class AIRoomMessageCreate(BaseModel):
    message_type: str = "text"  # text, voice, correction, suggestion
    content: str
    voice_url: Optional[str] = None
    transcription: Optional[str] = None


class AIRoomMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: Optional[int]
    sender_type: str  # user, ai_teacher, system
    message_type: str
    content: str
    voice_url: Optional[str]
    created_at: datetime
    transcription: Optional[str]
    pronunciation_score: Optional[float]
    grammar_issues: Optional[List[Dict[str, Any]]]
    suggestions: Optional[List[Dict[str, Any]]]
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


# AI Room Session Schemas
class AIRoomSessionResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    duration: int
    messages_sent: int
    words_spoken: int
    avg_pronunciation_score: Optional[float]
    avg_grammar_score: Optional[float]
    avg_fluency_score: Optional[float]
    session_summary: Optional[str]
    strengths: Optional[List[str]]
    areas_to_improve: Optional[List[str]]
    recommended_topics: Optional[List[str]]

    class Config:
        from_attributes = True


class AIRoomSessionCreate(BaseModel):
    room_id: int


class AIRoomSessionEnd(BaseModel):
    session_id: int


# Join Room Schema
class AIRoomJoin(BaseModel):
    room_code: str
    nickname: Optional[str] = None


# Room Detail Schema
class AIVirtualRoomDetail(AIVirtualRoomResponse):
    participants: List[AIRoomParticipantResponse]
    participant_count: int
    active_session: Optional[AIRoomSessionResponse] = None


# Conversation Topic Schemas
class ConversationTopicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    level: str
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    sample_questions: Optional[List[str]] = None


class ConversationTopicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    level: str
    category: Optional[str]
    keywords: Optional[List[str]]
    sample_questions: Optional[List[str]]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# AI Request/Response Schemas
class AIConversationRequest(BaseModel):
    message: str
    room_id: int
    conversation_history: Optional[List[Dict[str, str]]] = []


class AIConversationResponse(BaseModel):
    message: str
    suggestions: Optional[List[str]] = None
    grammar_corrections: Optional[List[Dict[str, Any]]] = None
    vocabulary_hints: Optional[List[Dict[str, Any]]] = None


class PronunciationAnalysisRequest(BaseModel):
    audio_url: str
    transcript: Optional[str] = None


class PronunciationAnalysisResponse(BaseModel):
    transcription: str
    pronunciation_score: float
    fluency_score: float
    word_scores: List[Dict[str, Any]]
    suggestions: List[str]


