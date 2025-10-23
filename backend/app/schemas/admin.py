from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


# -------- Users (Manage Accounts) --------

class AdminUserBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    role: str = Field(..., pattern=r"^(user|parent|teacher|admin|superadmin)$")
    status: str = Field(..., pattern=r"^(active|inactive)$")


class AdminUserCreate(AdminUserBase):
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=30,
        description="Optional username; defaults to email local-part if omitted",
    )
    password: str = Field(..., min_length=6)


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern=r"^(user|parent|teacher|admin|superadmin)$")
    status: Optional[str] = Field(None, pattern=r"^(active|inactive)$")
    password: Optional[str] = Field(None, min_length=6)


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
    teacherId: Optional[int] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    skill: Optional[str] = Field(None, pattern=r"^(listening|speaking|reading|writing)$")
    maxStudents: Optional[int] = None
    schedule: Optional[str] = None
    status: str = Field("active", pattern=r"^(active|inactive)$")
    description: Optional[str] = None


class AdminClassCreate(AdminClassBase):
    pass


class AdminClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    teacherId: Optional[int] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    skill: Optional[str] = Field(None, pattern=r"^(listening|speaking|reading|writing)$")
    maxStudents: Optional[int] = None
    schedule: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(active|inactive)$")
    description: Optional[str] = None


class AdminClassOut(BaseModel):
    id: int
    name: str
    code: str
    teacher: Optional[str] = None
    teacherId: Optional[int] = None
    grade: Optional[int] = None
    skill: Optional[str] = None
    students: int
    maxStudents: Optional[int] = None
    schedule: Optional[str] = None
    status: str
    description: Optional[str] = None

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

