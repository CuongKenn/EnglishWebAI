import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    User roles in the system.
    Note: USER role represents STUDENTS in the application
    (for backwards compatibility, database uses 'user' but displays as 'student')
    """
    USER = "user"  # Students - displayed as "student" in UI
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

    @property
    def display_name(self) -> str:
        """Get user-friendly display name for the role"""
        if self == UserRole.USER:
            return "student"
        return self.value

    @classmethod
    def from_string(cls, role_str: str) -> 'UserRole':
        """
        Create UserRole from string, supporting 'student' alias

        Args:
            role_str: Role as string ('student', 'user', 'teacher', etc.)

        Returns:
            UserRole enum

        Examples:
            UserRole.from_string("student") -> UserRole.USER
            UserRole.from_string("user") -> UserRole.USER
        """
        role_str_lower = role_str.lower()

        # Map 'student' to USER
        if role_str_lower == "student":
            return cls.USER

        # Try direct mapping
        try:
            return cls(role_str_lower)
        except ValueError:
            raise ValueError(
                f"Invalid role: {role_str}. "
                f"Valid roles: student, user, parent, teacher, admin, superadmin"
            )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
