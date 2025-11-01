from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Classroom(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Admin UI fields
    grade = Column(Integer, nullable=True)  # 1..12
    skill = Column(String, nullable=True)   # listening|speaking|reading|writing
    max_students = Column(Integer, nullable=True)
    schedule = Column(String, nullable=True)
    status = Column(String, default="active", nullable=False)  # active | inactive
    is_active = Column(Boolean, server_default="1", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    enrollments = relationship("Enrollment", back_populates="classroom", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="classroom", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="classroom", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="classroom", cascade="all, delete-orphan")
    discussions = relationship("DiscussionThread", back_populates="classroom", cascade="all, delete-orphan")
    exam_assessments = relationship("ExamAssessment", back_populates="classroom", cascade="all, delete-orphan")
    weekly_assessments = relationship("WeeklyAssessment", back_populates="classroom", cascade="all, delete-orphan")
    enhanced_weekly_assessments = relationship("EnhancedWeeklyAssessment", back_populates="classroom", cascade="all, delete-orphan")
    enhanced_weekly_assessments = relationship("EnhancedWeeklyAssessment", back_populates="classroom", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Classroom(id={self.id}, name={self.name}, code={self.code})>"
