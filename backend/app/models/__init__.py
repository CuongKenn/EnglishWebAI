"""Models package initialization

Import all models here so that metadata is aware of all tables
before create_all() runs.
"""

from app.models.attendance import AttendanceRecord
from app.models.classroom import Classroom
from app.models.course import Course, CourseExercise, CourseQuestion, CourseSubmission, CourseUnit
from app.models.course_content import (
    ListeningAudio,
    ListeningQuestion,
    ReadingParagraph,
    ReadingPassage,
    ReadingQuestion,
    SpeakingCriteria,
    SpeakingPrompt,
    WritingPrompt,
    WritingRubric,
)
from app.models.discussion import DiscussionPost, DiscussionThread
from app.models.discussion_like import DiscussionLike
from app.models.enhanced_weekly_assessment import EnhancedWeeklyAssessment, EnhancedWeeklySubmission
from app.models.enrollment import Enrollment
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.exam_monitoring import ExamMonitoringAlert
from app.models.exercise import Exercise
from app.models.grading_queue import GradingQueue
from app.models.lesson import Lesson
from app.models.lesson_plan import LessonPlan
from app.models.material import Material
from app.models.message import Message
from app.models.news import NewsPost
from app.models.news_like import NewsLike
from app.models.notification import Notification
from app.models.otp import OTP
from app.models.question_bank import QuestionBankItem
from app.models.question_bank_test import QuestionBankTest
from app.models.student_face_data import StudentFaceData
from app.models.submission import Submission
from app.models.system_config import SystemConfig
from app.models.user import User
from app.models.video_lesson import VideoLesson
from app.models.weekly_assessment import WeeklyAssessment, WeeklySubmission
from app.models.worksheet import Worksheet

__all__ = [
    "User",
    "Classroom",
    "Enrollment",
    "Lesson",
    "Material",
    "Exercise",
    "Submission",
    "GradingQueue",
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
    "ReadingPassage",
    "ReadingParagraph",
    "ReadingQuestion",
    "WritingPrompt",
    "WritingRubric",
    "ListeningAudio",
    "ListeningQuestion",
    "SpeakingPrompt",
    "SpeakingCriteria",
    "QuestionBankItem",
    "LessonPlan",
    "Worksheet",
    "WeeklyAssessment",
    "WeeklySubmission",
    "EnhancedWeeklyAssessment",
    "EnhancedWeeklySubmission",
    "ExamAssessment",
    "ExamSubmission",
    "ExamMonitoringAlert",
    "StudentFaceData",
    "VideoLesson",
]
