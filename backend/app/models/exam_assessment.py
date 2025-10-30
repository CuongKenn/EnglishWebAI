"""
Exam Assessment Model
For midterm and final exams imported from Word documents
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class ExamType(str, enum.Enum):
    """Exam type enumeration"""
    MIDTERM = "midterm"
    FINAL = "final"
    QUIZ = "quiz"
    PRACTICE = "practice"


class ExamAssessment(Base):
    """
    Exam Assessment Model
    Stores midterm/final exams imported from Word documents
    """
    __tablename__ = "exam_assessments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Exam info
    exam_type = Column(String, nullable=False)  # midterm, final, quiz, practice
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Original file info
    original_filename = Column(String, nullable=True)
    file_path = Column(String, nullable=True)  # Path to uploaded Word file
    
    # Exam content (parsed by AI)
    content = Column(JSON, nullable=False)  # Structured exam content
    answer_key = Column(JSON, nullable=True)  # Answer key
    rubrics = Column(JSON, nullable=True)  # Grading rubrics
    
    # Exam settings
    total_points = Column(Float, default=10.0)
    duration = Column(Integer, nullable=True)  # Duration in minutes
    
    # Scheduling
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    ai_parsed = Column(Boolean, default=True)  # Whether content was parsed by AI
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)  # Whether students can see it
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    classroom = relationship("Classroom", back_populates="exam_assessments")
    teacher = relationship("User", foreign_keys=[teacher_id])
    submissions = relationship("ExamSubmission", back_populates="exam", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ExamAssessment(id={self.id}, type={self.exam_type}, title={self.title})>"


class ExamSubmission(Base):
    """
    Student submissions for exam assessments
    """
    __tablename__ = "exam_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exam_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Submission data
    answers = Column(JSON, nullable=False)  # Student's answers
    
    # Grading
    score = Column(Float, nullable=True)
    ai_score = Column(Float, nullable=True)
    rubrics_scores = Column(JSON, nullable=True)  # Detailed scores by rubrics
    
    # Feedback
    feedback = Column(Text, nullable=True)  # Teacher feedback
    ai_feedback = Column(Text, nullable=True)  # AI-generated feedback
    error_analysis = Column(JSON, nullable=True)  # Detailed error analysis
    
    # Status
    status = Column(String, default="in_progress")  # in_progress, submitted, graded
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    exam = relationship("ExamAssessment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])

    def __repr__(self) -> str:
        return f"<ExamSubmission(id={self.id}, exam_id={self.exam_id}, student_id={self.student_id}, status={self.status})>"

