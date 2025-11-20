import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta

from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.attendance import AttendanceRecord
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.message import Message
from app.models.notification import Notification
from app.models.parent_student import ParentStudent
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.services.parent_progress_export_service import ParentProgressExportService

router = APIRouter()

# Schemas
class ChildInfo(BaseModel):
    id: int
    name: str
    email: str
    username: str
    avatar_url: str | None = None
    grade: str | None = None
    total_classes: int
    completed_lessons: int
    total_lessons: int
    average_score: float

    class Config:
        from_attributes = True

class ActivityItem(BaseModel):
    type: str
    title: str
    subject: str
    class_name: str | None = None
    score: float | None = None
    max_score: float | None = None
    time: str
    status: str
    feedback: str | None = None
    skill_type: str | None = None

class TaskItem(BaseModel):
    type: str
    title: str
    subject: str
    class_name: str | None = None
    dueDate: str
    priority: str
    skill_type: str | None = None

class SubjectProgress(BaseModel):
    subject: str
    progress: int
    color: str
    average_score: float | None = None
    total_exercises: int
    completed_exercises: int

class AttendanceStats(BaseModel):
    present: int
    absent: int
    late: int
    total: int

class GradeDetail(BaseModel):
    exercise_id: int
    exercise_title: str
    skill_type: str | None = None
    score: float | None = None
    max_score: float | None = None
    feedback: str | None = None
    submitted_at: str | None = None
    graded_at: str | None = None

class ChildProgress(BaseModel):
    recent_activities: list[ActivityItem]
    upcoming_tasks: list[TaskItem]
    subject_progress: list[SubjectProgress]
    completed_lessons: int
    total_lessons: int
    attendance: AttendanceStats
    detailed_grades: list[GradeDetail]
    overall_average: float
    total_submissions: int

class DashboardSummary(BaseModel):
    total_children: int
    total_classes: int
    avg_score: float
    notifications_count: int
    messages_count: int
    completed_exercises: int
    total_exercises: int
    pending_exercises: int
    avg_progress: float

class PendingExercise(BaseModel):
    exercise_id: int
    title: str
    class_name: str | None = None
    skill_type: str | None = None
    due_date: str | None = None
    days_until_due: int | None = None
    priority: str

@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard summary statistics for parent"""
    try:
        if current_user.role != UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parents can access this endpoint"
            )

        # Get all children
        links = db.query(ParentStudent).filter(
            ParentStudent.parent_id == current_user.id,
            ParentStudent.is_verified
        ).all()

        child_ids = [link.student_id for link in links]
        total_children = len(child_ids)

        # Handle empty children case
        if not child_ids:
            # Count notifications
            notifications_count = db.query(func.count(Notification.id)).filter(
                Notification.user_id == current_user.id,
                not Notification.is_read
            ).scalar() or 0

            # Count messages
            messages_count = db.query(func.count(Message.id)).filter(
                Message.receiver_id == current_user.id,
                not Message.is_read
            ).scalar() or 0

            return DashboardSummary(
                total_children=0,
                total_classes=0,
                avg_score=0.0,
                notifications_count=notifications_count,
                messages_count=messages_count,
                completed_exercises=0,
                total_exercises=0,
                pending_exercises=0,
                avg_progress=0
            )

        # Count total classes
        total_classes = db.query(func.count(func.distinct(Enrollment.class_id))).filter(
            Enrollment.user_id.in_(child_ids)
        ).scalar() or 0

        # Calculate average score
        avg_score_result = db.query(
            func.avg(Submission.score)
        ).filter(
            Submission.student_id.in_(child_ids),
            Submission.score.isnot(None)
        ).scalar()
        avg_score = round(float(avg_score_result), 1) if avg_score_result else 0.0

        # Count notifications
        notifications_count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        ).scalar() or 0

        # Count messages
        messages_count = db.query(func.count(Message.id)).filter(
            Message.receiver_id == current_user.id,
            Message.is_read.is_(False)
        ).scalar() or 0

        # Get enrolled class IDs
        enrolled_class_ids = db.query(func.distinct(Enrollment.class_id)).filter(
            Enrollment.user_id.in_(child_ids)
        ).all()
        class_ids = [row[0] for row in enrolled_class_ids] if enrolled_class_ids else []

        # Count exercises
        if class_ids:
            all_exercises = db.query(Exercise).filter(
                Exercise.class_id.in_(class_ids)
            ).all()
            total_exercises = len(all_exercises)
        else:
            total_exercises = 0

        # Count completed exercises (submissions with score)
        completed_exercise_ids = db.query(func.distinct(Submission.exercise_id)).filter(
            Submission.student_id.in_(child_ids),
            Submission.score.isnot(None)
        ).all()
        completed_exercises = len(completed_exercise_ids)

        # Count pending exercises (exercises with due_date in future that haven't been submitted)
        now = datetime.now()
        pending_exercises = 0
        if class_ids:
            pending_exercises_query = db.query(Exercise).filter(
                Exercise.class_id.in_(class_ids),
                or_(
                    Exercise.due_at.is_(None),
                    Exercise.due_at > now
                )
            )

            # Get submitted exercise IDs
            submitted_exercise_ids_result = db.query(func.distinct(Submission.exercise_id)).filter(
                Submission.student_id.in_(child_ids)
            ).all()
            submitted_exercise_ids_list = [row[0] for row in submitted_exercise_ids_result]

            if submitted_exercise_ids_list:
                pending_exercises_query = pending_exercises_query.filter(
                    ~Exercise.id.in_(submitted_exercise_ids_list)
                )

            pending_exercises = pending_exercises_query.count()

        # Calculate average progress
        avg_progress = int(completed_exercises / total_exercises * 100) if total_exercises > 0 else 0

        return DashboardSummary(
            total_children=total_children,
            total_classes=total_classes,
            avg_score=avg_score,
            notifications_count=notifications_count,
            messages_count=messages_count,
            completed_exercises=completed_exercises,
            total_exercises=total_exercises,
            pending_exercises=pending_exercises,
            avg_progress=avg_progress
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.info(f"Error in get_dashboard_summary: {e}")
        logger.info(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard summary: {str(e)}"
        ) from e

@router.get("/pending-exercises", response_model=list[PendingExercise])
async def get_pending_exercises(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of pending (unfinished) exercises for all children"""
    try:
        if current_user.role != UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parents can access this endpoint"
            )

        # Get all children
        links = db.query(ParentStudent).filter(
            ParentStudent.parent_id == current_user.id,
            ParentStudent.is_verified
        ).all()

        child_ids = [link.student_id for link in links]
        if not child_ids:
            return []

        # Get enrolled class IDs
        enrolled_class_ids = db.query(func.distinct(Enrollment.class_id)).filter(
            Enrollment.user_id.in_(child_ids)
        ).all()
        class_ids = [row[0] for row in enrolled_class_ids] if enrolled_class_ids else []

        if not class_ids:
            return []

        # Get all exercises in enrolled classes
        now = datetime.now()
        exercises = db.query(Exercise).filter(
            Exercise.class_id.in_(class_ids),
            or_(
                Exercise.due_at.is_(None),
                Exercise.due_at > now
            )
        ).all()

        # Get submitted exercise IDs
        submitted_exercise_ids_result = db.query(func.distinct(Submission.exercise_id)).filter(
            Submission.student_id.in_(child_ids)
        ).all()
        submitted_exercise_ids = {row[0] for row in submitted_exercise_ids_result}

        # Filter pending exercises
        pending_exercises = []
        for exercise in exercises:
            if exercise.id not in submitted_exercise_ids:
                classroom = db.query(Classroom).filter(Classroom.id == exercise.class_id).first()

                # Calculate days until due
                days_until_due = None
                priority = "normal"
                if exercise.due_at:
                    days_until_due = (exercise.due_at - now).days
                    if days_until_due <= 2:
                        priority = "urgent"
                    elif days_until_due <= 5:
                        priority = "warning"
                    else:
                        priority = "normal"

                pending_exercises.append(PendingExercise(
                    exercise_id=exercise.id,
                    title=exercise.title,
                    class_name=classroom.name if classroom else None,
                    skill_type=exercise.skill_type,
                    due_date=exercise.due_at.strftime("%Y-%m-%d") if exercise.due_at else None,
                    days_until_due=days_until_due,
                    priority=priority
                ))

        # Sort by priority and due date
        pending_exercises.sort(key=lambda x: (
            0 if x.priority == "urgent" else 1 if x.priority == "warning" else 2,
            x.days_until_due if x.days_until_due is not None else 999
        ))

        return pending_exercises
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.info(f"Error in get_pending_exercises: {e}")
        logger.info(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load pending exercises: {str(e)}"
        ) from e

@router.get("/children", response_model=list[ChildInfo])
async def get_parent_children(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all children linked to the current parent"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Get all parent-student links
    links = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.is_verified
    ).all()

    children_info = []
    for link in links:
        student = db.query(User).filter(User.id == link.student_id).first()
        if not student:
            continue

        # Count total classes enrolled
        total_classes = db.query(func.count(Enrollment.id)).filter(
            Enrollment.user_id == student.id
        ).scalar() or 0

        # Calculate learning progress based on exercises and submissions
        enrollments = db.query(Enrollment).filter(Enrollment.user_id == student.id).all()
        enrolled_class_ids = [enrollment.class_id for enrollment in enrollments if enrollment.class_id]

        if enrolled_class_ids:
            total_exercises = db.query(func.count(Exercise.id)).filter(
                Exercise.class_id.in_(enrolled_class_ids)
            ).scalar() or 0
        else:
            total_exercises = 0

        completed_exercises = db.query(func.count(Submission.id)).filter(
            Submission.student_id == student.id
        ).scalar() or 0

        completed_lessons = completed_exercises
        total_lessons = total_exercises

        # Calculate average score from submissions
        avg_score_result = db.query(
            func.avg(Submission.score)
        ).filter(
            Submission.student_id == student.id,
            Submission.score.isnot(None)
        ).scalar()

        average_score = round(float(avg_score_result), 1) if avg_score_result else 0.0

        children_info.append(ChildInfo(
            id=student.id,
            name=student.full_name or student.username,
            email=student.email,
            username=student.username,
            avatar_url=student.avatar_url,
            grade=None,  # TODO: Add grade field to User model
            total_classes=total_classes,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons,
            average_score=average_score
        ))

    return children_info

@router.get("/children/{child_id}/progress", response_model=ChildProgress)
async def get_child_progress(
    child_id: int,
    subject: str | None = None,
    time_range: str | None = None,
    evaluation_type: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get progress details for a specific child with optional filters"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Verify the child is linked to this parent
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == child_id,
        ParentStudent.is_verified
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not linked to this parent"
        )

    # Calculate time range filter
    from datetime import datetime
    time_filter = None
    if time_range == 'week':
        time_filter = datetime.now() - timedelta(days=7)
    elif time_range == 'month':
        time_filter = datetime.now() - timedelta(days=30)
    elif time_range == 'quarter':
        time_filter = datetime.now() - timedelta(days=90)
    elif time_range == 'year':
        time_filter = datetime.now() - timedelta(days=365)

    # Get all submissions for this student
    submissions_query = db.query(Submission).filter(
        Submission.student_id == child_id
    )

    if time_filter:
        submissions_query = submissions_query.filter(Submission.submitted_at >= time_filter)

    all_submissions = submissions_query.all()

    # Get detailed grades
    detailed_grades = []
    for sub in all_submissions:
        exercise = db.query(Exercise).filter(Exercise.id == sub.exercise_id).first()
        if not exercise:
            continue

        # Apply subject filter
        if subject and subject != 'all' and exercise.skill_type != subject:
            continue

        # Apply evaluation type filter
        if evaluation_type == 'grades' and not sub.score or evaluation_type == 'comments' and not sub.feedback or evaluation_type == 'both' and (not sub.score or not sub.feedback):
            continue

        detailed_grades.append(GradeDetail(
            exercise_id=exercise.id,
            exercise_title=exercise.title,
            skill_type=exercise.skill_type,
            score=sub.score,
            max_score=exercise.max_score,
            feedback=sub.feedback,
            submitted_at=sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else None,
            graded_at=sub.graded_at.strftime("%Y-%m-%d %H:%M") if sub.graded_at else None
        ))

    # Sort detailed grades by submitted_at
    detailed_grades.sort(key=lambda x: x.submitted_at if x.submitted_at else "", reverse=True)

    # Get recent activities (last 10 submissions)
    recent_submissions = sorted(all_submissions, key=lambda x: x.submitted_at if x.submitted_at else datetime.min, reverse=True)[:10]

    recent_activities = []
    for sub in recent_submissions:
        exercise = db.query(Exercise).filter(Exercise.id == sub.exercise_id).first()
        if exercise:
            classroom = db.query(Classroom).filter(Classroom.id == exercise.class_id).first() if exercise.class_id else None

            recent_activities.append(ActivityItem(
                type="exercise",
                title=exercise.title,
                subject=exercise.skill_type or "Mixed",
                class_name=classroom.name if classroom else None,
                score=sub.score,
                max_score=exercise.max_score,
                time=sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else "",
                status="graded" if sub.score is not None else "submitted",
                feedback=sub.feedback,
                skill_type=exercise.skill_type
            ))

    # Get student's enrolled classes
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == child_id
    ).all()

    enrolled_class_ids = [e.class_id for e in enrollments if e.class_id]

    if enrolled_class_ids:
        total_exercises = db.query(func.count(Exercise.id)).filter(
            Exercise.class_id.in_(enrolled_class_ids)
        ).scalar() or 0
    else:
        total_exercises = 0

    # Get upcoming tasks (exercises not yet submitted)
    upcoming_exercises = db.query(Exercise).filter(
        Exercise.class_id.in_(enrolled_class_ids) if enrolled_class_ids else False,
        Exercise.due_at > datetime.now()
    ).order_by(Exercise.due_at.asc()).limit(10).all()

    submitted_exercise_ids = [s.exercise_id for s in all_submissions]

    upcoming_tasks = []
    for exercise in upcoming_exercises:
        if exercise.id not in submitted_exercise_ids:
            classroom = db.query(Classroom).filter(Classroom.id == exercise.class_id).first()

            # Calculate priority based on due date
            if exercise.due_at:
                days_until_due = (exercise.due_at - datetime.now()).days
                if days_until_due <= 2:
                    priority = "high"
                elif days_until_due <= 5:
                    priority = "medium"
                else:
                    priority = "low"
            else:
                priority = "low"

            upcoming_tasks.append(TaskItem(
                type="exercise",
                title=exercise.title,
                subject=exercise.skill_type or "Mixed",
                class_name=classroom.name if classroom else None,
                dueDate=exercise.due_at.strftime("%Y-%m-%d") if exercise.due_at else "",
                priority=priority,
                skill_type=exercise.skill_type
            ))

    # Calculate subject progress by skill type
    skill_colors = {
        "listening": "#FF6B6B",
        "speaking": "#4ECDC4",
        "reading": "#95E1D3",
        "writing": "#FFA07A"
    }

    subject_progress = []
    for skill in ["listening", "speaking", "reading", "writing"]:
        skill_submissions = [s for s in all_submissions if s.exercise_id in [
            e.id for e in db.query(Exercise).filter(
                Exercise.id.in_([sub.exercise_id for sub in all_submissions]),
                Exercise.skill_type == skill
            ).all()
        ]]

        graded_skill_submissions = [s for s in skill_submissions if s.score is not None]

        total_exercises = len(skill_submissions)
        completed_exercises = len(graded_skill_submissions)

        progress_percent = int(completed_exercises / total_exercises * 100) if total_exercises > 0 else 0

        avg_score = None
        if graded_skill_submissions:
            avg_score = round(sum(s.score for s in graded_skill_submissions) / len(graded_skill_submissions), 1)

        subject_progress.append(SubjectProgress(
            subject=skill.capitalize(),
            progress=progress_percent,
            color=skill_colors.get(skill, "#999999"),
            average_score=avg_score,
            total_exercises=total_exercises,
            completed_exercises=completed_exercises
        ))

    # Get attendance stats
    attendance_count = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == child_id
    )

    if time_filter:
        attendance_count = attendance_count.filter(AttendanceRecord.date >= time_filter.date())

    attendance_records = attendance_count.all()

    present = sum(1 for a in attendance_records if a.status == "present")
    absent = sum(1 for a in attendance_records if a.status == "absent")
    late = sum(1 for a in attendance_records if a.status == "late")

    attendance = AttendanceStats(
        present=present,
        absent=absent,
        late=late,
        total=len(attendance_records)
    )

    completed_lessons = len({s.exercise_id for s in all_submissions})

    if total_exercises == 0 and completed_lessons > 0:
        total_exercises = completed_lessons

    # Calculate overall average
    graded_submissions = [s for s in all_submissions if s.score is not None]
    overall_average = 0.0
    if graded_submissions:
        overall_average = round(sum(s.score for s in graded_submissions) / len(graded_submissions), 1)

    return ChildProgress(
        recent_activities=recent_activities,
        upcoming_tasks=upcoming_tasks,
        subject_progress=subject_progress,
        completed_lessons=completed_lessons,
        total_lessons=total_exercises,
        attendance=attendance,
        detailed_grades=detailed_grades,
        overall_average=overall_average,
        total_submissions=len(all_submissions)
    )

class LinkStudentRequest(BaseModel):
    student_email: EmailStr

@router.post("/link-student")
async def link_student(
    link_data: LinkStudentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Parent sends request to link with a student by email"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can link to students"
        )

    # Find student by email
    student = db.query(User).filter(User.email == link_data.student_email).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student account not found"
        )

    # Verify student has user/student role
    if student.role not in [UserRole.USER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be a student"
        )

    # Check if link already exists
    existing_link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == student.id
    ).first()

    if existing_link:
        if existing_link.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student is already linked"
            )
        return {
            "message": "Link request already sent, waiting for student confirmation",
            "is_verified": False
        }

    # Create new link (unverified)
    link = ParentStudent(
        parent_id=current_user.id,
        student_id=student.id,
        is_verified=False
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return {
        "message": "Link request sent to student",
        "student_email": student.email,
        "is_verified": False
    }


# New endpoint for Teacher-Parent chat
class TeacherInfo(BaseModel):
    id: int
    full_name: str
    email: str
    avatar_url: str | None = None
    classes: list[str]  # List of class names teaching this child

    class Config:
        from_attributes = True


@router.get("/children/{child_id}/teachers", response_model=list[TeacherInfo])
async def get_child_teachers(
    child_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all teachers teaching a specific child
    Parent can use this to find teachers to chat with
    """
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Verify this child belongs to the parent
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == child_id,
        ParentStudent.is_verified
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This child is not linked to your account"
        )

    # Get all classes the child is enrolled in
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == child_id,
        Enrollment.status == "active"
    ).all()

    # Get unique teachers and their classes
    teachers_dict = {}
    for enrollment in enrollments:
        classroom = db.query(Classroom).filter(Classroom.id == enrollment.class_id).first()
        if not classroom or not classroom.teacher_id:
            continue

        teacher_id = classroom.teacher_id
        if teacher_id not in teachers_dict:
            teacher = db.query(User).filter(User.id == teacher_id).first()
            if teacher:
                teachers_dict[teacher_id] = {
                    "id": teacher.id,
                    "full_name": teacher.full_name,
                    "email": teacher.email,
                    "avatar_url": teacher.avatar_url,
                    "classes": []
                }

        if teacher_id in teachers_dict:
            teachers_dict[teacher_id]["classes"].append(classroom.name)

    # Convert to list
    return [
        TeacherInfo(**teacher_data)
        for teacher_data in teachers_dict.values()
    ]



# Export Schemas
class MonthlyReportSubject(BaseModel):
    subject: str
    average_score: float
    completed_exercises: int
    total_exercises: int
    teacher_comment: str | None = None

class MonthlyReport(BaseModel):
    overall_average: float
    total_completed: int
    total_exercises: int
    attendance_rate: float
    subjects: list[MonthlyReportSubject]
    general_comment: str | None = None

class MonthlyReportRequest(BaseModel):
    month: int
    year: int | None = None
    time_range: str = "month"

class ExportOptions(BaseModel):
    studentInfo: bool = True
    grades: bool = True
    teacherComments: bool = True
    progressChart: bool = True
    attendance: bool = True
    overallEvaluation: bool = True


@router.get("/monthly-report", response_model=MonthlyReport)
async def get_monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(None),
    time_range: str = Query("month", regex="^(month|quarter|year)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get monthly/quarterly/yearly report for all children"""
    try:
        if current_user.role != UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only parents can access this endpoint"
            )

        # Get all children
        links = db.query(ParentStudent).filter(
            ParentStudent.parent_id == current_user.id,
            ParentStudent.is_verified
        ).all()

        child_ids = [link.student_id for link in links]
        if not child_ids:
            return MonthlyReport(
                overall_average=0.0,
                total_completed=0,
                total_exercises=0,
                attendance_rate=0.0,
                subjects=[],
                general_comment=None
            )

        # Calculate time filter
        if year is None:
            year = datetime.now().year

        if time_range == 'month':
            start_date = datetime(year, month, 1)
            end_date = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
        elif time_range == 'quarter':
            quarter_start_month = ((month - 1) // 3) * 3 + 1
            start_date = datetime(year, quarter_start_month, 1)
            if quarter_start_month >= 10:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, quarter_start_month + 3, 1)
        else:  # year
            start_date = datetime(year, 1, 1)
            end_date = datetime(year + 1, 1, 1)

        # Get submissions in time range
        submissions_query = db.query(Submission).filter(
            Submission.student_id.in_(child_ids),
            Submission.submitted_at >= start_date,
            Submission.submitted_at < end_date
        )
        all_submissions = submissions_query.all()

        # Get all exercises for enrolled classes
        enrolled_class_ids = db.query(func.distinct(Enrollment.class_id)).filter(
            Enrollment.user_id.in_(child_ids)
        ).all()
        class_ids = [row[0] for row in enrolled_class_ids] if enrolled_class_ids else []

        exercises_in_range = []
        if class_ids:
            exercises_in_range = db.query(Exercise).filter(
                Exercise.class_id.in_(class_ids),
                or_(
                    and_(Exercise.created_at >= start_date, Exercise.created_at < end_date),
                    and_(Exercise.due_at >= start_date, Exercise.due_at < end_date)
                )
            ).all()
            total_exercises = len(exercises_in_range)
        else:
            total_exercises = 0

        # Get completed exercises (with score)
        graded_submissions = [s for s in all_submissions if s.score is not None]
        total_completed = len(graded_submissions)

        # Calculate overall average
        overall_average = 0.0
        if graded_submissions:
            overall_average = round(sum(s.score for s in graded_submissions) / len(graded_submissions), 1)

        # Get attendance in time range
        attendance_records = db.query(AttendanceRecord).filter(
            AttendanceRecord.user_id.in_(child_ids),
            AttendanceRecord.date >= start_date.date(),
            AttendanceRecord.date < end_date.date()
        ).all()

        total_attendance = len(attendance_records)
        present_count = sum(1 for a in attendance_records if a.status == "present")
        attendance_rate = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 0.0

        # Calculate by subject (skill)
        subjects_data = []
        for skill in ["listening", "speaking", "reading", "writing"]:
            skill_exercises = [e for e in (exercises_in_range if class_ids else []) if e.skill_type == skill]
            skill_submissions = [s for s in graded_submissions if s.exercise_id in [e.id for e in skill_exercises]]

            avg_score = 0.0
            if skill_submissions:
                avg_score = round(sum(s.score for s in skill_submissions) / len(skill_submissions), 1)

            # Get teacher feedback (from most recent submission)
            teacher_comment = None
            if skill_submissions:
                latest_submission = max(skill_submissions, key=lambda s: s.graded_at if s.graded_at else s.submitted_at)
                teacher_comment = latest_submission.feedback

            subjects_data.append(MonthlyReportSubject(
                subject=skill.capitalize(),
                average_score=avg_score,
                completed_exercises=len(skill_submissions),
                total_exercises=len(skill_exercises),
                teacher_comment=teacher_comment
            ))

        # Generate general comment based on performance
        general_comment = None
        if overall_average >= 8.5:
            general_comment = "Em có tiến bộ rõ rệt. Thái độ học tập nghiêm túc, tích cực tham gia các hoạt động trên lớp. Tiếp tục phát huy!"
        elif overall_average >= 7.0:
            general_comment = "Em học khá tốt. Cần tập trung hơn vào phần Writing và Grammar để cải thiện điểm số."
        elif overall_average >= 5.0:
            general_comment = "Em cần nỗ lực hơn. Hãy chăm chỉ làm bài tập và tham gia lớp học đầy đủ."
        else:
            general_comment = "Em cần cải thiện kết quả học tập. Cần sự hỗ trợ thêm từ gia đình và thầy cô."

        return MonthlyReport(
            overall_average=overall_average,
            total_completed=total_completed,
            total_exercises=total_exercises,
            attendance_rate=attendance_rate,
            subjects=subjects_data,
            general_comment=general_comment
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.info(f"Error in get_monthly_report: {e}")
        logger.info(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load monthly report: {str(e)}"
        ) from e


@router.post("/children/{child_id}/export/pdf")
async def export_progress_pdf(
    child_id: int,
    options: ExportOptions,
    subject: str | None = None,
    time_range: str | None = None,
    evaluation_type: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export child progress report to PDF"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Verify the child is linked to this parent
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == child_id,
        ParentStudent.is_verified
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not linked to this parent"
        )

    # Get student info
    student = db.query(User).filter(User.id == child_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Get progress data using existing endpoint logic
    from datetime import datetime
    time_filter = None
    if time_range == 'week':
        time_filter = datetime.now() - timedelta(days=7)
    elif time_range == 'month':
        time_filter = datetime.now() - timedelta(days=30)
    elif time_range == 'quarter':
        time_filter = datetime.now() - timedelta(days=90)
    elif time_range == 'year':
        time_filter = datetime.now() - timedelta(days=365)

    submissions_query = db.query(Submission).filter(Submission.student_id == child_id)
    if time_filter:
        submissions_query = submissions_query.filter(Submission.submitted_at >= time_filter)

    all_submissions = submissions_query.all()

    # Build detailed grades
    detailed_grades = []
    for sub in all_submissions:
        exercise = db.query(Exercise).filter(Exercise.id == sub.exercise_id).first()
        if not exercise:
            continue

        if subject and subject != 'all' and exercise.skill_type != subject:
            continue

        if evaluation_type == 'grades' and not sub.score or evaluation_type == 'comments' and not sub.feedback or evaluation_type == 'both' and (not sub.score or not sub.feedback):
            continue

        detailed_grades.append({
            'exercise_id': exercise.id,
            'exercise_title': exercise.title,
            'skill_type': exercise.skill_type,
            'score': sub.score,
            'max_score': exercise.max_score,
            'feedback': sub.feedback,
            'submitted_at': sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else None,
            'graded_at': sub.graded_at.strftime("%Y-%m-%d %H:%M") if sub.graded_at else None
        })

    detailed_grades.sort(key=lambda x: x['submitted_at'] if x['submitted_at'] else "", reverse=True)

    # Calculate subject progress
    skill_colors = {
        "listening": "#FF6B6B",
        "speaking": "#4ECDC4",
        "reading": "#95E1D3",
        "writing": "#FFA07A"
    }

    subject_progress = []
    for skill in ["listening", "speaking", "reading", "writing"]:
        skill_submissions = [s for s in all_submissions if s.exercise_id in [
            e.id for e in db.query(Exercise).filter(
                Exercise.id.in_([sub.exercise_id for sub in all_submissions]),
                Exercise.skill_type == skill
            ).all()
        ]]

        graded_skill_submissions = [s for s in skill_submissions if s.score is not None]
        total_exercises = len(skill_submissions)
        completed_exercises = len(graded_skill_submissions)

        progress_percent = int((completed_exercises / total_exercises) * 100) if total_exercises > 0 else 0
        avg_score = round(sum(s.score for s in graded_skill_submissions) / len(graded_skill_submissions), 1) if graded_skill_submissions else None

        subject_progress.append({
            'subject': skill.capitalize(),
            'progress': progress_percent,
            'color': skill_colors.get(skill, "#999999"),
            'average_score': avg_score,
            'total_exercises': total_exercises,
            'completed_exercises': completed_exercises
        })

    # Get attendance
    attendance_query = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == child_id)
    if time_filter:
        attendance_query = attendance_query.filter(AttendanceRecord.date >= time_filter.date())

    attendance_records = attendance_query.all()
    attendance = {
        'present': sum(1 for a in attendance_records if a.status == "present"),
        'absent': sum(1 for a in attendance_records if a.status == "absent"),
        'late': sum(1 for a in attendance_records if a.status == "late"),
        'total': len(attendance_records)
    }

    # Calculate overall average
    graded_submissions = [s for s in all_submissions if s.score is not None]
    overall_average = round(sum(s.score for s in graded_submissions) / len(graded_submissions), 1) if graded_submissions else 0.0

    # Prepare data for export
    student_info = {
        'name': student.full_name or student.username,
        'email': student.email,
        'grade': 'N/A'  # Can be enhanced if grade info is available
    }

    progress_data = {
        'detailed_grades': detailed_grades,
        'subject_progress': subject_progress,
        'attendance': attendance,
        'overall_average': overall_average,
        'total_submissions': len(all_submissions)
    }

    # Generate PDF
    pdf_buffer = ParentProgressExportService.export_to_pdf(
        student_info=student_info,
        progress_data=progress_data,
        export_options=options.dict()
    )

    # Generate filename
    filename = f"bao_cao_tien_do_{student.username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/children/{child_id}/export/excel")
async def export_progress_excel(
    child_id: int,
    options: ExportOptions,
    subject: str | None = None,
    time_range: str | None = None,
    evaluation_type: str | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export child progress report to Excel"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Verify the child is linked to this parent
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == child_id,
        ParentStudent.is_verified
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not linked to this parent"
        )

    # Get student info
    student = db.query(User).filter(User.id == child_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Get progress data using existing endpoint logic (same as PDF)
    from datetime import datetime
    time_filter = None
    if time_range == 'week':
        time_filter = datetime.now() - timedelta(days=7)
    elif time_range == 'month':
        time_filter = datetime.now() - timedelta(days=30)
    elif time_range == 'quarter':
        time_filter = datetime.now() - timedelta(days=90)
    elif time_range == 'year':
        time_filter = datetime.now() - timedelta(days=365)

    submissions_query = db.query(Submission).filter(Submission.student_id == child_id)
    if time_filter:
        submissions_query = submissions_query.filter(Submission.submitted_at >= time_filter)

    all_submissions = submissions_query.all()

    # Build detailed grades
    detailed_grades = []
    for sub in all_submissions:
        exercise = db.query(Exercise).filter(Exercise.id == sub.exercise_id).first()
        if not exercise:
            continue

        if subject and subject != 'all' and exercise.skill_type != subject:
            continue

        if evaluation_type == 'grades' and not sub.score or evaluation_type == 'comments' and not sub.feedback or evaluation_type == 'both' and (not sub.score or not sub.feedback):
            continue

        detailed_grades.append({
            'exercise_id': exercise.id,
            'exercise_title': exercise.title,
            'skill_type': exercise.skill_type,
            'score': sub.score,
            'max_score': exercise.max_score,
            'feedback': sub.feedback,
            'submitted_at': sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else None,
            'graded_at': sub.graded_at.strftime("%Y-%m-%d %H:%M") if sub.graded_at else None
        })

    detailed_grades.sort(key=lambda x: x['submitted_at'] if x['submitted_at'] else "", reverse=True)

    # Calculate subject progress
    skill_colors = {
        "listening": "#FF6B6B",
        "speaking": "#4ECDC4",
        "reading": "#95E1D3",
        "writing": "#FFA07A"
    }

    subject_progress = []
    for skill in ["listening", "speaking", "reading", "writing"]:
        skill_submissions = [s for s in all_submissions if s.exercise_id in [
            e.id for e in db.query(Exercise).filter(
                Exercise.id.in_([sub.exercise_id for sub in all_submissions]),
                Exercise.skill_type == skill
            ).all()
        ]]

        graded_skill_submissions = [s for s in skill_submissions if s.score is not None]
        total_exercises = len(skill_submissions)
        completed_exercises = len(graded_skill_submissions)

        progress_percent = int((completed_exercises / total_exercises) * 100) if total_exercises > 0 else 0
        avg_score = round(sum(s.score for s in graded_skill_submissions) / len(graded_skill_submissions), 1) if graded_skill_submissions else None

        subject_progress.append({
            'subject': skill.capitalize(),
            'progress': progress_percent,
            'color': skill_colors.get(skill, "#999999"),
            'average_score': avg_score,
            'total_exercises': total_exercises,
            'completed_exercises': completed_exercises
        })

    # Get attendance
    attendance_query = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == child_id)
    if time_filter:
        attendance_query = attendance_query.filter(AttendanceRecord.date >= time_filter.date())

    attendance_records = attendance_query.all()
    attendance = {
        'present': sum(1 for a in attendance_records if a.status == "present"),
        'absent': sum(1 for a in attendance_records if a.status == "absent"),
        'late': sum(1 for a in attendance_records if a.status == "late"),
        'total': len(attendance_records)
    }

    # Calculate overall average
    graded_submissions = [s for s in all_submissions if s.score is not None]
    overall_average = round(sum(s.score for s in graded_submissions) / len(graded_submissions), 1) if graded_submissions else 0.0

    # Prepare data for export
    student_info = {
        'name': student.full_name or student.username,
        'email': student.email,
        'grade': 'N/A'
    }

    progress_data = {
        'detailed_grades': detailed_grades,
        'subject_progress': subject_progress,
        'attendance': attendance,
        'overall_average': overall_average,
        'total_submissions': len(all_submissions)
    }

    # Generate Excel
    excel_buffer = ParentProgressExportService.export_to_excel(
        student_info=student_info,
        progress_data=progress_data,
        export_options=options.dict()
    )

    # Generate filename
    filename = f"bao_cao_tien_do_{student.username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/monthly-report/export/pdf")
async def export_monthly_report_pdf(
    request: MonthlyReportRequest,
    options: ExportOptions | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export monthly report to PDF"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Get report data
    year = request.year if request.year else datetime.now().year
    report = await get_monthly_report(month=request.month, year=year, time_range=request.time_range, current_user=current_user, db=db)

    # Prepare data for export
    student_info = {
        'name': f'Báo cáo {request.time_range}',
        'email': current_user.email,
        'grade': f'Tháng {request.month}/{year}' if request.time_range == 'month' else f'Năm {year}'
    }

    progress_data = {
        'detailed_grades': [],  # Monthly report doesn't need detailed grades
        'subject_progress': [
            {
                'subject': subj.subject,
                'progress': int(subj.completed_exercises / subj.total_exercises * 100) if subj.total_exercises > 0 else 0,
                'color': {
                    'listening': '#FF6B6B',
                    'speaking': '#4ECDC4',
                    'reading': '#95E1D3',
                    'writing': '#FFA07A'
                }.get(subj.subject.lower(), '#999999'),
                'average_score': subj.average_score,
                'total_exercises': subj.total_exercises,
                'completed_exercises': subj.completed_exercises
            }
            for subj in report.subjects
        ],
        'attendance': {
            'present': int((report.attendance_rate / 100) * 30),  # Estimate
            'absent': 0,
            'late': 0,
            'total': 30
        },
        'overall_average': report.overall_average,
        'total_submissions': report.total_completed
    }

    export_options_dict = options.dict() if options else {
        'studentInfo': True,
        'grades': True,
        'teacherComments': True,
        'progressChart': True,
        'attendance': True,
        'overallEvaluation': True
    }

    # Generate PDF
    pdf_buffer = ParentProgressExportService.export_to_pdf(
        student_info=student_info,
        progress_data=progress_data,
        export_options=export_options_dict
    )

    # Generate filename
    filename = f"bao_cao_{request.time_range}_{request.month}_{year}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/monthly-report/export/excel")
async def export_monthly_report_excel(
    request: MonthlyReportRequest,
    options: ExportOptions | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export monthly report to Excel"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )

    # Get report data
    year = request.year if request.year else datetime.now().year
    report = await get_monthly_report(month=request.month, year=year, time_range=request.time_range, current_user=current_user, db=db)

    # Prepare data for export
    student_info = {
        'name': f'Báo cáo {request.time_range}',
        'email': current_user.email,
        'grade': f'Tháng {request.month}/{year}' if request.time_range == 'month' else f'Năm {year}'
    }

    progress_data = {
        'detailed_grades': [],
        'subject_progress': [
            {
                'subject': subj.subject,
                'progress': int(subj.completed_exercises / subj.total_exercises * 100) if subj.total_exercises > 0 else 0,
                'color': {
                    'listening': '#FF6B6B',
                    'speaking': '#4ECDC4',
                    'reading': '#95E1D3',
                    'writing': '#FFA07A'
                }.get(subj.subject.lower(), '#999999'),
                'average_score': subj.average_score,
                'total_exercises': subj.total_exercises,
                'completed_exercises': subj.completed_exercises
            }
            for subj in report.subjects
        ],
        'attendance': {
            'present': int((report.attendance_rate / 100) * 30),
            'absent': 0,
            'late': 0,
            'total': 30
        },
        'overall_average': report.overall_average,
        'total_submissions': report.total_completed
    }

    export_options_dict = options.dict() if options else {
        'studentInfo': True,
        'grades': True,
        'teacherComments': True,
        'progressChart': True,
        'attendance': True,
        'overallEvaluation': True
    }

    # Generate Excel
    excel_buffer = ParentProgressExportService.export_to_excel(
        student_info=student_info,
        progress_data=progress_data,
        export_options=export_options_dict
    )

    # Generate filename
    filename = f"bao_cao_{request.time_range}_{request.month}_{year}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


