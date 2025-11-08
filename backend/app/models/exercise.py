from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, default="assignment", nullable=False, index=True)  # assignment | quiz | test - INDEXED
    skill_type = Column(String, nullable=True, index=True)  # reading | writing | listening | speaking | mixed - INDEXED
    max_score = Column(Float, nullable=True)  # Changed to Float for decimal scores
    due_at = Column(DateTime(timezone=True), nullable=True, index=True)  # INDEXED for sorting
    duration = Column(Integer, nullable=True)  # Time limit in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # INDEXED for date queries
    enable_ai_grading = Column(Boolean, default=False)  # Enable AI grading for this exercise
    rubrics = Column(JSON, nullable=True)  # Rubrics for grading (4 skills)
    content = Column(JSON, nullable=True)  # Exercise content/questions in JSON format
    is_active = Column(Boolean, nullable=False, server_default="true", default=True)
    is_archived = Column(Boolean, nullable=False, server_default="false", default=False)

    classroom = relationship("Classroom", back_populates="exercises")
    lesson = relationship("Lesson", back_populates="exercises")
    submissions = relationship("Submission", back_populates="exercise", cascade="all, delete-orphan")
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_exercise_class_skill', 'class_id', 'skill_type'),
        Index('idx_exercise_class_created', 'class_id', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<Exercise(id={self.id}, title={self.title}, type={self.type})>"

