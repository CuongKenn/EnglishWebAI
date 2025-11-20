"""
Video Lesson Model
Stores generated video lessons from PowerPoint
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class VideoLesson(Base):
    __tablename__ = "video_lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Files
    ppt_file_path = Column(String(500), nullable=True)  # Original PPT
    video_url = Column(String(500), nullable=True)  # Generated video
    thumbnail_url = Column(String(500), nullable=True)  # Video thumbnail
    
    # Metadata
    slides_count = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Video duration
    
    # Generation settings
    voice_type = Column(String(100), default="vi-VN-HoaiMyNeural")
    language = Column(String(10), default="vi")
    
    # Status tracking
    status = Column(
        String(50),
        default="pending",
        nullable=False
    )  # pending, processing, completed, failed
    
    error_message = Column(Text, nullable=True)  # Error details if failed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="video_lessons", foreign_keys=[lesson_id])
    teacher = relationship("User", back_populates="video_lessons", foreign_keys=[teacher_id])
    
    def __repr__(self):
        return f"<VideoLesson(id={self.id}, title='{self.title}', status='{self.status}')>"
