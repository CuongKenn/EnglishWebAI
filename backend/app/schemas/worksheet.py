from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorksheetBase(BaseModel):
    """Base schema for Worksheet"""
    title: str = Field(..., min_length=3, max_length=255, description="Tên phiếu học tập")
    subject: str = Field(default="English", description="Môn học")
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: str | None = Field(None, max_length=100, description="Unit/Chủ đề")

    worksheet_type: str = Field(
        ...,
        pattern=r"^(multiple_choice|essay|fill_in_blank|topic_based|self_study|situational|mixed)$",
        description="Loại phiếu học tập"
    )

    skill_focus: str | None = Field(
        None,
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$",
        description="Kỹ năng tập trung"
    )

    difficulty_level: str | None = Field(
        default="medium",
        pattern=r"^(easy|medium|hard)$",
        description="Độ khó"
    )

    content: dict[str, Any] | None = Field(None, description="Nội dung phiếu học tập")
    teacher_notes: str | None = Field(None, description="Ghi chú cho giáo viên")
    answer_key: dict[str, Any] | None = Field(None, description="Đáp án chi tiết")

    duration: int | None = Field(None, ge=0, le=180, description="Thời gian làm bài (phút)")
    total_points: int | None = Field(None, ge=0, description="Tổng điểm")


class WorksheetCreate(WorksheetBase):
    """Schema for creating a worksheet"""


class WorksheetUpdate(BaseModel):
    """Schema for updating a worksheet"""
    title: str | None = Field(None, min_length=3, max_length=255)
    subject: str | None = None
    grade: int | None = Field(None, ge=1, le=12)
    unit: str | None = Field(None, max_length=100)

    worksheet_type: str | None = Field(
        None,
        pattern=r"^(multiple_choice|essay|fill_in_blank|topic_based|self_study|situational|mixed)$"
    )

    skill_focus: str | None = Field(
        None,
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$"
    )

    difficulty_level: str | None = Field(None, pattern=r"^(easy|medium|hard)$")

    content: dict[str, Any] | None = None
    teacher_notes: str | None = None
    answer_key: dict[str, Any] | None = None

    duration: int | None = Field(None, ge=0, le=180)
    total_points: int | None = Field(None, ge=0)


class WorksheetResponse(WorksheetBase):
    """Schema for worksheet response"""
    id: int
    teacher_id: int
    ai_generated: int
    ai_prompt: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class WorksheetAIGenerate(BaseModel):
    """Schema for AI worksheet generation"""
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: str = Field(..., min_length=2, max_length=100, description="Unit/Chủ đề")

    worksheet_type: str = Field(
        ...,
        pattern=r"^(multiple_choice|essay|fill_in_blank|topic_based|self_study|situational|mixed)$",
        description="Loại phiếu học tập"
    )

    skill_focus: str | None = Field(
        default="reading",
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$",
        description="Kỹ năng tập trung"
    )

    difficulty_level: str | None = Field(
        default="medium",
        pattern=r"^(easy|medium|hard)$",
        description="Độ khó"
    )

    num_questions: int | None = Field(default=10, ge=5, le=50, description="Số lượng câu hỏi")
    duration: int | None = Field(default=30, ge=10, le=90, description="Thời gian làm bài (phút)")

    # Thông tin bổ sung
    vocabulary_topics: list[str] | None = Field(default_factory=list, description="Chủ đề từ vựng")
    grammar_points: list[str] | None = Field(default_factory=list, description="Điểm ngữ pháp")
    language_functions: str | None = Field(None, description="Chức năng ngôn ngữ")

    additional_notes: str | None = Field(None, description="Ghi chú thêm cho AI")


class WorksheetListResponse(BaseModel):
    """Schema for worksheet list item"""
    id: int
    title: str
    subject: str
    grade: int
    unit: str | None = None
    worksheet_type: str
    skill_focus: str | None = None
    difficulty_level: str | None = None
    ai_generated: int
    created_at: datetime

    class Config:
        from_attributes = True

