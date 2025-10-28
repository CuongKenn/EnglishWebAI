from typing import Optional, Dict, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class WorksheetBase(BaseModel):
    """Base schema for Worksheet"""
    title: str = Field(..., min_length=3, max_length=255, description="Tên phiếu học tập")
    subject: str = Field(default="English", description="Môn học")
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: Optional[str] = Field(None, max_length=100, description="Unit/Chủ đề")
    
    worksheet_type: str = Field(
        ...,
        pattern=r"^(multiple_choice|essay|fill_in_blank|topic_based|self_study|situational|mixed)$",
        description="Loại phiếu học tập"
    )
    
    skill_focus: Optional[str] = Field(
        None,
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$",
        description="Kỹ năng tập trung"
    )
    
    difficulty_level: Optional[str] = Field(
        default="medium",
        pattern=r"^(easy|medium|hard)$",
        description="Độ khó"
    )
    
    content: Optional[Dict[str, Any]] = Field(None, description="Nội dung phiếu học tập")
    teacher_notes: Optional[str] = Field(None, description="Ghi chú cho giáo viên")
    answer_key: Optional[Dict[str, Any]] = Field(None, description="Đáp án chi tiết")
    
    duration: Optional[int] = Field(None, ge=0, le=180, description="Thời gian làm bài (phút)")
    total_points: Optional[int] = Field(None, ge=0, description="Tổng điểm")


class WorksheetCreate(WorksheetBase):
    """Schema for creating a worksheet"""
    pass


class WorksheetUpdate(BaseModel):
    """Schema for updating a worksheet"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    subject: Optional[str] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    unit: Optional[str] = Field(None, max_length=100)
    
    worksheet_type: Optional[str] = Field(
        None,
        pattern=r"^(multiple_choice|essay|fill_in_blank|topic_based|self_study|situational|mixed)$"
    )
    
    skill_focus: Optional[str] = Field(
        None,
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$"
    )
    
    difficulty_level: Optional[str] = Field(None, pattern=r"^(easy|medium|hard)$")
    
    content: Optional[Dict[str, Any]] = None
    teacher_notes: Optional[str] = None
    answer_key: Optional[Dict[str, Any]] = None
    
    duration: Optional[int] = Field(None, ge=0, le=180)
    total_points: Optional[int] = Field(None, ge=0)


class WorksheetResponse(WorksheetBase):
    """Schema for worksheet response"""
    id: int
    teacher_id: int
    ai_generated: int
    ai_prompt: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

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
    
    skill_focus: Optional[str] = Field(
        default="reading",
        pattern=r"^(listening|speaking|reading|writing|grammar|vocabulary|pronunciation)$",
        description="Kỹ năng tập trung"
    )
    
    difficulty_level: Optional[str] = Field(
        default="medium",
        pattern=r"^(easy|medium|hard)$",
        description="Độ khó"
    )
    
    num_questions: Optional[int] = Field(default=10, ge=5, le=50, description="Số lượng câu hỏi")
    duration: Optional[int] = Field(default=30, ge=10, le=90, description="Thời gian làm bài (phút)")
    
    # Thông tin bổ sung
    vocabulary_topics: Optional[List[str]] = Field(default_factory=list, description="Chủ đề từ vựng")
    grammar_points: Optional[List[str]] = Field(default_factory=list, description="Điểm ngữ pháp")
    language_functions: Optional[str] = Field(None, description="Chức năng ngôn ngữ")
    
    additional_notes: Optional[str] = Field(None, description="Ghi chú thêm cho AI")


class WorksheetListResponse(BaseModel):
    """Schema for worksheet list item"""
    id: int
    title: str
    subject: str
    grade: int
    unit: Optional[str] = None
    worksheet_type: str
    skill_focus: Optional[str] = None
    difficulty_level: Optional[str] = None
    ai_generated: int
    created_at: datetime

    class Config:
        from_attributes = True

