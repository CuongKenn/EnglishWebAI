"""
Enhanced Weekly Assessment Schemas
Support for 4-skill integrated assessments and detailed error analysis
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


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
    questions: List[Dict[str, Any]] = []
    instructions: Optional[str] = None
    resources: Optional[List[Dict[str, Any]]] = []  # Audio files, images, etc.
    max_score: Optional[float] = 25.0
    duration: Optional[int] = None  # minutes


class ListeningContent(SkillContent):
    """Listening skill specific content"""
    audio_files: Optional[List[str]] = []
    transcripts: Optional[List[str]] = []
    question_types: Optional[List[str]] = ["multiple_choice", "fill_blank", "true_false"]


class ReadingContent(SkillContent):
    """Reading skill specific content"""
    passages: Optional[List[Dict[str, Any]]] = []
    question_types: Optional[List[str]] = ["multiple_choice", "short_answer", "essay"]


class WritingContent(SkillContent):
    """Writing skill specific content"""
    prompts: Optional[List[Dict[str, Any]]] = []
    word_limits: Optional[Dict[str, int]] = {}
    writing_types: Optional[List[str]] = ["essay", "letter", "report", "creative"]


class SpeakingContent(SkillContent):
    """Speaking skill specific content"""
    prompts: Optional[List[Dict[str, Any]]] = []
    preparation_time: Optional[int] = 30  # seconds
    response_time: Optional[int] = 90  # seconds
    speaking_types: Optional[List[str]] = ["presentation", "discussion", "role_play"]


# ============= Assessment Creation Schemas =============
class EnhancedWeeklyAssessmentCreate(BaseModel):
    """Create enhanced weekly assessment"""
    class_id: int
    assessment_type: AssessmentTypeEnum
    week_number: Optional[int] = None
    semester_period: Optional[str] = None
    title: str
    description: Optional[str] = None
    
    # 4-Skills Content
    listening_content: Optional[ListeningContent] = None
    reading_content: Optional[ReadingContent] = None
    writing_content: Optional[WritingContent] = None
    speaking_content: Optional[SpeakingContent] = None
    
    # Skills Configuration
    skills_enabled: Dict[str, bool] = {
        "listening": True,
        "reading": True,
        "writing": True,
        "speaking": True
    }
    
    # Timing
    total_duration: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
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
    week_number: Optional[int] = None
    semester_period: Optional[str] = None
    
    # Generation parameters
    grade_level: int = Field(..., ge=1, le=12)
    unit_topic: Optional[str] = None
    difficulty_level: str = Field(default="medium", pattern="^(easy|medium|hard)$")
    
    # Skills to generate
    skills_enabled: Dict[str, bool] = {
        "listening": True,
        "reading": True,
        "writing": True,
        "speaking": True
    }
    
    # Specific requirements for each skill
    listening_requirements: Optional[str] = None
    reading_requirements: Optional[str] = None
    writing_requirements: Optional[str] = None
    speaking_requirements: Optional[str] = None


# ============= Submission Schemas =============
class SkillAnswers(BaseModel):
    """Base answers structure for each skill"""
    answers: Dict[str, Any] = {}
    time_spent: Optional[int] = None  # minutes
    completion_status: str = "not_started"  # not_started, in_progress, completed


class EnhancedWeeklySubmissionCreate(BaseModel):
    """Create enhanced weekly submission"""
    assessment_id: int
    listening_answers: Optional[SkillAnswers] = None
    reading_answers: Optional[SkillAnswers] = None
    writing_answers: Optional[SkillAnswers] = None
    speaking_answers: Optional[SkillAnswers] = None


class EnhancedWeeklySubmissionUpdate(BaseModel):
    """Update enhanced weekly submission"""
    listening_answers: Optional[SkillAnswers] = None
    reading_answers: Optional[SkillAnswers] = None
    writing_answers: Optional[SkillAnswers] = None
    speaking_answers: Optional[SkillAnswers] = None
    status: Optional[str] = None


# ============= Grading Schemas =============
class SkillGrading(BaseModel):
    """Grading structure for each skill"""
    score: Optional[float] = None
    ai_score: Optional[float] = None
    rubric_scores: Optional[Dict[str, float]] = {}
    feedback: Optional[str] = None
    ai_feedback: Optional[str] = None
    error_analysis: Optional[Dict[str, Any]] = {}


class EnhancedWeeklySubmissionGrade(BaseModel):
    """Grade enhanced weekly submission"""
    submission_id: int
    listening_grading: Optional[SkillGrading] = None
    reading_grading: Optional[SkillGrading] = None
    writing_grading: Optional[SkillGrading] = None
    speaking_grading: Optional[SkillGrading] = None
    overall_feedback: Optional[str] = None
    total_score: Optional[float] = None


# ============= Response Schemas =============
class SkillResult(BaseModel):
    """Result structure for each skill"""
    content: Optional[Dict[str, Any]] = None
    answers: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    ai_score: Optional[float] = None
    max_score: Optional[float] = None
    rubric_scores: Optional[Dict[str, float]] = {}
    feedback: Optional[str] = None
    ai_feedback: Optional[str] = None
    error_analysis: Optional[Dict[str, Any]] = {}
    time_spent: Optional[int] = None
    duration: Optional[int] = None


class EnhancedWeeklyAssessmentResponse(BaseModel):
    """Enhanced weekly assessment response"""
    id: int
    class_id: int
    teacher_id: int
    assessment_type: str
    week_number: Optional[int] = None
    semester_period: Optional[str] = None
    title: str
    description: Optional[str] = None
    
    # Skills data
    listening: Optional[SkillResult] = None
    reading: Optional[SkillResult] = None
    writing: Optional[SkillResult] = None
    speaking: Optional[SkillResult] = None
    
    # Assessment settings
    skills_enabled: Dict[str, bool]
    total_max_score: float
    total_duration: Optional[int] = None
    is_active: bool
    ai_generated: bool
    
    # Timestamps
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnhancedWeeklySubmissionResponse(BaseModel):
    """Enhanced weekly submission response"""
    id: int
    assessment_id: int
    student_id: int
    
    # Skills results
    listening: Optional[SkillResult] = None
    reading: Optional[SkillResult] = None
    writing: Optional[SkillResult] = None
    speaking: Optional[SkillResult] = None
    
    # Overall results
    total_score: Optional[float] = None
    total_ai_score: Optional[float] = None
    total_max_score: Optional[float] = None
    overall_feedback: Optional[str] = None
    overall_ai_feedback: Optional[str] = None
    
    # Status and timing
    status: str
    submission_progress: Optional[Dict[str, Any]] = None
    total_time_spent: Optional[int] = None
    
    # Timestamps
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============= Error Analysis Export Schema =============
class EnhancedErrorAnalysisExportRequest(BaseModel):
    """Request for exporting enhanced error analysis"""
    class_id: int
    assessment_type: Optional[AssessmentTypeEnum] = None
    week_number: Optional[int] = None
    semester_period: Optional[str] = None
    student_id: Optional[int] = None
    skills: Optional[List[SkillTypeEnum]] = None  # Filter by specific skills
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_ai_analysis: bool = True
    export_format: str = Field(default="excel", pattern="^(excel|csv|pdf)$")
    detailed_breakdown: bool = True  # Include question-by-question analysis