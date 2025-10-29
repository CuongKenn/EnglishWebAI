from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class WeeklyAssessment(Base):
    """
    Weekly Skill Assessment Model
    Stores weekly assessments for each skill in a class
    """
    __tablename__ = "weekly_assessments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)  # Tuần thứ mấy
    skill_type = Column(String, nullable=False)  # reading, writing, listening, speaking
    
    # Assessment info
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    worksheet_id = Column(Integer, ForeignKey("worksheets.id", ondelete="SET NULL"), nullable=True)
    
    # Content
    content = Column(JSON, nullable=True)  # Assessment questions/content
    rubrics = Column(JSON, nullable=True)  # Grading rubrics
    max_score = Column(Float, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in minutes
    
    # Metadata
    ai_generated = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<WeeklyAssessment(id={self.id}, class_id={self.class_id}, week={self.week_number}, skill={self.skill_type})>"

