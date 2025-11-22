"""
Weekly Assessment Schemas
Pydantic schemas for weekly skill assessments and submissions
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ============= Weekly Assessment Schemas =============
class WeeklyAssessmentCreate(BaseModel):
    """Create weekly assessment"""
    class_id: int
    week_number: int
    skill_type: str = Field(..., pattern="^(reading|writing|listening|speaking)$")
    title: str
    description: str | None = None
    content: dict[str, Any] | None = None
    rubrics: dict[str, Any] | None = None
    max_score: float | None = 10.0
    duration: int | None = None  # Duration in minutes


class WeeklyAssessmentGenerate(BaseModel):
    """Generate weekly assessment using AI"""
    class_id: int
    week_number: int
    skill_type: str = Field(..., pattern="^(reading|writing|listening|speaking)$")
    grade_level: int
    unit: str | None = None
    difficulty_level: str = "medium"


class WeeklyAssessmentUpdate(BaseModel):
    """Update weekly assessment"""
    title: str | None = None
    description: str | None = None
    content: dict[str, Any] | None = None
    rubrics: dict[str, Any] | None = None
    max_score: float | None = None
    duration: int | None = None
    is_active: bool | None = None


class WeeklyAssessmentResponse(BaseModel):
    """Weekly assessment response"""
    id: int
    class_id: int
    teacher_id: int
    week_number: int
    skill_type: str
    title: str
    description: str | None
    content: dict[str, Any] | None
    rubrics: dict[str, Any] | None
    max_score: float | None
    duration: int | None
    ai_generated: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class WeeklyAssessmentListItem(BaseModel):
    """Weekly assessment list item (minimal info)"""
    id: int
    class_id: int
    week_number: int
    skill_type: str
    title: str
    ai_generated: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Weekly Submission Schemas =============
class WeeklySubmissionCreate(BaseModel):
    """Create/start weekly submission"""
    assessment_id: int


class WeeklySubmissionUpdate(BaseModel):
    """Update weekly submission (save answers)"""
    answers: dict[str, Any]
    status: str | None = "in_progress"


class WeeklySubmissionSubmit(BaseModel):
    """Submit weekly assessment for grading"""
    answers: dict[str, Any]


class WeeklySubmissionGrade(BaseModel):
    """Grade weekly submission"""
    score: float
    rubrics_scores: dict[str, Any] | None = None
    feedback: str | None = None


class WeeklySubmissionResponse(BaseModel):
    """Weekly submission response"""
    id: int
    assessment_id: int
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


# ============= Error Analysis Export Schemas =============
class ErrorAnalysisExportRequest(BaseModel):
    """Request to export error analysis"""
    class_id: int
    assessment_type: str = Field(..., pattern="^(weekly|exam)$")  # weekly or exam
    assessment_id: int | None = None  # Specific assessment ID
    student_id: int | None = None  # Filter by student
    skill_type: str | None = None  # Filter by skill
    week_number: int | None = None  # For weekly assessments
    exam_type: str | None = None  # For exam assessments (midterm, final)
    format: str = Field("excel", pattern="^(excel|csv|json)$")
    include_feedback: bool = True
    include_suggestions: bool = True


class ErrorAnalysisStats(BaseModel):
    """Error analysis statistics"""
    total_submissions: int
    avg_score: float
    common_errors: list[dict[str, Any]]
    skill_breakdown: dict[str, Any]
    improvement_suggestions: list[str]

