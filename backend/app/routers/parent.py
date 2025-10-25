from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.parent_student import ParentStudent
from app.models.enrollment import Enrollment
from app.models.attendance import AttendanceRecord
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.services.parent_service import ParentService
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

router = APIRouter()

# Schemas
class ChildInfo(BaseModel):
    id: int
    name: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    grade: Optional[str] = None
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
    score: Optional[float] = None
    time: str
    status: str

class TaskItem(BaseModel):
    type: str
    title: str
    subject: str
    dueDate: str
    priority: str

class SubjectProgress(BaseModel):
    subject: str
    progress: int
    color: str

class AttendanceStats(BaseModel):
    present: int
    absent: int
    late: int
    total: int

class ChildProgress(BaseModel):
    recent_activities: List[ActivityItem]
    upcoming_tasks: List[TaskItem]
    subject_progress: List[SubjectProgress]
    attendance: AttendanceStats

@router.get("/children", response_model=List[ChildInfo])
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
        ParentStudent.is_verified == True
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
        
        # TODO: Calculate completed lessons and total lessons
        completed_lessons = 0
        total_lessons = 0
        
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get progress details for a specific child"""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can access this endpoint"
        )
    
    # Verify the child is linked to this parent
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == current_user.id,
        ParentStudent.student_id == child_id,
        ParentStudent.is_verified == True
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or not linked to this parent"
        )
    
    # Get recent activities (last 10 submissions)
    recent_submissions = db.query(Submission).filter(
        Submission.student_id == child_id
    ).order_by(Submission.submitted_at.desc()).limit(10).all()
    
    recent_activities = []
    for sub in recent_submissions:
        exercise = db.query(Exercise).filter(Exercise.id == sub.exercise_id).first()
        if exercise:
            recent_activities.append(ActivityItem(
                type="exercise",
                title=exercise.title,
                subject="Subject",  # TODO: Get from class/lesson
                score=sub.score,
                time=sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else "",
                status="completed" if sub.score else "submitted"
            ))
    
    # Get upcoming tasks (exercises not yet submitted)
    # TODO: Implement proper query for upcoming exercises
    upcoming_tasks = []
    
    # Get subject progress
    # TODO: Implement proper subject progress calculation
    subject_progress = [
        SubjectProgress(subject="Listening", progress=75, color="#FF6B6B"),
        SubjectProgress(subject="Speaking", progress=85, color="#4ECDC4"),
        SubjectProgress(subject="Reading", progress=60, color="#95E1D3"),
        SubjectProgress(subject="Writing", progress=70, color="#FFA07A"),
    ]
    
    # Get attendance stats
    attendance_count = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == child_id
    ).all()
    
    present = sum(1 for a in attendance_count if a.status == "present")
    absent = sum(1 for a in attendance_count if a.status == "absent")
    late = sum(1 for a in attendance_count if a.status == "late")
    
    attendance = AttendanceStats(
        present=present,
        absent=absent,
        late=late,
        total=len(attendance_count)
    )
    
    return ChildProgress(
        recent_activities=recent_activities,
        upcoming_tasks=upcoming_tasks,
        subject_progress=subject_progress,
        attendance=attendance
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
        else:
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
