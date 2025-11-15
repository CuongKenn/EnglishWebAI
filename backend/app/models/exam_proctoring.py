from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExamProctoringLog(Base):
    """Log tất cả các events giám sát trong quá trình thi"""
    __tablename__ = "exam_proctoring_logs"

    id = Column(Integer, primary_key=True, index=True)
    # Support both course_submissions and exercise submissions
    submission_id = Column(Integer, ForeignKey("course_submissions.id"), nullable=True, index=True)
    exercise_submission_id = Column(Integer, ForeignKey("exercise_submissions.id"), nullable=True, index=True)
    session_token = Column(String(64), index=True)

    # Event information
    event_type = Column(String(50), nullable=False)  # identity_check, face_lost, gaze_violation, etc.
    severity = Column(String(20), nullable=False)  # info, warning, critical
    message = Column(Text, nullable=False)

    # Technical details
    confidence_score = Column(Float, nullable=True)  # Face similarity score, gaze confidence, etc.
    event_metadata = Column(Text, nullable=True)  # JSON string for additional data

    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    submission = relationship("CourseSubmission", back_populates="proctoring_logs")

    def __repr__(self):
        return f"<ExamProctoringLog(id={self.id}, event_type={self.event_type}, severity={self.severity})>"


class ExamMonitoringSession(Base):
    """Quản lý active monitoring sessions"""
    __tablename__ = "exam_monitoring_sessions"

    id = Column(Integer, primary_key=True, index=True)
    # Support both course_submissions and exercise submissions
    submission_id = Column(Integer, ForeignKey("course_submissions.id"), nullable=True, index=True)
    exercise_submission_id = Column(Integer, ForeignKey("exercise_submissions.id"), nullable=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exam_id = Column(Integer, nullable=False, index=True)

    # Session token for authentication
    session_token = Column(String(64), unique=True, nullable=False, index=True)

    # Session status
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Violation tracking
    warning_count = Column(Integer, default=0, nullable=False)
    critical_count = Column(Integer, default=0, nullable=False)

    # Last identity check
    last_identity_check = Column(DateTime, nullable=True)

    # Auto-submit flag
    auto_submitted = Column(Boolean, default=False, nullable=False)
    auto_submit_reason = Column(Text, nullable=True)

    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    submission = relationship("CourseSubmission", back_populates="monitoring_session")
    student = relationship("User", foreign_keys=[student_id])

    def __repr__(self):
        return f"<ExamMonitoringSession(id={self.id}, submission_id={self.submission_id}, is_active={self.is_active})>"
