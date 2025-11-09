from datetime import datetime

from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    title: str
    description: str | None = None
    grade: int = Field(ge=1, le=12)
    skill: str = Field(pattern=r"^(listening|speaking|reading|writing|vocabulary|grammar)$")
    level: str | None = None
    is_active: bool | None = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    grade: int | None = Field(default=None, ge=1, le=12)
    skill: str | None = Field(default=None, pattern=r"^(listening|speaking|reading|writing|vocabulary|grammar)$")
    level: str | None = None
    is_active: bool | None = None


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
    instructor: str | None = None
    level: str | None = None


class CourseResponse(CourseBase):
    id: int
    created_by: int | None
    created_at: datetime
    updated_at: datetime | None
    is_premium: bool = False

    class Config:
        from_attributes = True


class CourseExerciseBase(BaseModel):
    title: str
    description: str | None = None
    type: str = "assignment"
    max_score: int | None = None
    order_index: int | None = None
    content: dict | None = None  # question configuration (skill-specific)


class CourseExerciseCreate(CourseExerciseBase):
    pass


class CourseExerciseResponse(CourseExerciseBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CourseSubmissionCreate(BaseModel):
    content_text: str | None = None
    content_url: str | None = None
    score: int | None = None
    time_spent: int | None = None


class CourseSubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: str | None
    content_url: str | None
    score: int | None
    feedback: str | None
    status: str
    submitted_at: datetime
    graded_at: datetime | None
    time_spent: int | None

    class Config:
        from_attributes = True


# ============= Units (Lessons) & Questions =============

class CourseUnitBase(BaseModel):
    title: str
    description: str | None = None
    week_index: int | None = None
    order_index: int | None = None


class CourseUnitCreate(CourseUnitBase):
    pass


class CourseUnitResponse(CourseUnitBase):
    id: int
    course_id: int
    created_at: datetime
    questions: int | None = 0

    class Config:
        from_attributes = True


class CourseQuestionBase(BaseModel):
    type: str = Field(pattern=r"^(mcq|fill-blank|short|mcq-audio|dictation|prompt|essay)$")
    prompt: str
    options: list[str] | None = None
    answer: dict | None = None
    media_url: str | None = None
    points: int | None = None
    order_index: int | None = None


class CourseQuestionCreate(CourseQuestionBase):
    pass


class CourseQuestionResponse(CourseQuestionBase):
    id: int
    unit_id: int
    created_at: datetime

    class Config:
        from_attributes = True
