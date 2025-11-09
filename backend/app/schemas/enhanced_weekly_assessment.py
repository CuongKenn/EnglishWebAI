"""
Enhanced Weekly Assessment Schemas
Support for 4-skill integrated assessments and detailed error analysis
"""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, validator


# ============= Enums =============
class AssessmentTypeEnum(str, Enum):
    WEEKLY_SINGLE = "weekly_single"
    WEEKLY_INTEGRATED = "weekly_integrated"
    MIDTERM = "midterm"
    FINAL = "final"
    PRACTICE = "practice"


class SkillTypeEnum(str, Enum):
    LISTENING = "listening"
    READING = "reading"
    WRITING = "writing"
    SPEAKING = "speaking"
    INTEGRATED = "integrated"


# ============= Assessment Content Schemas =============
class SkillContent(BaseModel):
    """Base content structure for each skill"""
    questions: list[dict[str, Any]] = []
    instructions: str | None = None
    resources: list[dict[str, Any]] | None = []  # Audio files, images, etc.
    max_score: float | None = 25.0
    duration: int | None = None  # minutes


class ListeningContent(SkillContent):
    """Listening skill specific content"""
    audio_files: list[str] | None = []
    transcripts: list[str] | None = []
    question_types: list[str] | None = ["multiple_choice", "fill_blank", "true_false"]


class ReadingContent(SkillContent):
    """Reading skill specific content"""
    passages: list[dict[str, Any]] | None = []
    question_types: list[str] | None = ["multiple_choice", "short_answer", "essay"]


class WritingContent(SkillContent):
    """Writing skill specific content"""
    prompts: list[dict[str, Any]] | None = []
    word_limits: dict[str, int] | None = {}
    writing_types: list[str] | None = ["essay", "letter", "report", "creative"]


class SpeakingContent(SkillContent):
    """Speaking skill specific content"""
    prompts: list[dict[str, Any]] | None = []
    preparation_time: int | None = 30  # seconds
    response_time: int | None = 90  # seconds
    speaking_types: list[str] | None = ["presentation", "discussion", "role_play"]


# ============= Assessment Creation Schemas =============
class EnhancedWeeklyAssessmentCreate(BaseModel):
    """Create enhanced weekly assessment"""
    class_id: int
    assessment_type: AssessmentTypeEnum
    week_number: int | None = None
    semester_period: str | None = None
    title: str
    description: str | None = None

    # 4-Skills Content
    listening_content: ListeningContent | None = None
    reading_content: ReadingContent | None = None
    writing_content: WritingContent | None = None
    speaking_content: SpeakingContent | None = None

    # Skills Configuration
    skills_enabled: dict[str, bool] = {
        "listening": True,
        "reading": True,
        "writing": True,
        "speaking": True
    }

    # Timing
    total_duration: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None

    # Settings
    auto_grade_enabled: bool = True

    @validator('skills_enabled')
    def validate_skills_enabled(cls, v):
        required_skills = ["listening", "reading", "writing", "speaking"]
        if not all(skill in v for skill in required_skills):
            raise ValueError("skills_enabled must contain all 4 skills")
        if not any(v.values()):
            raise ValueError("At least one skill must be enabled")
        return v


class EnhancedWeeklyAssessmentGenerate(BaseModel):
    """Generate enhanced weekly assessment using AI"""
    class_id: int
    assessment_type: AssessmentTypeEnum
    week_number: int | None = None
    semester_period: str | None = None

    # Generation parameters
    grade_level: int = Field(..., ge=1, le=12)
    unit_topic: str | None = None
    difficulty_level: str = Field(default="medium", pattern="^(easy|medium|hard)$")

    # Skills to generate
    skills_enabled: dict[str, bool] = {
        "listening": True,
        "reading": True,
        "writing": True,
        "speaking": True
    }

    # Specific requirements for each skill
    listening_requirements: str | None = None
    reading_requirements: str | None = None
    writing_requirements: str | None = None
    speaking_requirements: str | None = None


# ============= Submission Schemas =============
class SkillAnswers(BaseModel):
    """Base answers structure for each skill"""
    answers: dict[str, Any] = {}
    time_spent: int | None = None  # minutes
    completion_status: str = "not_started"  # not_started, in_progress, completed


class EnhancedWeeklySubmissionCreate(BaseModel):
    """Create enhanced weekly submission"""
    assessment_id: int
    listening_answers: SkillAnswers | None = None
    reading_answers: SkillAnswers | None = None
    writing_answers: SkillAnswers | None = None
    speaking_answers: SkillAnswers | None = None


class EnhancedWeeklySubmissionUpdate(BaseModel):
    """Update enhanced weekly submission"""
    listening_answers: SkillAnswers | None = None
    reading_answers: SkillAnswers | None = None
    writing_answers: SkillAnswers | None = None
    speaking_answers: SkillAnswers | None = None
    status: str | None = None


# ============= Grading Schemas =============
class SkillGrading(BaseModel):
    """Grading structure for each skill"""
    score: float | None = None
    ai_score: float | None = None
    rubric_scores: dict[str, float] | None = {}
    feedback: str | None = None
    ai_feedback: str | None = None
    error_analysis: dict[str, Any] | None = {}


class EnhancedWeeklySubmissionGrade(BaseModel):
    """Grade enhanced weekly submission"""
    submission_id: int
    listening_grading: SkillGrading | None = None
    reading_grading: SkillGrading | None = None
    writing_grading: SkillGrading | None = None
    speaking_grading: SkillGrading | None = None
    overall_feedback: str | None = None
    total_score: float | None = None


# ============= Response Schemas =============
class SkillResult(BaseModel):
    """Result structure for each skill"""
    content: dict[str, Any] | None = None
    answers: dict[str, Any] | None = None
    score: float | None = None
    ai_score: float | None = None
    max_score: float | None = None
    rubric_scores: dict[str, float] | None = {}
    feedback: str | None = None
    ai_feedback: str | None = None
    error_analysis: dict[str, Any] | None = {}
    time_spent: int | None = None
    duration: int | None = None


class EnhancedWeeklyAssessmentResponse(BaseModel):
    """Enhanced weekly assessment response"""
    id: int
    class_id: int
    teacher_id: int
    assessment_type: str
    week_number: int | None = None
    semester_period: str | None = None
    title: str
    description: str | None = None

    # Skills data
    listening: SkillResult | None = None
    reading: SkillResult | None = None
    writing: SkillResult | None = None
    speaking: SkillResult | None = None

    # Assessment settings
    skills_enabled: dict[str, bool]
    total_max_score: float
    total_duration: int | None = None
    is_active: bool
    ai_generated: bool

    # Timestamps
    start_time: datetime | None = None
    end_time: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class EnhancedWeeklySubmissionResponse(BaseModel):
    """Enhanced weekly submission response"""
    id: int
    assessment_id: int
    student_id: int

    # Skills results
    listening: SkillResult | None = None
    reading: SkillResult | None = None
    writing: SkillResult | None = None
    speaking: SkillResult | None = None

    # Overall results
    total_score: float | None = None
    total_ai_score: float | None = None
    total_max_score: float | None = None
    overall_feedback: str | None = None
    overall_ai_feedback: str | None = None

    # Status and timing
    status: str
    submission_progress: dict[str, Any] | None = None
    total_time_spent: int | None = None

    # Timestamps
    started_at: datetime | None = None
    submitted_at: datetime | None = None
    graded_at: datetime | None = None

    class Config:
        from_attributes = True


# ============= Error Analysis Export Schema =============
class EnhancedErrorAnalysisExportRequest(BaseModel):
    """Request for exporting enhanced error analysis"""
    class_id: int
    assessment_type: AssessmentTypeEnum | None = None
    week_number: int | None = None
    semester_period: str | None = None
    student_id: int | None = None
    skills: list[SkillTypeEnum] | None = None  # Filter by specific skills
    date_from: datetime | None = None
    date_to: datetime | None = None
    include_ai_analysis: bool = True
    export_format: str = Field(default="excel", pattern="^(excel|csv|pdf)$")
    detailed_breakdown: bool = True  # Include question-by-question analysis
