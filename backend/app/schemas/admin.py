
from pydantic import BaseModel, EmailStr, Field

# -------- Users (Manage Accounts) --------

class AdminUserBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    role: str = Field(..., pattern=r"^(user|parent|teacher|admin|superadmin)$")
    status: str = Field(..., pattern=r"^(active|inactive)$")


class AdminUserCreate(AdminUserBase):
    username: str | None = Field(
        None,
        min_length=3,
        max_length=30,
        description="Optional username; defaults to email local-part if omitted",
    )
    password: str = Field(..., min_length=6)


class AdminUserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = Field(None, pattern=r"^(user|parent|teacher|admin|superadmin)$")
    status: str | None = Field(None, pattern=r"^(active|inactive)$")
    password: str | None = Field(None, min_length=6)


class AdminUserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str
    classes: int
    students: int
    joinDate: str

    class Config:
        from_attributes = True


class AdminTeacherOut(BaseModel):
    id: int
    name: str


# -------- Classes (Manage Classes) --------

class AdminClassBase(BaseModel):
    name: str
    code: str
    teacherId: int | None = None
    grade: int | None = Field(None, ge=1, le=12)
    skill: str | None = Field(None, pattern=r"^(listening|speaking|reading|writing)$")
    maxStudents: int | None = None
    schedule: str | None = None
    status: str = Field("active", pattern=r"^(active|inactive)$")
    description: str | None = None


class AdminClassCreate(AdminClassBase):
    pass


class AdminClassUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    teacherId: int | None = None
    grade: int | None = Field(None, ge=1, le=12)
    skill: str | None = Field(None, pattern=r"^(listening|speaking|reading|writing)$")
    maxStudents: int | None = None
    schedule: str | None = None
    status: str | None = Field(None, pattern=r"^(active|inactive)$")
    description: str | None = None


class AdminClassOut(BaseModel):
    id: int
    name: str
    code: str
    teacher: str | None = None
    teacherId: int | None = None
    grade: int | None = None
    skill: str | None = None
    students: int
    maxStudents: int | None = None
    schedule: str | None = None
    status: str
    description: str | None = None

    class Config:
        from_attributes = True


# -------- Stats (Overview) --------

class AdminOverviewStats(BaseModel):
    totalUsers: int
    totalTeachers: int
    totalStudents: int
    activeUsers: int
    totalClasses: int
    activeClasses: int
    averageStudents: float

