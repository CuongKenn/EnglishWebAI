from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Submission(Base):
    __tablename__ = "exercise_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_text = Column(Text, nullable=True)
    content_url = Column(String, nullable=True)  # For file uploads or audio recordings
    answers = Column(JSON, nullable=True)  # Student's answers to questions {question_id: answer_value}
    score = Column(Float, nullable=True, index=True)  # Changed to Float for decimal scores - INDEXED for analytics
    feedback = Column(Text, nullable=True)  # Teacher's final feedback
    ai_feedback = Column(Text, nullable=True)  # AI-generated feedback
    ai_score = Column(Float, nullable=True)  # AI-generated score
    rubrics_scores = Column(JSON, nullable=True)  # Detailed scores for each skill (reading, writing, listening, speaking)
    error_analysis = Column(JSON, nullable=True)  # Detailed error analysis from AI
    status = Column(String, default="submitted", nullable=False, index=True)  # submitted | graded | late | pending_review - INDEXED
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # INDEXED for date queries
    graded_at = Column(DateTime(timezone=True), nullable=True, index=True)  # INDEXED for filtering graded submissions
    ai_graded_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, nullable=True)  # Time limit in minutes

    exercise = relationship("Exercise", back_populates="submissions")
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_submission_student_exercise', 'student_id', 'exercise_id'),
        Index('idx_submission_graded', 'graded_at', 'score'),
        Index('idx_submission_date_range', 'submitted_at', 'exercise_id'),
    )

    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, exercise_id={self.exercise_id}, student_id={self.student_id})>"

