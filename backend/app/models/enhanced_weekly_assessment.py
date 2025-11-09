"""
Enhanced Weekly Assessment Model with 4-Skills Integration
Supports both individual skill assessments and comprehensive 4-skill exams
"""
import enum

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AssessmentType(str, enum.Enum):
    """Assessment type enumeration"""
    WEEKLY_SINGLE = "weekly_single"      # Weekly assessment - single skill
    WEEKLY_INTEGRATED = "weekly_integrated"  # Weekly assessment - 4 skills combined
    MIDTERM = "midterm"                  # Midterm exam - 4 skills
    FINAL = "final"                      # Final exam - 4 skills
    PRACTICE = "practice"                # Practice test


class SkillType(str, enum.Enum):
    """Skill type enumeration"""
    LISTENING = "listening"
    READING = "reading"
    WRITING = "writing"
    SPEAKING = "speaking"
    INTEGRATED = "integrated"  # For 4-skill combined assessments


class EnhancedWeeklyAssessment(Base):
    """
    Enhanced Weekly Assessment Model
    Supports both single-skill weekly assessments and comprehensive 4-skill exams
    """
    __tablename__ = "enhanced_weekly_assessments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Assessment categorization
    assessment_type = Column(String, nullable=False)  # weekly_single, weekly_integrated, midterm, final, practice
    week_number = Column(Integer, nullable=True)  # For weekly assessments
    semester_period = Column(String, nullable=True)  # 'midterm', 'final' for exams

    # Content structure - supports both single and multi-skill
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # 4-Skills Content Structure
    listening_content = Column(JSON, nullable=True)  # Listening questions/tasks
    reading_content = Column(JSON, nullable=True)    # Reading passages/questions
    writing_content = Column(JSON, nullable=True)    # Writing prompts/tasks
    speaking_content = Column(JSON, nullable=True)   # Speaking tasks/prompts

    # Scoring Configuration
    listening_max_score = Column(Float, nullable=True, default=25.0)
    reading_max_score = Column(Float, nullable=True, default=25.0)
    writing_max_score = Column(Float, nullable=True, default=25.0)
    speaking_max_score = Column(Float, nullable=True, default=25.0)
    total_max_score = Column(Float, nullable=False, default=100.0)

    # Rubrics for each skill
    listening_rubrics = Column(JSON, nullable=True)
    reading_rubrics = Column(JSON, nullable=True)
    writing_rubrics = Column(JSON, nullable=True)
    speaking_rubrics = Column(JSON, nullable=True)

    # Timing
    listening_duration = Column(Integer, nullable=True)  # minutes
    reading_duration = Column(Integer, nullable=True)
    writing_duration = Column(Integer, nullable=True)
    speaking_duration = Column(Integer, nullable=True)
    total_duration = Column(Integer, nullable=True)

    # Settings
    skills_enabled = Column(JSON, nullable=False)  # {"listening": true, "reading": false, ...}
    is_active = Column(Boolean, default=True)
    ai_generated = Column(Boolean, default=False)
    auto_grade_enabled = Column(Boolean, default=True)

    # Scheduling
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    classroom = relationship("Classroom", back_populates="enhanced_weekly_assessments")
    teacher = relationship("User", foreign_keys=[teacher_id])
    submissions = relationship("EnhancedWeeklySubmission", back_populates="assessment", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<EnhancedWeeklyAssessment(id={self.id}, type={self.assessment_type}, week={self.week_number})>"


class EnhancedWeeklySubmission(Base):
    """
    Enhanced submission model supporting 4-skill assessments
    """
    __tablename__ = "enhanced_weekly_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("enhanced_weekly_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Answers for each skill
    listening_answers = Column(JSON, nullable=True)
    reading_answers = Column(JSON, nullable=True)
    writing_answers = Column(JSON, nullable=True)
    speaking_answers = Column(JSON, nullable=True)  # Can include audio file paths

    # Scores for each skill
    listening_score = Column(Float, nullable=True)
    reading_score = Column(Float, nullable=True)
    writing_score = Column(Float, nullable=True)
    speaking_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=True)

    # AI Scores
    listening_ai_score = Column(Float, nullable=True)
    reading_ai_score = Column(Float, nullable=True)
    writing_ai_score = Column(Float, nullable=True)
    speaking_ai_score = Column(Float, nullable=True)
    total_ai_score = Column(Float, nullable=True)

    # Detailed scoring by rubrics
    listening_rubric_scores = Column(JSON, nullable=True)
    reading_rubric_scores = Column(JSON, nullable=True)
    writing_rubric_scores = Column(JSON, nullable=True)
    speaking_rubric_scores = Column(JSON, nullable=True)

    # Feedback for each skill
    listening_feedback = Column(Text, nullable=True)
    reading_feedback = Column(Text, nullable=True)
    writing_feedback = Column(Text, nullable=True)
    speaking_feedback = Column(Text, nullable=True)
    overall_feedback = Column(Text, nullable=True)

    # AI Feedback
    listening_ai_feedback = Column(Text, nullable=True)
    reading_ai_feedback = Column(Text, nullable=True)
    writing_ai_feedback = Column(Text, nullable=True)
    speaking_ai_feedback = Column(Text, nullable=True)
    overall_ai_feedback = Column(Text, nullable=True)

    # Error Analysis for each skill
    listening_error_analysis = Column(JSON, nullable=True)
    reading_error_analysis = Column(JSON, nullable=True)
    writing_error_analysis = Column(JSON, nullable=True)
    speaking_error_analysis = Column(JSON, nullable=True)

    # Status tracking
    status = Column(String, default="not_started")  # not_started, in_progress, submitted, graded
    submission_progress = Column(JSON, nullable=True)  # Track which skills completed

    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)

    # Time spent on each skill (in minutes)
    listening_time_spent = Column(Integer, nullable=True)
    reading_time_spent = Column(Integer, nullable=True)
    writing_time_spent = Column(Integer, nullable=True)
    speaking_time_spent = Column(Integer, nullable=True)
    total_time_spent = Column(Integer, nullable=True)

    # Relationships
    assessment = relationship("EnhancedWeeklyAssessment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])

    def __repr__(self) -> str:
        return f"<EnhancedWeeklySubmission(id={self.id}, assessment_id={self.assessment_id}, student_id={self.student_id}, status={self.status})>"
