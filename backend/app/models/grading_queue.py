from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class GradingQueue(Base):
    """
    Queue for managing auto-grading tasks.
    Submissions are added to this queue and processed by background workers.
    """
    __tablename__ = "grading_queue"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("exercise_submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)

    # Queue status: pending, processing, completed, failed
    status = Column(String(50), default="pending", nullable=False, index=True)

    # Priority: higher = process first (exam=100, exercise=50, homework=10)
    priority = Column(Integer, default=0, nullable=False, index=True)

    # Processing info
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    submission = relationship("Submission", backref="queue_item")
    exercise = relationship("Exercise")
    student = relationship("User", foreign_keys=[student_id])

    # Composite indexes for queue processing
    __table_args__ = (
        # Main index for fetching next pending item (status, priority DESC, created_at)
        Index('idx_queue_next_pending', 'status', 'priority', 'created_at'),
        # Index for monitoring/admin
        Index('idx_queue_student', 'student_id', 'status'),
        Index('idx_queue_exercise', 'exercise_id', 'status'),
    )

    def __repr__(self) -> str:
        return f"<GradingQueue(id={self.id}, submission_id={self.submission_id}, status={self.status}, priority={self.priority})>"


