"""
Student Face Data Model for Exam Verification
Stores face embeddings and metadata for identity verification during exams
"""

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class StudentFaceData(Base):
    """
    Store student face embeddings for exam verification
    Each student can have multiple face enrollments (for better accuracy)
    """
    __tablename__ = "student_face_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Face embedding (512-dimensional vector from CurricularFace)
    embedding = Column(JSON, nullable=False)  # Stored as list of floats

    # Metadata
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)  # Can deactivate old enrollments

    # Quality metrics (optional, for future improvement)
    confidence_score = Column(String, nullable=True)  # e.g., "95.3%"
    image_quality = Column(String, nullable=True)  # "good", "fair", "poor"

    # Relationship
    # user = relationship("User", back_populates="face_data")

    def __repr__(self):
        return f"<StudentFaceData(id={self.id}, user_id={self.user_id}, active={self.is_active})>"
