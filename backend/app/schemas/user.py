from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """
    User roles for API schemas.
    Note: 'user' role represents students (for database compatibility)
    API accepts both 'student' and 'user' as valid values
    """
    USER = "user"  # Students (accepts 'student' or 'user' in API)
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"
    
    @classmethod
    def normalize(cls, value: str) -> 'UserRole':
        """Normalize role value, accepting 'student' as alias for 'user'"""
        if value.lower() == "student":
            return cls.USER
        return cls(value.lower())

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    phone: Optional[str] = None

# Schema for creating a user
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# Schema for updating a user
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

# Schema for user in database
class UserInDB(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema for user response
class User(UserInDB):
    pass

# Schema for password change
class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

# Schema for linking parent
class LinkParentRequest(BaseModel):
    parent_email: EmailStr

# Schema for parent-student link response
class ParentStudentLink(BaseModel):
    id: int
    parent_id: int
    student_id: int
    is_verified: bool
    created_at: datetime
    verified_at: Optional[datetime] = None
    parent: Optional[User] = None
    student: Optional[User] = None

    class Config:
        from_attributes = True
