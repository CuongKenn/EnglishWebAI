"""
Quiz models for Solo (Learning) mode
Supports grammar, vocabulary, and listening questions with scoring
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QuizRoom(Base):
    """Quiz room where students compete"""
    __tablename__ = "quiz_rooms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    topic = Column(String, nullable=False)  # grammar, vocabulary, listening
    difficulty = Column(String, nullable=False, default="medium")  # easy, medium, hard
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    time_limit = Column(Integer, default=30)  # seconds per question
    total_questions = Column(Integer, default=10)
    
    # Relationships
    questions = relationship("QuizQuestion", back_populates="room", cascade="all, delete-orphan")
    sessions = relationship("QuizSession", back_populates="room", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class QuizQuestion(Base):
    """Individual quiz questions"""
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("quiz_rooms.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # multiple_choice, fill_blank, listening
    options = Column(JSON, nullable=True)  # For multiple choice: ["option1", "option2", ...]
    correct_answer = Column(String, nullable=False)
    audio_url = Column(String, nullable=True)  # For listening questions
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=10)
    order = Column(Integer, default=0)

    # Relationship
    room = relationship("QuizRoom", back_populates="questions")


class QuizSession(Base):
    """Student's quiz session"""
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("quiz_rooms.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_score = Column(Float, default=0.0)
    correct_answers = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)  # seconds

    # Relationships
    room = relationship("QuizRoom", back_populates="sessions")
    student = relationship("User", foreign_keys=[student_id])
    answers = relationship("QuizAnswer", back_populates="session", cascade="all, delete-orphan")


class QuizAnswer(Base):
    """Student's answer to a question"""
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    student_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    points_earned = Column(Float, default=0.0)
    time_taken = Column(Integer, default=0)  # seconds
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("QuizSession", back_populates="answers")
    question = relationship("QuizQuestion")
