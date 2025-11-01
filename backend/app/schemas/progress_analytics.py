"""
Schemas for detailed progress analytics and reporting
For teacher dashboard - student progress tracking, support groups, and reports
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal
from datetime import datetime


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
    recent_scores: List[float] = Field(default=[], description="Last 5 scores")
    weakest_areas: List[str] = Field(default=[], description="Identified weak points")


# ==================== ERROR ANALYSIS ====================

class ErrorPattern(BaseModel):
    """Common error pattern identified from AI feedback"""
    category: str = Field(..., description="Error category (grammar, vocabulary, pronunciation, etc.)")
    description: str = Field(..., description="Description of the error")
    frequency: int = Field(..., ge=0, description="How many times this error occurred")
    examples: List[str] = Field(default=[], max_items=3, description="Example instances")
    suggestions: List[str] = Field(default=[], description="Improvement suggestions")


class DetailedErrorAnalysis(BaseModel):
    """Comprehensive error analysis for a student"""
    student_id: int
    student_name: str
    total_errors: int = Field(..., ge=0)
    error_patterns: List[ErrorPattern]
    most_common_errors: List[str] = Field(default=[], max_items=5)
    improvement_suggestions: List[str] = Field(default=[])


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
    skills: List[SkillBreakdown]
    
    # Exam performance
    midterm_score: Optional[float] = Field(None, ge=0, le=100)
    final_score: Optional[float] = Field(None, ge=0, le=100)
    
    # Trends and support
    overall_trend: TrendType
    support_level: SupportLevel
    support_reasons: List[str] = Field(default=[])
    
    # Recent activity
    last_submission_date: Optional[datetime] = None
    days_since_last_submission: Optional[int] = None
    
    # Feedback summary
    recent_feedback: List[str] = Field(default=[], max_items=3)
    error_analysis: Optional[DetailedErrorAnalysis] = None


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
    skill_averages: Dict[str, float] = Field(
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
    exercise_breakdown: Dict[str, int] = Field(
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
    weakest_skills: List[str] = Field(default=[])
    reasons: List[str] = Field(default=[])
    recommendations: List[str] = Field(default=[])
    
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
    
    urgent_support: List[StudentSupportInfo] = Field(default=[])
    moderate_support: List[StudentSupportInfo] = Field(default=[])
    doing_well: List[StudentSupportInfo] = Field(default=[])
    
    summary: Dict[str, int] = Field(
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
    average_score_this_week: Optional[float] = Field(None, ge=0, le=100)
    skills_practiced: List[str] = Field(default=[])
    
    # Comparison
    improvement_from_last_week: Optional[float] = None  # percentage change
    
    # Detailed feedback
    strengths: List[str] = Field(default=[])
    areas_for_improvement: List[str] = Field(default=[])
    teacher_recommendations: List[str] = Field(default=[])
    
    # Error analysis
    common_errors_this_week: List[str] = Field(default=[])
    
    # Overall assessment
    performance_level: Literal["excellent", "good", "average", "needs_improvement", "at_risk"]
    next_week_focus: List[str] = Field(default=[])


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
    highest_score: Optional[float] = Field(None, ge=0, le=100)
    lowest_score: Optional[float] = Field(None, ge=0, le=100)
    
    # Skills performance this week
    skills_performance: Dict[str, float] = Field(default={})
    
    # Individual reports
    student_reports: List[WeeklyStudentReport]
    
    # Class-wide insights
    class_strengths: List[str] = Field(default=[])
    class_weaknesses: List[str] = Field(default=[])
    most_common_errors: List[str] = Field(default=[])
    
    # Recommendations
    teaching_recommendations: List[str] = Field(default=[])


# ==================== DETAILED STUDENT ANALYSIS ====================

class SubmissionDetail(BaseModel):
    """Detailed information about a single submission"""
    submission_id: int
    exercise_title: str
    exercise_type: ExerciseType
    skill_type: SkillType
    score: Optional[float] = Field(None, ge=0)
    max_score: float = Field(..., gt=0)
    percentage: float = Field(..., ge=0, le=100)
    
    # Feedback
    teacher_feedback: Optional[str] = None
    ai_feedback: Optional[str] = None
    
    # Error analysis
    errors_identified: List[str] = Field(default=[])
    
    # Dates
    submitted_at: datetime
    graded_at: Optional[datetime] = None


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
    skills_breakdown: List[SkillBreakdown]
    
    # Recent submissions
    recent_submissions: List[SubmissionDetail] = Field(default=[], max_items=10)
    
    # Exam performance
    midterm_performance: Optional[Dict[str, float]] = None  # Scores by skill
    final_performance: Optional[Dict[str, float]] = None    # Scores by skill
    
    # Error analysis
    error_analysis: DetailedErrorAnalysis
    
    # Progress tracking
    monthly_progress: List[Dict[str, float]] = Field(
        default=[],
        description="Score trends over months"
    )
    
    # Support and recommendations
    support_level: SupportLevel
    support_reasons: List[str] = Field(default=[])
    personalized_recommendations: List[str] = Field(default=[])
    
    # Engagement metrics
    attendance_rate: Optional[float] = Field(None, ge=0, le=100)
    participation_score: Optional[float] = Field(None, ge=0, le=100)
    last_activity: Optional[datetime] = None


# ==================== EXPORT OPTIONS ====================

class ReportExportRequest(BaseModel):
    """Request parameters for report export"""
    class_id: int
    report_type: Literal["weekly", "monthly", "semester", "student_individual"]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    student_ids: Optional[List[int]] = Field(None, description="For individual student reports")
    include_error_analysis: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)
    format: Literal["xlsx", "pdf"] = Field(default="xlsx")


