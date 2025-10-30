"""
Exam Assessment Schemas
Pydantic schemas for exam assessments and submissions
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============= Question Schemas =============
class ExamQuestion(BaseModel):
    """Single question in an exam"""
    question_id: str
    question_text: str
    question_type: str  # matching, multiple_choice, checkbox, fill_blank, short_answer, essay
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None  # For answer key
    points: float = 0.0
    has_image: bool = False
    image_id: Optional[int] = None


class ExamTask(BaseModel):
    """Task within an exam section"""
    task_number: int
    task_title: str
    task_type: str  # matching, multiple_choice, etc.
    instructions: Optional[str] = None
    has_images: bool = False
    image_positions: Optional[List[int]] = None
    questions: List[ExamQuestion]


class ExamSection(BaseModel):
    """Section of an exam (Listening, Reading, etc.)"""
    section_name: str
    section_points: float
    tasks: List[ExamTask]


class ExamContent(BaseModel):
    """Full exam content structure"""
    exam_title: str
    exam_type: str = "midterm"
    total_points: float = 10.0
    duration: Optional[int] = 60  # minutes
    sections: List[ExamSection]
    answer_key: Optional[Dict[str, str]] = None


# ============= Exam Assessment Schemas =============
class ExamAssessmentCreate(BaseModel):
    """Create exam assessment from parsed content"""
    class_id: int
    exam_type: str = Field(..., pattern="^(midterm|final|quiz|practice)$")
    title: str
    description: Optional[str] = None
    content: Dict[str, Any]  # Parsed exam content
    answer_key: Optional[Dict[str, Any]] = None
    rubrics: Optional[Dict[str, Any]] = None
    total_points: float = 10.0
    duration: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_published: bool = False


class ExamAssessmentUpdate(BaseModel):
    """Update exam assessment"""
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    answer_key: Optional[Dict[str, Any]] = None
    rubrics: Optional[Dict[str, Any]] = None
    total_points: Optional[float] = None
    duration: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None


class ExamAssessmentResponse(BaseModel):
    """Exam assessment response"""
    id: int
    class_id: int
    teacher_id: int
    exam_type: str
    title: str
    description: Optional[str]
    original_filename: Optional[str]
    content: Dict[str, Any]
    answer_key: Optional[Dict[str, Any]]
    rubrics: Optional[Dict[str, Any]]
    total_points: float
    duration: Optional[int]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    ai_parsed: bool
    is_active: bool
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExamAssessmentListItem(BaseModel):
    """Exam assessment list item (minimal info)"""
    id: int
    class_id: int
    exam_type: str
    title: str
    description: Optional[str]
    total_points: float
    duration: Optional[int]
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Exam Submission Schemas =============
class ExamSubmissionCreate(BaseModel):
    """Create/start exam submission"""
    exam_id: int


class ExamSubmissionUpdate(BaseModel):
    """Update exam submission (save answers)"""
    answers: Dict[str, Any]
    status: Optional[str] = "in_progress"


class ExamSubmissionSubmit(BaseModel):
    """Submit exam for grading"""
    answers: Dict[str, Any]


class ExamSubmissionGrade(BaseModel):
    """Grade exam submission"""
    score: float
    rubrics_scores: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None


class ExamSubmissionResponse(BaseModel):
    """Exam submission response"""
    id: int
    exam_id: int
    student_id: int
    answers: Dict[str, Any]
    score: Optional[float]
    ai_score: Optional[float]
    rubrics_scores: Optional[Dict[str, Any]]
    feedback: Optional[str]
    ai_feedback: Optional[str]
    error_analysis: Optional[Dict[str, Any]]
    status: str
    started_at: datetime
    submitted_at: Optional[datetime]
    graded_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= File Upload Schemas =============
class ExamImportRequest(BaseModel):
    """Request to import exam from Word file"""
    class_id: int
    exam_type: str = Field(..., pattern="^(midterm|final|quiz|practice)$")
    is_published: bool = False
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExamImportResponse(BaseModel):
    """Response after importing exam"""
    success: bool
    message: str
    exam_id: Optional[int] = None
    exam: Optional[ExamAssessmentResponse] = None
    errors: Optional[List[str]] = None

