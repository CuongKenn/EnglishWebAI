"""
Teacher Dashboard Router
Provides overview statistics and data for teacher dashboard
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.question_bank import QuestionBankItem

router = APIRouter(prefix="/api/v1/teacher/dashboard", tags=["Teacher Dashboard"])


class DashboardStats(BaseModel):
    total_classes: int
    total_students: int
    total_tests: int
    total_questions: int


class RecentActivity(BaseModel):
    id: int
    title: str
    time: str
    status: str  # 'completed', 'info', 'pending'


class UpcomingTest(BaseModel):
    id: int
    class_name: str
    title: str
    date: str
    students: int


class DashboardOverview(BaseModel):
    stats: DashboardStats
    recent_activities: List[RecentActivity]
    upcoming_tests: List[UpcomingTest]


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete teacher dashboard overview data
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"[DASHBOARD] Fetching overview for user_id={current_user.id}, role={current_user.role}")
    
    try:
        # Get teacher's classes
        classes = db.query(Classroom).filter(
            Classroom.teacher_id == current_user.id
        ).all()
        
        print(f"[DASHBOARD] Found {len(classes)} classes for teacher {current_user.id}")
        
        class_ids = [c.id for c in classes]
        total_classes = len(classes)
        
        print(f"[DASHBOARD] class_ids: {class_ids}")
        
        # Count total students (active enrollments with role='student')
        # Use DISTINCT to count unique students (1 student in 2 classes = 1 student)
        total_students = 0
        if class_ids:
            total_students = db.query(func.count(func.distinct(Enrollment.user_id))).filter(
                Enrollment.class_id.in_(class_ids),
                Enrollment.role == "student",
                Enrollment.status == "active"
            ).scalar() or 0
            print(f"[DASHBOARD] Found {total_students} unique students")
        
        # Count total tests (exercises + exam assessments)
        total_exercises = 0
        total_exams = 0
        if class_ids:
            total_exercises = db.query(func.count(Exercise.id)).filter(
                Exercise.class_id.in_(class_ids)
            ).scalar() or 0
            
            total_exams = db.query(func.count(ExamAssessment.id)).filter(
                ExamAssessment.class_id.in_(class_ids)
            ).scalar() or 0
        
        total_tests = total_exercises + total_exams
        
        # Count total questions in question bank (created by teacher)
        total_questions = db.query(func.count(QuestionBankItem.id)).filter(
            QuestionBankItem.owner_id == current_user.id
        ).scalar() or 0
        
        print(f"[DASHBOARD] Stats - classes:{total_classes}, students:{total_students}, tests:{total_tests}, questions:{total_questions}")
        
        # Get recent activities (last 10)
        recent_activities = []
        
        # Recent submissions (completed)
        if class_ids:
            recent_submissions = db.query(
                Submission.id,
                Submission.submitted_at,
                User.full_name,
                User.username,
                Exercise.title
            ).join(Exercise, Exercise.id == Submission.exercise_id
            ).join(User, User.id == Submission.student_id
            ).filter(
                Exercise.class_id.in_(class_ids),
                Submission.status == "submitted"
            ).order_by(desc(Submission.submitted_at)
            ).limit(5).all()
            
            for sub_id, submitted_at, full_name, username, ex_title in recent_submissions:
                time_ago = get_time_ago(submitted_at)
                student_name = full_name or username
                recent_activities.append(RecentActivity(
                    id=sub_id,
                    title=f"{student_name} đã nộp bài {ex_title}",
                    time=time_ago,
                    status="completed"
                ))
        
        # Recent exercises created
        if class_ids:
            recent_exercises = db.query(
                Exercise.id,
                Exercise.created_at,
                Exercise.title
            ).filter(
                Exercise.class_id.in_(class_ids)
            ).order_by(desc(Exercise.created_at)
            ).limit(3).all()
            
            for ex_id, created_at, title in recent_exercises:
                time_ago = get_time_ago(created_at)
                recent_activities.append(RecentActivity(
                    id=ex_id,
                    title=f'Bài tập "{title}" đã được tạo',
                    time=time_ago,
                    status="info"
                ))
        
        # Pending grading (submissions waiting for grade)
        if class_ids:
            pending_count = db.query(func.count(Submission.id)).join(
                Exercise, Exercise.id == Submission.exercise_id
            ).filter(
                Exercise.class_id.in_(class_ids),
                Submission.status == "submitted",
                Submission.score == None
            ).scalar() or 0
            
            if pending_count > 0:
                recent_activities.append(RecentActivity(
                    id=0,
                    title=f"Có {pending_count} bài cần chấm điểm",
                    time="Chờ xử lý",
                    status="pending"
                ))
        
        # Sort activities by time (most recent first)
        recent_activities.sort(key=lambda x: x.id, reverse=True)
        recent_activities = recent_activities[:10]
        
        # Get upcoming tests (exercises with due date in future)
        upcoming_tests = []
        if class_ids:
            from datetime import timezone
            now = datetime.now(timezone.utc)
            future_exercises = db.query(
                Exercise.id,
                Exercise.title,
                Exercise.due_at,
                Exercise.class_id,
                Classroom.name
            ).join(Classroom, Classroom.id == Exercise.class_id
            ).filter(
                Exercise.class_id.in_(class_ids),
                Exercise.due_at != None,
                Exercise.due_at > now
            ).order_by(Exercise.due_at.asc()
            ).limit(5).all()
            
            for ex_id, title, due_at, class_id, class_name in future_exercises:
                # Count students in class
                student_count = db.query(func.count(Enrollment.id)).filter(
                    Enrollment.class_id == class_id,
                    Enrollment.role == "student",
                    Enrollment.status == "active"
                ).scalar() or 0
                
                due_date_str = due_at.strftime("%d/%m/%Y")
                
                upcoming_tests.append(UpcomingTest(
                    id=ex_id,
                    class_name=class_name,
                    title=title,
                    date=due_date_str,
                    students=student_count
                ))
        
        # Get upcoming exam assessments
        if class_ids:
            from datetime import timezone
            now = datetime.now(timezone.utc)
            future_exams = db.query(
                ExamAssessment.id,
                ExamAssessment.title,
                ExamAssessment.end_time,
                ExamAssessment.class_id,
                Classroom.name
            ).join(Classroom, Classroom.id == ExamAssessment.class_id
            ).filter(
                ExamAssessment.class_id.in_(class_ids),
                ExamAssessment.end_time != None,
                ExamAssessment.end_time > now
            ).order_by(ExamAssessment.end_time.asc()
            ).limit(3).all()
            
            for exam_id, title, end_time, class_id, class_name in future_exams:
                # Count students in class
                student_count = db.query(func.count(Enrollment.id)).filter(
                    Enrollment.class_id == class_id,
                    Enrollment.role == "student",
                    Enrollment.status == "active"
                ).scalar() or 0
                
                end_time_str = end_time.strftime("%d/%m/%Y")
                
                upcoming_tests.append(UpcomingTest(
                    id=exam_id + 10000,  # Offset to distinguish from exercises
                    class_name=class_name,
                    title=title,
                    date=end_time_str,
                    students=student_count
                ))
        
        # Sort upcoming tests by date
        upcoming_tests.sort(key=lambda x: x.date)
        upcoming_tests = upcoming_tests[:5]
        
        return DashboardOverview(
            stats=DashboardStats(
                total_classes=total_classes,
                total_students=total_students,
                total_tests=total_tests,
                total_questions=total_questions
            ),
            recent_activities=recent_activities,
            upcoming_tests=upcoming_tests
        )
    except Exception as e:
        print(f"[DASHBOARD] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty data instead of crashing
        return DashboardOverview(
            stats=DashboardStats(
                total_classes=0,
                total_students=0,
                total_tests=0,
                total_questions=0
            ),
            recent_activities=[],
            upcoming_tests=[]
        )


def get_time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable time ago string"""
    from datetime import timezone
    
    # Handle both naive and timezone-aware datetimes
    now = datetime.now(timezone.utc)
    
    # If dt is naive, make it timezone-aware (assume UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    diff = now - dt
    
    if diff.days > 0:
        if diff.days == 1:
            return "1 ngày trước"
        return f"{diff.days} ngày trước"
    
    hours = diff.seconds // 3600
    if hours > 0:
        if hours == 1:
            return "1 giờ trước"
        return f"{hours} giờ trước"
    
    minutes = diff.seconds // 60
    if minutes > 0:
        if minutes == 1:
            return "1 phút trước"
        return f"{minutes} phút trước"
    
    return "Vừa xong"
