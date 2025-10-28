from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class LessonPlan(Base):
    """
    Giáo án - Lesson Plan Model
    Bám sát Chương trình Giáo dục Phổ thông môn Ngoại ngữ 2018
    """
    __tablename__ = "lesson_plans"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Thông tin cơ bản
    title = Column(String, nullable=False, index=True)  # Tên bài học
    subject = Column(String, default="English", nullable=False)  # Môn học (mặc định Tiếng Anh)
    grade = Column(Integer, nullable=False, index=True)  # Khối lớp (1-12)
    unit = Column(String, nullable=True)  # Unit/Bài (VD: Unit 7 - Technology)
    lesson_number = Column(String, nullable=True)  # Tiết (VD: Lesson 1, 2, 3)
    duration = Column(Integer, nullable=True)  # Thời lượng (phút)
    
    # Mục tiêu bài học (JSON format)
    objectives = Column(JSON, nullable=True)  
    # {
    #   "knowledge": ["...", "..."],  # Kiến thức
    #   "skills": ["...", "..."],     # Kỹ năng
    #   "competencies": ["...", "..."],  # Năng lực
    #   "qualities": ["...", "..."]   # Phẩm chất
    # }
    
    # Thiết bị và học liệu
    teaching_aids = Column(JSON, nullable=True)  
    # ["Projector", "Flashcards", "Audio CD", "Textbook", "Worksheets"]
    
    # Tiến trình dạy học (JSON format)
    activities = Column(JSON, nullable=True)
    # {
    #   "warm_up": {...},      # Hoạt động 1: Khởi động
    #   "presentation": {...}, # Hoạt động 2: Hình thành kiến thức
    #   "practice": {...},     # Hoạt động 3: Luyện tập
    #   "production": {...}    # Hoạt động 4: Vận dụng
    # }
    
    # Nội dung chi tiết (full content)
    content = Column(Text, nullable=True)
    
    # Ghi chú và đánh giá
    notes = Column(Text, nullable=True)
    homework = Column(Text, nullable=True)  # Bài tập về nhà
    
    # AI Generation metadata
    ai_generated = Column(Integer, default=0)  # 0: Manual, 1: AI-generated
    ai_prompt = Column(Text, nullable=True)  # Prompt used for AI generation
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self) -> str:
        return f"<LessonPlan(id={self.id}, title={self.title}, grade={self.grade})>"

