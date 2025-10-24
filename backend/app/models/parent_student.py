from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ParentStudent(Base):
    """Parent-Student relationship table"""
    __tablename__ = "parent_students"
    __table_args__ = (UniqueConstraint("parent_id", "student_id", name="uq_parent_student"),)

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)  # Whether student confirmed the link
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    parent = relationship("User", foreign_keys=[parent_id], backref="children_links")
    student = relationship("User", foreign_keys=[student_id], backref="parent_links")

    def __repr__(self) -> str:
        return f"<ParentStudent(parent_id={self.parent_id}, student_id={self.student_id}, verified={self.is_verified})>"
