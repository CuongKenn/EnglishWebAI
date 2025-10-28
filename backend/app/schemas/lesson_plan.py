from typing import Optional, Dict, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class LessonPlanObjectives(BaseModel):
    """Mục tiêu bài học"""
    knowledge: Optional[List[str]] = Field(default_factory=list, description="Kiến thức")
    skills: Optional[List[str]] = Field(default_factory=list, description="Kỹ năng") 
    competencies: Optional[List[str]] = Field(default_factory=list, description="Năng lực")
    qualities: Optional[List[str]] = Field(default_factory=list, description="Phẩm chất")


class LessonPlanActivity(BaseModel):
    """Hoạt động dạy học"""
    name: str = Field(..., description="Tên hoạt động")
    duration: Optional[int] = Field(None, description="Thời lượng (phút)")
    objectives: Optional[str] = Field(None, description="Mục tiêu hoạt động")
    content: str = Field(..., description="Nội dung hoạt động")
    methods: Optional[List[str]] = Field(default_factory=list, description="Phương pháp")
    teacher_activities: Optional[str] = Field(None, description="Hoạt động của giáo viên")
    student_activities: Optional[str] = Field(None, description="Hoạt động của học sinh")
    resources: Optional[List[str]] = Field(default_factory=list, description="Tài liệu/Thiết bị")


class LessonPlanActivities(BaseModel):
    """Tiến trình dạy học - 4 hoạt động chính"""
    warm_up: Optional[LessonPlanActivity] = Field(None, description="Hoạt động 1: Khởi động")
    presentation: Optional[LessonPlanActivity] = Field(None, description="Hoạt động 2: Hình thành kiến thức")
    practice: Optional[LessonPlanActivity] = Field(None, description="Hoạt động 3: Luyện tập")
    production: Optional[LessonPlanActivity] = Field(None, description="Hoạt động 4: Vận dụng")


class LessonPlanBase(BaseModel):
    """Base schema for Lesson Plan"""
    title: str = Field(..., min_length=3, max_length=255, description="Tên bài học")
    subject: str = Field(default="English", description="Môn học")
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: Optional[str] = Field(None, max_length=100, description="Unit/Bài")
    lesson_number: Optional[str] = Field(None, max_length=50, description="Tiết")
    duration: Optional[int] = Field(default=45, ge=0, le=180, description="Thời lượng (phút)")
    
    objectives: Optional[Dict[str, Any]] = Field(None, description="Mục tiêu bài học")
    teaching_aids: Optional[List[str]] = Field(default_factory=list, description="Thiết bị và học liệu")
    activities: Optional[Dict[str, Any]] = Field(None, description="Tiến trình dạy học")
    
    content: Optional[str] = Field(None, description="Nội dung chi tiết")
    notes: Optional[str] = Field(None, description="Ghi chú")
    homework: Optional[str] = Field(None, description="Bài tập về nhà")


class LessonPlanCreate(LessonPlanBase):
    """Schema for creating a lesson plan"""
    pass


class LessonPlanUpdate(BaseModel):
    """Schema for updating a lesson plan"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    subject: Optional[str] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    unit: Optional[str] = Field(None, max_length=100)
    lesson_number: Optional[str] = Field(None, max_length=50)
    duration: Optional[int] = Field(None, ge=0, le=180)
    
    objectives: Optional[Dict[str, Any]] = None
    teaching_aids: Optional[List[str]] = None
    activities: Optional[Dict[str, Any]] = None
    
    content: Optional[str] = None
    notes: Optional[str] = None
    homework: Optional[str] = None


class LessonPlanResponse(LessonPlanBase):
    """Schema for lesson plan response"""
    id: int
    teacher_id: int
    ai_generated: int
    ai_prompt: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LessonPlanAIGenerate(BaseModel):
    """Schema for AI lesson plan generation"""
    grade: int = Field(..., ge=1, le=12, description="Khối lớp")
    unit: str = Field(..., min_length=2, max_length=100, description="Unit/Chủ đề (VD: Unit 7 - Technology)")
    lesson_number: Optional[str] = Field(default="Lesson 1", description="Tiết học (VD: Lesson 1, 2...)")
    duration: Optional[int] = Field(default=45, ge=30, le=90, description="Thời lượng (phút)")
    
    # Thông tin thêm để AI generate tốt hơn
    focus_skills: Optional[List[str]] = Field(
        default=["listening", "speaking"],
        description="Kỹ năng tập trung (listening, speaking, reading, writing)"
    )
    language_functions: Optional[str] = Field(None, description="Chức năng ngôn ngữ (VD: Asking for directions)")
    vocabulary_topics: Optional[List[str]] = Field(default_factory=list, description="Chủ đề từ vựng")
    grammar_points: Optional[List[str]] = Field(default_factory=list, description="Điểm ngữ pháp")
    
    additional_notes: Optional[str] = Field(None, description="Ghi chú thêm cho AI")


class LessonPlanListResponse(BaseModel):
    """Schema for lesson plan list item"""
    id: int
    title: str
    subject: str
    grade: int
    unit: Optional[str] = None
    lesson_number: Optional[str] = None
    duration: Optional[int] = None
    ai_generated: int
    created_at: datetime

    class Config:
        from_attributes = True

