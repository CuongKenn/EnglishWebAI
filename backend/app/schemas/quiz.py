"""
Pydantic schemas for Quiz API
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# Quiz Room Schemas
class QuizRoomBase(BaseModel):
    title: str
    description: Optional[str] = None
    topic: str = Field(..., description="grammar, vocabulary, listening")
    difficulty: str = Field(default="medium", description="easy, medium, hard")
    time_limit: int = Field(default=30, description="seconds per question")
    total_questions: int = Field(default=10)


class QuizRoomCreate(QuizRoomBase):
    pass


class QuizRoomResponse(QuizRoomBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# Quiz Question Schemas
class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: str = Field(..., description="multiple_choice, fill_blank, listening")
    options: Optional[List[str]] = None
    correct_answer: str
    audio_url: Optional[str] = None
    explanation: Optional[str] = None
    points: int = 10
    order: int = 0


class QuizQuestionCreate(QuizQuestionBase):
    pass


class QuizQuestionResponse(QuizQuestionBase):
    id: int
    room_id: int

    class Config:
        from_attributes = True


# Quiz Session Schemas
class QuizSessionStart(BaseModel):
    room_id: int


class QuizAnswerSubmit(BaseModel):
    question_id: int
    student_answer: str
    time_taken: int = 0


class QuizSessionResponse(BaseModel):
    id: int
    room_id: int
    student_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    total_score: float
    correct_answers: int
    total_questions: int
    time_taken: int

    class Config:
        from_attributes = True


class QuizAnswerResponse(BaseModel):
    id: int
    question_id: int
    student_answer: str
    is_correct: bool
    points_earned: float
    time_taken: int
    answered_at: datetime

    class Config:
        from_attributes = True


class QuizLeaderboardEntry(BaseModel):
    student_id: int
    student_name: str
    total_score: float
    correct_answers: int
    time_taken: int
    rank: int


class QuizRoomDetail(QuizRoomResponse):
    questions: List[QuizQuestionResponse]
    total_participants: int = 0
