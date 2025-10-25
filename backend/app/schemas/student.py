from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# ============= Classroom Schemas =============

class ClassroomBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    max_students: Optional[int] = None
    schedule: Optional[str] = None

class ClassroomCreate(ClassroomBase):
    teacher_id: Optional[int] = None

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_students: Optional[int] = None
    schedule: Optional[str] = None
    status: Optional[str] = None

class ClassroomResponse(ClassroomBase):
    id: int
    teacher_id: Optional[int]
    status: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ClassroomListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    schedule: Optional[str] = None
    max_students: Optional[int] = None
    student_count: int
    teacher_name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    skill: Optional[str] = None
    image: Optional[str] = "📚"
    color: Optional[str] = "blue"

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
    identifiers: List[str]
    idType: str = Field("username", pattern=r"^(username|email|id)$")
    role: str = Field("student", pattern=r"^(student)$")
    status: str = Field("active", pattern=r"^(active|inactive)$")


class ClassStudentOut(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    status: str
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============= Attendance Schemas =============

class AttendanceRecordItem(BaseModel):
    userId: int
    status: str = Field("present", pattern=r"^(present|absent|late|excused)$")
    note: Optional[str] = None


class AttendanceUpsertRequest(BaseModel):
    date: str  # YYYY-MM-DD
    records: List[AttendanceRecordItem]


class AttendanceRecordOut(BaseModel):
    userId: int
    status: str
    note: Optional[str] = None


# ============= Lesson Schemas =============

class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    order_index: Optional[int] = None

class LessonCreate(LessonBase):
    class_id: Optional[int] = None

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order_index: Optional[int] = None

class LessonResponse(LessonBase):
    id: int
    class_id: int
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class LessonListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    grade: Optional[str]
    difficulty: Optional[str]
    lessons: int
    duration: Optional[str]
    progress: int = 0
    image: Optional[str] = "📚"
    color: Optional[str] = "blue"
    chapters: Optional[List[dict]] = []

    class Config:
        from_attributes = True

# ============= Exercise Schemas =============

class ExerciseBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "assignment"
    max_score: Optional[int] = None

class ExerciseCreate(ExerciseBase):
    class_id: Optional[int] = None
    lesson_id: Optional[int] = None

class ExerciseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    max_score: Optional[int] = None

class ExerciseResponse(ExerciseBase):
    id: int
    class_id: Optional[int]
    lesson_id: Optional[int]
    due_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ExerciseListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    grade: Optional[str]
    difficulty: Optional[str]
    questions: int
    timeLimit: int
    image: Optional[str] = "✏️"
    color: Optional[str] = "blue"
    completed: bool = False
    score: Optional[int] = None

    class Config:
        from_attributes = True

# ============= Material Schemas =============

class MaterialBase(BaseModel):
    title: str
    type: str = "file"
    url: Optional[str] = None
    file_path: Optional[str] = None
    description: Optional[str] = None

class MaterialCreate(MaterialBase):
    class_id: Optional[int] = None
    lesson_id: Optional[int] = None

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    lesson_id: Optional[int] = None

class MaterialResponse(MaterialBase):
    id: int
    class_id: Optional[int]
    lesson_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class MaterialListResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    grade: Optional[str]
    difficulty: Optional[str]
    lessons: int
    duration: Optional[str]
    progress: int = 0
    image: Optional[str] = "📚"
    color: Optional[str] = "blue"
    chapters: Optional[List[dict]] = []

    class Config:
        from_attributes = True

# ============= Discussion Schemas =============

class DiscussionThreadCreate(BaseModel):
    title: str
    class_id: Optional[int] = None

class DiscussionPostCreate(BaseModel):
    content: str
    parent_post_id: Optional[int] = None

class DiscussionPostResponse(BaseModel):
    id: int
    thread_id: int
    author_id: Optional[int]
    content: str
    parent_post_id: Optional[int]
    created_at: datetime
    author_name: Optional[str]
    author_role: Optional[str]
    author_avatar: Optional[str]

    class Config:
        from_attributes = True

class DiscussionThreadResponse(BaseModel):
    id: int
    class_id: Optional[int]
    title: str
    created_by: Optional[int]
    created_at: datetime
    post_count: int = 0
    latest_post: Optional[DiscussionPostResponse] = None

    class Config:
        from_attributes = True

class DiscussionListResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    authorUsername: str  # Username for comparison
    authorRole: str
    subject: Optional[str]
    grade: Optional[str]
    tags: List[str] = []
    answers: int = 0
    views: int = 0
    likes: int = 0
    isLiked: bool = False  # Whether current user liked this
    createdAt: str
    isAnswered: bool = False
    isVip: bool = False
    avatar: Optional[str] = "👤"

    class Config:
        from_attributes = True

# ============= News Schemas =============

class NewsPostCreate(BaseModel):
    title: str
    content: str
    status: str = "published"

class NewsPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None

class NewsPostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: Optional[int]
    status: str
    published_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class NewsListResponse(BaseModel):
    id: int
    title: str
    description: str
    content: str
    icon: Optional[str] = "📰"
    type: str = "announcement"
    category: str
    date: str
    image: Optional[str]

    class Config:
        from_attributes = True

class NewsCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    content: str
    icon: Optional[str] = "📰"
    type: str = "announcement"
    category: str = "Thông báo"
    image: Optional[str] = None
    status: str = "published"

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    icon: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    status: Optional[str] = None
