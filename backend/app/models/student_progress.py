"""
Student Progress Snapshot Model
Tracks student progress over time for analytics and reporting
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentProgressSnapshot(Base):
    """
    Snapshot of student progress at a specific point in time
    Used for tracking progress over time and generating charts
    """
    __tablename__ = "student_progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True, index=True)
    
    # Time period
    snapshot_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    period_type = Column(String, default="week")  # week, month, semester
    period_label = Column(String)  # e.g., "Week 1", "Month 10"
    
    # Overall metrics
    total_submissions = Column(Integer, default=0)
    graded_submissions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    
    # Skill-specific scores (0-100 scale)
    reading_score = Column(Float, default=0.0)
    writing_score = Column(Float, default=0.0)
    listening_score = Column(Float, default=0.0)
    speaking_score = Column(Float, default=0.0)
    
    # Counts per skill
    reading_count = Column(Integer, default=0)
    writing_count = Column(Integer, default=0)
    listening_count = Column(Integer, default=0)
    speaking_count = Column(Integer, default=0)
    
    # Trend indicator
    trend = Column(String, default="stable")  # improving, stable, declining
    
    # Additional metadata
    attendance_rate = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)  # For flexible additional data (renamed from metadata)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    classroom = relationship("Classroom", foreign_keys=[class_id])

    def __repr__(self):
        return f"<StudentProgressSnapshot(id={self.id}, student_id={self.student_id}, date={self.snapshot_date})>"


class StudentSkillProgress(Base):
    """
    Detailed skill progress tracking with timeline
    Allows granular tracking of each skill over time
    """
    __tablename__ = "student_skill_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_type = Column(String, nullable=False)  # reading, writing, listening, speaking
    
    # Scoring
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    
    # Context
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=True)
    submission_id = Column(Integer, ForeignKey("exercise_submissions.id"), nullable=True)
    assessment_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Details
    strengths = Column(JSON, nullable=True)  # List of strength areas
    weaknesses = Column(JSON, nullable=True)  # List of areas needing improvement
    teacher_notes = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    exercise = relationship("Exercise", foreign_keys=[exercise_id])
    submission = relationship("Submission", foreign_keys=[submission_id])

    def __repr__(self):
        return f"<StudentSkillProgress(id={self.id}, student_id={self.student_id}, skill={self.skill_type})>"

