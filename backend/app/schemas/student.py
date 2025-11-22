from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

# ============= Classroom Schemas =============

class ClassroomBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    max_students: int | None = None
    schedule: str | None = None

class ClassroomCreate(ClassroomBase):
    teacher_id: int | None = None

class ClassroomUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    max_students: int | None = None
    schedule: str | None = None
    status: str | None = None

class ClassroomResponse(ClassroomBase):
    id: int
    teacher_id: int | None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None
    student_count: int | None = 0

    class Config:
        from_attributes = True

class ClassroomListResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    schedule: str | None = None
    max_students: int | None = None
    student_count: int
    teacher_name: str | None = None
    subject: str | None = None
    grade: str | None = None
    skill: str | None = None
    image: str | None = "📚"
    color: str | None = "blue"

    class Config:
        from_attributes = True

# ============= Enrollment Schemas =============

class EnrollmentCreate(BaseModel):
    class_id: int

class EnrollmentResponse(BaseModel):
    id: int
    class_id: int
    user_id: int
    role: str
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True


# ============= Class Students Management (Teacher/Admin) =============

class AddStudentsRequest(BaseModel):
    identifiers: list[str]
    idType: str = Field("username", pattern=r"^(username|email|id)$")
    role: str = Field("student", pattern=r"^(student)$")
    status: str = Field("active", pattern=r"^(active|inactive)$")


class ClassStudentOut(BaseModel):
    id: int
    username: str
    name: str | None = None
    email: EmailStr | None = None
    status: str
    joined_at: datetime | None = None

    class Config:
        from_attributes = True


# ============= Attendance Schemas =============

class AttendanceRecordItem(BaseModel):
    userId: int
    status: str = Field("present", pattern=r"^(present|absent|late|excused)$")
    note: str | None = None


class AttendanceUpsertRequest(BaseModel):
    date: str  # YYYY-MM-DD
    records: list[AttendanceRecordItem]


class AttendanceRecordOut(BaseModel):
    userId: int
    status: str
    note: str | None = None


# ============= Video Lesson Schemas =============

class VideoLessonResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    slides_metadata: list[str] | None = None
    duration_seconds: int | None = None
    status: str
    progress: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Lesson Schemas =============

class LessonBase(BaseModel):
    title: str
    content: str | None = None
    order_index: int | None = None

class LessonCreate(LessonBase):
    class_id: int | None = None

class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    order_index: int | None = None

class LessonResponse(LessonBase):
    id: int
    class_id: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    video_lessons: list[VideoLessonResponse] = []

    class Config:
        from_attributes = True

class LessonListResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str | None
    grade: str | None
    difficulty: str | None
    lessons: int
    duration: str | None
    progress: int = 0
    image: str | None = "📚"
    color: str | None = "blue"
    chapters: list[dict] | None = []

    class Config:
        from_attributes = True

# ============= Exercise Schemas =============

class QuestionItem(BaseModel):
    id: str
    question: str
    type: str  # multiple_choice | fill_blank | true_false | short_answer
    options: list[str] | None = None
    points: int
    correct_answer: str | None = None  # For teacher/creation only

class ExerciseContentListening(BaseModel):
    audio_url: str
    transcript: str | None = None
    show_transcript: bool = False
    questions: list[QuestionItem]

class ExerciseContentSpeaking(BaseModel):
    prompt: str
    instructions: list[str]
    prep_time: int  # seconds
    max_duration: int  # seconds
    sample_answer: str | None = None

class ExerciseContentReading(BaseModel):
    passage: str
    word_count: int
    questions: list[QuestionItem]

class ExerciseContentWriting(BaseModel):
    prompt: str
    instructions: list[str]
    word_limit: dict  # {"min": 150, "max": 250}
    sample_essay: str | None = None

class ExerciseBase(BaseModel):
    title: str
    description: str | None = None
    type: str = "assignment"  # assignment | quiz | test
    skill_type: str | None = None  # listening | speaking | reading | writing | mixed
    max_score: float | None = None
    duration: int | None = None  # minutes
    content: dict | None = None  # JSON content based on skill_type

class ExerciseCreate(ExerciseBase):
    class_id: int | None = None
    lesson_id: int | None = None
    due_at: datetime | None = None
    enable_ai_grading: bool = False
    rubrics: dict | None = None

class ExerciseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    max_score: float | None = None
    due_at: datetime | None = None
    content: dict | None = None
    duration: int | None = None

class ExerciseResponse(ExerciseBase):
    id: int
    class_id: int | None
    lesson_id: int | None
    due_at: datetime | None
    created_at: datetime
    enable_ai_grading: bool

    class Config:
        from_attributes = True


class SubmissionSummary(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: str | None = None
    content_url: str | None = None
    answers: dict | None = None
    score: float | None = None
    ai_score: float | None = None
    feedback: str | None = None
    ai_feedback: str | None = None
    rubrics_scores: dict | None = None
    status: str
    grading_status: str | None = None
    teacher_reviewed: bool | None = None
    submitted_at: datetime | None = None
    graded_at: datetime | None = None
    ai_graded_at: datetime | None = None

    class Config:
        from_attributes = True


class ExerciseWithSubmissionResponse(ExerciseResponse):
    my_submission: SubmissionSummary | None = None

    class Config:
        from_attributes = True

class ExerciseListResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str | None
    grade: str | None
    difficulty: str | None
    questions: int
    timeLimit: int
    image: str | None = "✏️"
    color: str | None = "blue"
    completed: bool = False
    score: int | None = None

    class Config:
        from_attributes = True

# ============= Material Schemas =============

class MaterialBase(BaseModel):
    title: str
    type: str = "file"
    url: str | None = None
    file_path: str | None = None
    description: str | None = None

class MaterialCreate(MaterialBase):
    class_id: int | None = None
    lesson_id: int | None = None

class MaterialUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    url: str | None = None
    lesson_id: int | None = None

class MaterialResponse(MaterialBase):
    id: int
    class_id: int | None
    lesson_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialListResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str | None
    grade: str | None
    difficulty: str | None
    lessons: int
    duration: str | None
    progress: int = 0
    image: str | None = "📚"
    color: str | None = "blue"
    chapters: list[dict] | None = []

    class Config:
        from_attributes = True

# ============= Discussion Schemas =============

class DiscussionThreadCreate(BaseModel):
    title: str
    class_id: int | None = None
    subject: str | None = None  # Kĩ năng nghe/nói/đọc/viết (label hiển thị)
    content: str | None = None  # Nội dung câu hỏi ban đầu (tạo post đầu tiên)

class DiscussionPostCreate(BaseModel):
    content: str
    parent_post_id: int | None = None

class DiscussionPostResponse(BaseModel):
    id: int
    thread_id: int
    author_id: int | None
    content: str
    parent_post_id: int | None
    created_at: datetime
    author_name: str | None
    author_role: str | None
    author_avatar: str | None

    class Config:
        from_attributes = True

class DiscussionThreadResponse(BaseModel):
    id: int
    class_id: int | None
    title: str
    created_by: int | None
    created_at: datetime
    post_count: int = 0
    latest_post: DiscussionPostResponse | None = None

    class Config:
        from_attributes = True

class DiscussionListResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    authorUsername: str  # Username for comparison
    authorRole: str
    subject: str | None
    grade: str | None
    tags: list[str] = []
    answers: int = 0
    views: int = 0
    likes: int = 0
    isLiked: bool = False  # Whether current user liked this
    createdAt: str
    isAnswered: bool = False
    isVip: bool = False
    avatar: str | None = "👤"

    class Config:
        from_attributes = True

# ============= News Schemas =============

class NewsPostCreate(BaseModel):
    title: str
    content: str
    status: str = "published"

class NewsPostUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    status: str | None = None

class NewsPostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int | None
    status: str
    published_at: datetime | None
    created_at: datetime
    views: int | None = 0
    likes: int | None = 0

    class Config:
        from_attributes = True

class NewsListResponse(BaseModel):
    id: int
    title: str
    description: str
    content: str
    icon: str | None = "📰"
    type: str = "announcement"
    category: str
    date: str
    image: str | None
    views: int | None = 0
    likes: int | None = 0
    reading_time: int | None = 5
    author_name: str | None = "Admin"
    author_role: str | None = "admin"

    class Config:
        from_attributes = True

class NewsCreate(BaseModel):
    title: str
    description: str | None = ""
    content: str
    icon: str | None = "📰"
    type: str = "announcement"
    category: str = "Thông báo"
    image: str | None = None
    status: str = "published"

class NewsUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    content: str | None = None
    icon: str | None = None
    type: str | None = None
    category: str | None = None
    image: str | None = None
    status: str | None = None


# ============= News Management (Admin/Teacher) =============

class NewsStatusUpdate(BaseModel):
    status: str  # draft | published | archived


class NewsManageItem(BaseModel):
    id: int
    title: str
    description: str | None
    content: str
    category: str
    icon: str | None = None
    type: str | None = None
    image: str | None = None
    status: str
    views: int = 0
    likes: int = 0
    reading_time: int | None = 5
    author_name: str | None = None
    author_id: int | None = None
    published_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class NewsManageListResponse(BaseModel):
    items: list[NewsManageItem]
    total: int
    skip: int
    limit: int
