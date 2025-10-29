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
from app.models.discussion_like import DiscussionLike
from app.models.news import NewsPost
from app.models.news_like import NewsLike
from app.models.attendance import AttendanceRecord
from app.models.otp import OTP
from app.models.notification import Notification
from app.models.message import Message
from app.models.system_config import SystemConfig
from app.models.course import Course, CourseExercise, CourseSubmission, CourseUnit, CourseQuestion
from app.models.question_bank import QuestionBankItem
from app.models.question_bank_test import QuestionBankTest
from app.models.lesson_plan import LessonPlan
from app.models.worksheet import Worksheet
from app.models.weekly_assessment import WeeklyAssessment

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
    "DiscussionLike",
    "NewsPost",
    "NewsLike",
    "AttendanceRecord",
    "OTP",
    "Notification",
    "Message",
    "SystemConfig",
    "Course",
    "CourseExercise",
    "CourseSubmission",
    "CourseUnit",
    "CourseQuestion",
    "QuestionBankItem",
    "LessonPlan",
    "Worksheet",
    "WeeklyAssessment",
]
