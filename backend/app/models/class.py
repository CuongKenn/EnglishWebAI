from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class Subject(str, enum.Enum):
    MATH = "Toán"
    ENGLISH = "Tiếng Anh"
    SCIENCE = "Khoa học"
    HISTORY = "Lịch sử"
    LITERATURE = "Ngữ văn"
    PHYSICS = "Vật lý"
    CHEMISTRY = "Hóa học"
    BIOLOGY = "Sinh học"

class Grade(str, enum.Enum):
    PRESCHOOL = "Mẫu giáo"
    GRADE_1 = "Lớp 1"
    GRADE_2 = "Lớp 2"
    GRADE_3 = "Lớp 3"
    GRADE_4 = "Lớp 4"
    GRADE_5 = "Lớp 5"
    GRADE_6 = "Lớp 6"
    GRADE_7 = "Lớp 7"
    GRADE_8 = "Lớp 8"
    GRADE_9 = "Lớp 9"
    GRADE_10 = "Lớp 10"
    GRADE_11 = "Lớp 11"
    GRADE_12 = "Lớp 12"

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    subject = Column(Enum(Subject), nullable=False)
    grade = Column(Enum(Grade), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule = Column(String)  # e.g., "Thứ 2, 4, 6 - 8:00-9:00"
    max_students = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    image_emoji = Column(String, default="📚")
    color = Column(String, default="blue")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    enrollments = relationship("ClassEnrollment", back_populates="class_obj")

    def __repr__(self):
        return f"<Class(id={self.id}, name={self.name}, subject={self.subject})>"

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    class_obj = relationship("Class", back_populates="enrollments")
    student = relationship("User")

    def __repr__(self):
        return f"<ClassEnrollment(class_id={self.class_id}, student_id={self.student_id})>"
