"""
Exam Monitoring Model
Stores monitoring alerts and warnings with captured images during exams
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ExamMonitoringAlert(Base):
    """
    Stores monitoring alerts and warnings with captured images
    """
    __tablename__ = "exam_monitoring_alerts"

    id = Column(Integer, primary_key=True, index=True)
    
    # References
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=True, index=True)
    exam_id = Column(Integer, ForeignKey("exam_assessments.id", ondelete="CASCADE"), nullable=True, index=True)
    submission_id = Column(Integer, ForeignKey("exercise_submissions.id", ondelete="CASCADE"), nullable=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Alert type
    alert_type = Column(String, nullable=False)  # 'warning' or 'alert'
    severity = Column(String, default="medium")  # 'low', 'medium', 'high', 'critical'
    
    # Image data
    image_url = Column(String, nullable=False)  # Path to saved image
    image_base64 = Column(Text, nullable=True)  # Optional: store base64 for quick access
    
    # Alert details
    message = Column(Text, nullable=True)  # Alert/warning message
    face_count = Column(Integer, nullable=True)  # Number of faces detected
    verified = Column(Boolean, nullable=True)  # Whether face was verified
    similarity = Column(String, nullable=True)  # Similarity score if available
    confidence = Column(String, nullable=True)  # Confidence score if available
    
    # Metadata
    consecutive_failures = Column(Integer, default=0)  # Number of consecutive failures
    reviewed = Column(Boolean, default=False)  # Whether teacher has reviewed
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)  # Teacher's review notes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    
    def __repr__(self) -> str:
        return f"<ExamMonitoringAlert(id={self.id}, type={self.alert_type}, student_id={self.student_id})>"

