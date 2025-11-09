"""
Schemas for detailed progress analytics and reporting
For teacher dashboard - student progress tracking, support groups, and reports
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# ==================== SKILL TYPES ====================

SkillType = Literal["reading", "writing", "listening", "speaking", "mixed"]
ExerciseType = Literal["assignment", "quiz", "test", "weekly_assessment", "midterm_exam", "final_exam"]
TrendType = Literal["improving", "declining", "stable"]
SupportLevel = Literal["urgent", "moderate", "low", "none"]


# ==================== SKILL BREAKDOWN ====================

class SkillBreakdown(BaseModel):
    """Detailed breakdown of a single skill"""
    skill: SkillType
    average_score: float = Field(..., ge=0, le=100, description="Average score in percentage")
    total_exercises: int = Field(..., ge=0)
    completed_exercises: int = Field(..., ge=0)
    pending_exercises: int = Field(..., ge=0)
    trend: TrendType
    recent_scores: list[float] = Field(default=[], description="Last 5 scores")
    weakest_areas: list[str] = Field(default=[], description="Identified weak points")


# ==================== ERROR ANALYSIS ====================

class ErrorPattern(BaseModel):
    """Common error pattern identified from AI feedback"""
    category: str = Field(..., description="Error category (grammar, vocabulary, pronunciation, etc.)")
    description: str = Field(..., description="Description of the error")
    frequency: int = Field(..., ge=0, description="How many times this error occurred")
    examples: list[str] = Field(default=[], max_items=3, description="Example instances")
    suggestions: list[str] = Field(default=[], description="Improvement suggestions")


class DetailedErrorAnalysis(BaseModel):
    """Comprehensive error analysis for a student"""
    student_id: int
    student_name: str
    total_errors: int = Field(..., ge=0)
    error_patterns: list[ErrorPattern]
    most_common_errors: list[str] = Field(default=[], max_items=5)
    improvement_suggestions: list[str] = Field(default=[])


# ==================== STUDENT PROGRESS ====================

class StudentProgressDetail(BaseModel):
    """Detailed progress information for a single student"""
    student_id: int
    student_name: str

    # Overall metrics
    overall_average: float = Field(..., ge=0, le=100)
    total_submissions: int = Field(..., ge=0)
    graded_submissions: int = Field(..., ge=0)
    pending_submissions: int = Field(..., ge=0)

    # Skill breakdown
    skills: list[SkillBreakdown]

    # Exam performance
    midterm_score: float | None = Field(None, ge=0, le=100)
    final_score: float | None = Field(None, ge=0, le=100)

    # Trends and support
    overall_trend: TrendType
    support_level: SupportLevel
    support_reasons: list[str] = Field(default=[])

    # Recent activity
    last_submission_date: datetime | None = None
    days_since_last_submission: int | None = None

    # Feedback summary
    recent_feedback: list[str] = Field(default=[], max_items=3)
    error_analysis: DetailedErrorAnalysis | None = None


# ==================== CLASS PROGRESS ====================

class ClassProgressSummary(BaseModel):
    """Summary of class progress"""
    class_id: int
    class_name: str

    # Overall metrics
    total_students: int
    average_score: float = Field(..., ge=0, le=100)
    completion_rate: float = Field(..., ge=0, le=100)

    # Skill performance
    skill_averages: dict[str, float] = Field(
        default={
            "reading": 0.0,
            "writing": 0.0,
            "listening": 0.0,
            "speaking": 0.0
        }
    )

    # Support groups
    students_needing_urgent_support: int = Field(..., ge=0)
    students_needing_moderate_support: int = Field(..., ge=0)
    students_doing_well: int = Field(..., ge=0)

    # Exercise breakdown by type
    exercise_breakdown: dict[str, int] = Field(
        default={
            "individual_skill": 0,  # Weekly assessments for single skills
            "midterm_exam": 0,      # Midterm exams (all 4 skills)
            "final_exam": 0,        # Final exams (all 4 skills)
            "regular_exercises": 0  # Regular exercises
        }
    )


# ==================== SUPPORT GROUPS ====================

class StudentSupportInfo(BaseModel):
    """Information about student needing support"""
    student_id: int
    student_name: str
    support_level: SupportLevel
    average_score: float = Field(..., ge=0, le=100)
    weakest_skills: list[str] = Field(default=[])
    reasons: list[str] = Field(default=[])
    recommendations: list[str] = Field(default=[])

    # Priority factors
    declining_trend: bool = Field(default=False)
    low_completion_rate: bool = Field(default=False)
    multiple_failed_assessments: bool = Field(default=False)
    no_recent_submissions: bool = Field(default=False)


class SupportGroupsResponse(BaseModel):
    """Response with students grouped by support level"""
    class_id: int
    class_name: str
    analysis_date: datetime = Field(default_factory=datetime.now)

    urgent_support: list[StudentSupportInfo] = Field(default=[])
    moderate_support: list[StudentSupportInfo] = Field(default=[])
    doing_well: list[StudentSupportInfo] = Field(default=[])

    summary: dict[str, int] = Field(
        default={
            "urgent": 0,
            "moderate": 0,
            "doing_well": 0,
            "total": 0
        }
    )


# ==================== WEEKLY REPORT ====================

class WeeklyStudentReport(BaseModel):
    """Weekly report for individual student"""
    student_id: int
    student_name: str
    week_period: str  # e.g., "Week 1-7/11/2025"

    # This week's metrics
    submissions_this_week: int = Field(..., ge=0)
    average_score_this_week: float | None = Field(None, ge=0, le=100)
    skills_practiced: list[str] = Field(default=[])

    # Comparison
    improvement_from_last_week: float | None = None  # percentage change

    # Detailed feedback
    strengths: list[str] = Field(default=[])
    areas_for_improvement: list[str] = Field(default=[])
    teacher_recommendations: list[str] = Field(default=[])

    # Error analysis
    common_errors_this_week: list[str] = Field(default=[])

    # Overall assessment
    performance_level: Literal["excellent", "good", "average", "needs_improvement", "at_risk"]
    next_week_focus: list[str] = Field(default=[])


class WeeklyClassReport(BaseModel):
    """Weekly report for entire class"""
    class_id: int
    class_name: str
    week_period: str
    generation_date: datetime = Field(default_factory=datetime.now)

    # Class overview
    total_students: int
    students_submitted: int
    submission_rate: float = Field(..., ge=0, le=100)

    # Performance
    class_average: float = Field(..., ge=0, le=100)
    highest_score: float | None = Field(None, ge=0, le=100)
    lowest_score: float | None = Field(None, ge=0, le=100)

    # Skills performance this week
    skills_performance: dict[str, float] = Field(default={})

    # Individual reports
    student_reports: list[WeeklyStudentReport]

    # Class-wide insights
    class_strengths: list[str] = Field(default=[])
    class_weaknesses: list[str] = Field(default=[])
    most_common_errors: list[str] = Field(default=[])

    # Recommendations
    teaching_recommendations: list[str] = Field(default=[])


# ==================== DETAILED STUDENT ANALYSIS ====================

class SubmissionDetail(BaseModel):
    """Detailed information about a single submission"""
    submission_id: int
    exercise_title: str
    exercise_type: ExerciseType
    skill_type: SkillType
    score: float | None = Field(None, ge=0)
    max_score: float = Field(..., gt=0)
    percentage: float = Field(..., ge=0, le=100)

    # Feedback
    teacher_feedback: str | None = None
    ai_feedback: str | None = None

    # Error analysis
    errors_identified: list[str] = Field(default=[])

    # Dates
    submitted_at: datetime
    graded_at: datetime | None = None


class DetailedStudentAnalysis(BaseModel):
    """Comprehensive analysis of a single student"""
    student_id: int
    student_name: str
    student_email: str
    analysis_date: datetime = Field(default_factory=datetime.now)

    # Overall performance
    overall_average: float = Field(..., ge=0, le=100)
    total_submissions: int = Field(..., ge=0)
    graded_submissions: int = Field(..., ge=0)

    # Skill breakdown with details
    skills_breakdown: list[SkillBreakdown]

    # Recent submissions
    recent_submissions: list[SubmissionDetail] = Field(default=[], max_items=10)

    # Exam performance
    midterm_performance: dict[str, float] | None = None  # Scores by skill
    final_performance: dict[str, float] | None = None    # Scores by skill

    # Error analysis
    error_analysis: DetailedErrorAnalysis

    # Progress tracking
    monthly_progress: list[dict[str, float]] = Field(
        default=[],
        description="Score trends over months"
    )

    # Support and recommendations
    support_level: SupportLevel
    support_reasons: list[str] = Field(default=[])
    personalized_recommendations: list[str] = Field(default=[])

    # Engagement metrics
    attendance_rate: float | None = Field(None, ge=0, le=100)
    participation_score: float | None = Field(None, ge=0, le=100)
    last_activity: datetime | None = None


# ==================== EXPORT OPTIONS ====================

class ReportExportRequest(BaseModel):
    """Request parameters for report export"""
    class_id: int
    report_type: Literal["weekly", "monthly", "semester", "student_individual"]
    start_date: datetime | None = None
    end_date: datetime | None = None
    student_ids: list[int] | None = Field(None, description="For individual student reports")
    include_error_analysis: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)
    format: Literal["xlsx", "pdf"] = Field(default="xlsx")


