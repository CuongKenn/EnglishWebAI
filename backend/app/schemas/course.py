from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    grade: int = Field(ge=1, le=12)
    skill: str = Field(pattern=r"^(listening|speaking|reading|writing|vocabulary|grammar)$")
    level: Optional[str] = None
    is_active: Optional[bool] = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    grade: Optional[int] = Field(default=None, ge=1, le=12)
    skill: Optional[str] = Field(default=None, pattern=r"^(listening|speaking|reading|writing|vocabulary|grammar)$")
    level: Optional[str] = None
    is_active: Optional[bool] = None


class CourseListItem(BaseModel):
    id: int
    name: str
    category: str  # listening|speaking|reading|writing
    gradeLabel: str
    totalUnits: int
    completedUnits: int
    cupsEarned: int
    totalCups: int
    status: str  # completed|in-progress|not-started|locked
    instructor: Optional[str] = None
    level: Optional[str] = None


class CourseResponse(CourseBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    is_premium: bool = False

    class Config:
        from_attributes = True


class CourseExerciseBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "assignment"
    max_score: Optional[int] = None
    order_index: Optional[int] = None
    content: Optional[dict] = None  # question configuration (skill-specific)


class CourseExerciseCreate(CourseExerciseBase):
    pass


class CourseExerciseResponse(CourseExerciseBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CourseSubmissionCreate(BaseModel):
    content_text: Optional[str] = None
    content_url: Optional[str] = None


class CourseSubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: Optional[str]
    content_url: Optional[str]
    score: Optional[int]
    feedback: Optional[str]
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= Units (Lessons) & Questions =============

class CourseUnitBase(BaseModel):
    title: str
    description: Optional[str] = None
    week_index: Optional[int] = None
    order_index: Optional[int] = None


class CourseUnitCreate(CourseUnitBase):
    pass


class CourseUnitResponse(CourseUnitBase):
    id: int
    course_id: int
    created_at: datetime
    questions: Optional[int] = 0

    class Config:
        from_attributes = True


class CourseQuestionBase(BaseModel):
    type: str = Field(pattern=r"^(mcq|fill-blank|short|mcq-audio|dictation|prompt|essay)$")
    prompt: str
    options: Optional[List[str]] = None
    answer: Optional[dict] = None
    media_url: Optional[str] = None
    points: Optional[int] = None
    order_index: Optional[int] = None


class CourseQuestionCreate(CourseQuestionBase):
    pass


class CourseQuestionResponse(CourseQuestionBase):
    id: int
    unit_id: int
    created_at: datetime

    class Config:
        from_attributes = True
