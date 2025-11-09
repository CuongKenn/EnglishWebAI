from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Worksheet(Base):
    """
    Phiếu học tập - Worksheet Model
    Hỗ trợ nhiều dạng phiếu học tập cho học sinh
    """
    __tablename__ = "worksheets"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Thông tin cơ bản
    title = Column(String, nullable=False, index=True)  # Tên phiếu học tập
    subject = Column(String, default="English", nullable=False)  # Môn học
    grade = Column(Integer, nullable=False, index=True)  # Khối lớp (1-12)
    unit = Column(String, nullable=True)  # Unit/Chủ đề

    # Loại phiếu học tập
    worksheet_type = Column(String, nullable=False, index=True)
    # Types:
    # - "multiple_choice": Trắc nghiệm
    # - "essay": Tự luận
    # - "fill_in_blank": Điền khuyết
    # - "topic_based": Theo chủ đề
    # - "self_study": Hướng dẫn tự học
    # - "situational": Bài tập tình huống
    # - "mixed": Kết hợp nhiều dạng

    # Kỹ năng tập trung
    skill_focus = Column(String, nullable=True, index=True)
    # - "listening": Nghe
    # - "speaking": Nói
    # - "reading": Đọc
    # - "writing": Viết
    # - "grammar": Ngữ pháp
    # - "vocabulary": Từ vựng
    # - "pronunciation": Phát âm

    # Độ khó
    difficulty_level = Column(String, nullable=True)
    # - "easy": Dễ
    # - "medium": Trung bình
    # - "hard": Khó

    # Nội dung phiếu học tập (JSON format)
    content = Column(JSON, nullable=True)
    # Structure depends on worksheet_type
    # Example for multiple_choice:
    # {
    #   "instructions": "Choose the correct answer",
    #   "questions": [
    #     {
    #       "question": "What is...?",
    #       "options": ["A", "B", "C", "D"],
    #       "correct_answer": "B",
    #       "points": 1
    #     }
    #   ]
    # }

    # Hướng dẫn cho giáo viên
    teacher_notes = Column(Text, nullable=True)

    # Đáp án chi tiết
    answer_key = Column(JSON, nullable=True)

    # Thời gian làm bài (phút)
    duration = Column(Integer, nullable=True)

    # Tổng điểm
    total_points = Column(Integer, nullable=True)

    # AI Generation metadata
    ai_generated = Column(Integer, default=0)  # 0: Manual, 1: AI-generated
    ai_prompt = Column(Text, nullable=True)  # Prompt used for AI generation

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Worksheet(id={self.id}, title={self.title}, type={self.worksheet_type})>"

