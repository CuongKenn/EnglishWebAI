"""
Weekly Assessment Schemas
Pydantic schemas for weekly skill assessments and submissions
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============= Weekly Assessment Schemas =============
class WeeklyAssessmentCreate(BaseModel):
    """Create weekly assessment"""
    class_id: int
    week_number: int
    skill_type: str = Field(..., pattern="^(reading|writing|listening|speaking)$")
    title: str
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    rubrics: Optional[Dict[str, Any]] = None
    max_score: Optional[float] = 10.0
    duration: Optional[int] = None  # Duration in minutes


class WeeklyAssessmentGenerate(BaseModel):
    """Generate weekly assessment using AI"""
    class_id: int
    week_number: int
    skill_type: str = Field(..., pattern="^(reading|writing|listening|speaking)$")
    grade_level: int
    unit: Optional[str] = None
    difficulty_level: str = "medium"


class WeeklyAssessmentUpdate(BaseModel):
    """Update weekly assessment"""
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    rubrics: Optional[Dict[str, Any]] = None
    max_score: Optional[float] = None
    duration: Optional[int] = None
    is_active: Optional[bool] = None


class WeeklyAssessmentResponse(BaseModel):
    """Weekly assessment response"""
    id: int
    class_id: int
    teacher_id: int
    week_number: int
    skill_type: str
    title: str
    description: Optional[str]
    content: Optional[Dict[str, Any]]
    rubrics: Optional[Dict[str, Any]]
    max_score: Optional[float]
    duration: Optional[int]
    ai_generated: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

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
    answers: Dict[str, Any]
    status: Optional[str] = "in_progress"


class WeeklySubmissionSubmit(BaseModel):
    """Submit weekly assessment for grading"""
    answers: Dict[str, Any]


class WeeklySubmissionGrade(BaseModel):
    """Grade weekly submission"""
    score: float
    rubrics_scores: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None


class WeeklySubmissionResponse(BaseModel):
    """Weekly submission response"""
    id: int
    assessment_id: int
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


# ============= Error Analysis Export Schemas =============
class ErrorAnalysisExportRequest(BaseModel):
    """Request to export error analysis"""
    class_id: int
    assessment_type: str = Field(..., pattern="^(weekly|exam)$")  # weekly or exam
    assessment_id: Optional[int] = None  # Specific assessment ID
    student_id: Optional[int] = None  # Filter by student
    skill_type: Optional[str] = None  # Filter by skill
    week_number: Optional[int] = None  # For weekly assessments
    exam_type: Optional[str] = None  # For exam assessments (midterm, final)
    format: str = Field("excel", pattern="^(excel|csv|json)$")
    include_feedback: bool = True
    include_suggestions: bool = True


class ErrorAnalysisStats(BaseModel):
    """Error analysis statistics"""
    total_submissions: int
    avg_score: float
    common_errors: List[Dict[str, Any]]
    skill_breakdown: Dict[str, Any]
    improvement_suggestions: List[str]

