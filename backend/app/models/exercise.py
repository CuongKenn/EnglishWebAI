from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
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
    type = Column(String, default="assignment", nullable=False)  # assignment | quiz | test
    skill_type = Column(String, nullable=True)  # reading | writing | listening | speaking | mixed
    max_score = Column(Float, nullable=True)  # Changed to Float for decimal scores
    due_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    enable_ai_grading = Column(Boolean, default=False)  # Enable AI grading for this exercise
    rubrics = Column(JSON, nullable=True)  # Rubrics for grading (4 skills)
    content = Column(JSON, nullable=True)  # Exercise content/questions in JSON format

    classroom = relationship("Classroom", back_populates="exercises")
    lesson = relationship("Lesson", back_populates="exercises")
    submissions = relationship("Submission", back_populates="exercise", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Exercise(id={self.id}, title={self.title}, type={self.type})>"

