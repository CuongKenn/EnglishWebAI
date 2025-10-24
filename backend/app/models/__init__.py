"""Models package initialization

Import all models here so that metadata is aware of all tables
before create_all() runs.
"""

from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.material import Material
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.discussion import DiscussionThread, DiscussionPost
from app.models.news import NewsPost
from app.models.attendance import AttendanceRecord
from app.models.otp import OTP

__all__ = [
    "User",
    "Classroom",
    "Enrollment",
    "Lesson",
    "Material",
    "Exercise",
    "Submission",
    "DiscussionThread",
    "DiscussionPost",
    "NewsPost",
    "AttendanceRecord",
    "OTP",
]
