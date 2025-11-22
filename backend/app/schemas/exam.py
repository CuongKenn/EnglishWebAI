"""
Exam Assessment Schemas
Pydantic schemas for exam assessments and submissions
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ============= Question Schemas =============
class ExamQuestion(BaseModel):
    """Single question in an exam"""
    question_id: str
    question_text: str
    question_type: str  # matching, multiple_choice, checkbox, fill_blank, short_answer, essay
    options: list[str] | None = None
    correct_answer: str | None = None  # For answer key
    points: float = 0.0
    has_image: bool = False
    image_id: int | None = None


class ExamTask(BaseModel):
    """Task within an exam section"""
    task_number: int
    task_title: str
    task_type: str  # matching, multiple_choice, etc.
    instructions: str | None = None
    has_images: bool = False
    image_positions: list[int] | None = None
    questions: list[ExamQuestion]


class ExamSection(BaseModel):
    """Section of an exam (Listening, Reading, etc.)"""
    section_name: str
    section_points: float
    tasks: list[ExamTask]


class ExamContent(BaseModel):
    """Full exam content structure"""
    exam_title: str
    exam_type: str = "midterm"
    total_points: float = 10.0
    duration: int | None = 60  # minutes
    sections: list[ExamSection]
    answer_key: dict[str, str] | None = None


# ============= Exam Assessment Schemas =============
class ExamAssessmentCreate(BaseModel):
    """Create exam assessment from parsed content"""
    class_id: int
    exam_type: str = Field(..., pattern="^(midterm|final|quiz|practice)$")
    title: str
    description: str | None = None
    content: dict[str, Any]  # Parsed exam content
    answer_key: dict[str, Any] | None = None
    rubrics: dict[str, Any] | None = None
    total_points: float = 10.0
    duration: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_published: bool = False


class ExamAssessmentUpdate(BaseModel):
    """Update exam assessment"""
    title: str | None = None
    description: str | None = None
    content: dict[str, Any] | None = None
    answer_key: dict[str, Any] | None = None
    rubrics: dict[str, Any] | None = None
    total_points: float | None = None
    duration: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    is_published: bool | None = None
    is_active: bool | None = None


class ExamAssessmentResponse(BaseModel):
    """Exam assessment response"""
    id: int
    class_id: int
    teacher_id: int
    exam_type: str
    title: str
    description: str | None
    original_filename: str | None
    content: dict[str, Any]
    answer_key: dict[str, Any] | None
    rubrics: dict[str, Any] | None
    total_points: float
    duration: int | None
    start_time: datetime | None
    end_time: datetime | None
    ai_parsed: bool
    is_active: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class ExamAssessmentListItem(BaseModel):
    """Exam assessment list item (minimal info)"""
    id: int
    class_id: int
    exam_type: str
    title: str
    description: str | None
    total_points: float
    duration: int | None
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
    answers: dict[str, Any]
    status: str | None = "in_progress"


class ExamSubmissionSubmit(BaseModel):
    """Submit exam for grading"""
    answers: dict[str, Any]


class ExamSubmissionGrade(BaseModel):
    """Grade exam submission"""
    score: float
    rubrics_scores: dict[str, Any] | None = None
    feedback: str | None = None


class ExamSubmissionResponse(BaseModel):
    """Exam submission response"""
    id: int
    exam_id: int
    student_id: int
    answers: dict[str, Any]
    score: float | None
    ai_score: float | None
    rubrics_scores: dict[str, Any] | None
    feedback: str | None
    ai_feedback: str | None
    error_analysis: dict[str, Any] | None
    status: str
    started_at: datetime
    submitted_at: datetime | None
    graded_at: datetime | None

    class Config:
        from_attributes = True


# ============= File Upload Schemas =============
class ExamImportRequest(BaseModel):
    """Request to import exam from Word file"""
    class_id: int
    exam_type: str = Field(..., pattern="^(midterm|final|quiz|practice)$")
    is_published: bool = False
    start_time: datetime | None = None
    end_time: datetime | None = None


class ExamImportResponse(BaseModel):
    """Response after importing exam"""
    success: bool
    message: str
    exam_id: int | None = None
    exam: ExamAssessmentResponse | None = None
    errors: list[str] | None = None

