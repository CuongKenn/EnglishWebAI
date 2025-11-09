from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class LessonPlanObjectives(BaseModel):
    """Mục tiêu bài học"""
    knowledge: list[str] | None = Field(default_factory=list, description="Kiến thức")
    skills: list[str] | None = Field(default_factory=list, description="Kỹ năng")
    competencies: list[str] | None = Field(default_factory=list, description="Năng lực")
    qualities: list[str] | None = Field(default_factory=list, description="Phẩm chất")


class LessonPlanActivity(BaseModel):
    """Hoạt động dạy học"""
    name: str = Field(..., description="Tên hoạt động")
    duration: int | None = Field(None, description="Thời lượng (phút)")
    objectives: str | None = Field(None, description="Mục tiêu hoạt động")
    content: str = Field(..., description="Nội dung hoạt động")
    methods: list[str] | None = Field(default_factory=list, description="Phương pháp")
    teacher_activities: str | None = Field(None, description="Hoạt động của giáo viên")
    student_activities: str | None = Field(None, description="Hoạt động của học sinh")
    resources: list[str] | None = Field(default_factory=list, description="Tài liệu/Thiết bị")


class LessonPlanActivities(BaseModel):
    """Tiến trình dạy học - 4 hoạt động chính"""
    warm_up: LessonPlanActivity | None = Field(None, description="Hoạt động 1: Khởi động")
    presentation: LessonPlanActivity | None = Field(None, description="Hoạt động 2: Hình thành kiến thức")
    practice: LessonPlanActivity | None = Field(None, description="Hoạt động 3: Luyện tập")
    production: LessonPlanActivity | None = Field(None, description="Hoạt động 4: Vận dụng")


class LessonPlanBase(BaseModel):
    """Base schema for Lesson Plan"""
    title: str = Field(..., min_length=3, max_length=255, description="Tên bài học")
    subject: str = Field(default="English", description="Môn học")
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: str | None = Field(None, max_length=100, description="Unit/Bài")
    lesson_number: str | None = Field(None, max_length=50, description="Tiết")
    duration: int | None = Field(default=45, ge=0, le=180, description="Thời lượng (phút)")

    objectives: dict[str, Any] | None = Field(None, description="Mục tiêu bài học")
    teaching_aids: list[str] | None = Field(default_factory=list, description="Thiết bị và học liệu")
    activities: dict[str, Any] | None = Field(None, description="Tiến trình dạy học")

    content: str | None = Field(None, description="Nội dung chi tiết")
    notes: str | None = Field(None, description="Ghi chú")
    homework: str | None = Field(None, description="Bài tập về nhà")


class LessonPlanCreate(LessonPlanBase):
    """Schema for creating a lesson plan"""


class LessonPlanUpdate(BaseModel):
    """Schema for updating a lesson plan"""
    title: str | None = Field(None, min_length=3, max_length=255)
    subject: str | None = None
    grade: int | None = Field(None, ge=1, le=12)
    unit: str | None = Field(None, max_length=100)
    lesson_number: str | None = Field(None, max_length=50)
    duration: int | None = Field(None, ge=0, le=180)

    objectives: dict[str, Any] | None = None
    teaching_aids: list[str] | None = None
    activities: dict[str, Any] | None = None

    content: str | None = None
    notes: str | None = None
    homework: str | None = None


class LessonPlanResponse(LessonPlanBase):
    """Schema for lesson plan response"""
    id: int
    teacher_id: int
    ai_generated: int
    ai_prompt: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class LessonPlanAIGenerate(BaseModel):
    """Schema for AI lesson plan generation"""
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: str = Field(..., min_length=2, max_length=100, description="Unit/Chủ đề (VD: Unit 7 - Technology)")
    lesson_number: str | None = Field(default="Lesson 1", description="Tiết học (VD: Lesson 1, 2...)")
    duration: int | None = Field(default=45, ge=30, le=90, description="Thời lượng (phút)")

    # Thông tin thêm để AI generate tốt hơn
    focus_skills: list[str] | None = Field(
        default=["listening", "speaking"],
        description="Kỹ năng tập trung (listening, speaking, reading, writing)"
    )
    language_functions: str | None = Field(None, description="Chức năng ngôn ngữ (VD: Asking for directions)")
    vocabulary_topics: list[str] | None = Field(default_factory=list, description="Chủ đề từ vựng")
    grammar_points: list[str] | None = Field(default_factory=list, description="Điểm ngữ pháp")

    additional_notes: str | None = Field(None, description="Ghi chú thêm cho AI")


class LessonPlanListResponse(BaseModel):
    """Schema for lesson plan list item"""
    id: int
    title: str
    subject: str
    grade: int
    unit: str | None = None
    lesson_number: str | None = None
    duration: int | None = None
    ai_generated: int
    created_at: datetime

    class Config:
        from_attributes = True

