from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
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
    score = Column(Float, nullable=True)  # Changed to Float for decimal scores
    feedback = Column(Text, nullable=True)  # Teacher's final feedback
    ai_feedback = Column(Text, nullable=True)  # AI-generated feedback
    ai_score = Column(Float, nullable=True)  # AI-generated score
    rubrics_scores = Column(JSON, nullable=True)  # Detailed scores for each skill (reading, writing, listening, speaking)
    error_analysis = Column(JSON, nullable=True)  # Detailed error analysis from AI
    status = Column(String, default="submitted", nullable=False)  # submitted | graded | late | pending_review
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)
    ai_graded_at = Column(DateTime(timezone=True), nullable=True)

    exercise = relationship("Exercise", back_populates="submissions")

    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, exercise_id={self.exercise_id}, student_id={self.student_id})>"

