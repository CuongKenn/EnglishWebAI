from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=True)
    session_number = Column(Integer, nullable=True)  # Buổi học thứ mấy
    lesson_date = Column(Date, nullable=True)  # Ngày học
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    classroom = relationship("Classroom", back_populates="lessons")
    materials = relationship("Material", back_populates="lesson", cascade="all, delete-orphan")
    exercises = relationship("Exercise", back_populates="lesson", cascade="all, delete-orphan")
    video_lessons = relationship("VideoLesson", back_populates="lesson", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Lesson(id={self.id}, title={self.title})>"

