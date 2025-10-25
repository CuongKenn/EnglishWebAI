from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.enrollment import Enrollment
from app.models.classroom import Classroom
from app.schemas.student import ExerciseListResponse, ExerciseResponse
from pydantic import BaseModel

router = APIRouter()


# Schemas for submission
class SubmissionCreate(BaseModel):
    content_text: Optional[str] = None
    content_url: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: Optional[str]
    content_url: Optional[str]
    score: Optional[float]
    feedback: Optional[str]
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExerciseDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    max_score: Optional[int]
    due_at: Optional[datetime]
    created_at: datetime
    class_id: Optional[int]
    class_name: Optional[str]
    lesson_id: Optional[int]
    lesson_title: Optional[str]
    my_submission: Optional[SubmissionResponse]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ExerciseDetailResponse])
async def get_exercises(
    class_id: Optional[int] = None,
    status: Optional[str] = None,  # pending | submitted | graded
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách bài tập của học sinh
    - Lọc theo lớp học (nếu có)
    - Lọc theo trạng thái (chưa làm, đã nộp, đã chấm)
    """
    # Lấy danh sách lớp học sinh đã tham gia
    enrolled_class_ids = (
        db.query(Enrollment.class_id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
        .all()
    )
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    if not enrolled_class_ids:
        return []
    
    # Query exercises từ các lớp đã tham gia
    query = db.query(Exercise).filter(Exercise.class_id.in_(enrolled_class_ids))
    
    # Filter by specific class
    if class_id:
        query = query.filter(Exercise.class_id == class_id)
    
    # Get exercises
    exercises = query.order_by(Exercise.due_at.desc().nulls_last(), Exercise.created_at.desc()).offset(skip).limit(limit).all()
    
    # Get class names
    class_map = {}
    classrooms = db.query(Classroom).filter(Classroom.id.in_(enrolled_class_ids)).all()
    for c in classrooms:
        class_map[c.id] = c.name
    
    # Get submissions for current user
    exercise_ids = [e.id for e in exercises]
    submissions = {}
    if exercise_ids:
        subs = (
            db.query(Submission)
            .filter(
                Submission.exercise_id.in_(exercise_ids),
                Submission.student_id == current_user.id
            )
            .all()
        )
        for sub in subs:
            submissions[sub.exercise_id] = sub
    
    # Build response
    result = []
    for exercise in exercises:
        my_sub = submissions.get(exercise.id)
        
        # Filter by status if requested
        if status:
            if status == "pending" and my_sub is not None:
                continue
            elif status == "submitted" and (my_sub is None or my_sub.status != "submitted"):
                continue
            elif status == "graded" and (my_sub is None or my_sub.status != "graded"):
                continue
        
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description,
            "type": exercise.type,
            "max_score": exercise.max_score,
            "due_at": exercise.due_at,
            "created_at": exercise.created_at,
            "class_id": exercise.class_id,
            "class_name": class_map.get(exercise.class_id),
            "lesson_id": exercise.lesson_id,
            "lesson_title": None,  # TODO: get from lesson if needed
            "my_submission": my_sub
        })
    
    return result

@router.get("/{exercise_id}", response_model=ExerciseDetailResponse)
async def get_exercise(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một bài tập
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    
    # Check if student has access (enrolled in class)
    if current_user.role == UserRole.USER:
        enrollment = db.query(Enrollment).filter(
            Enrollment.class_id == exercise.class_id,
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chưa tham gia lớp học này"
            )
    
    # Get class name
    class_name = None
    if exercise.class_id:
        classroom = db.query(Classroom).filter(Classroom.id == exercise.class_id).first()
        if classroom:
            class_name = classroom.name
    
    # Get student's submission
    my_submission = None
    if current_user.role == UserRole.USER:
        my_submission = db.query(Submission).filter(
            Submission.exercise_id == exercise_id,
            Submission.student_id == current_user.id
        ).order_by(Submission.submitted_at.desc()).first()
    
    return {
        "id": exercise.id,
        "title": exercise.title,
        "description": exercise.description,
        "type": exercise.type,
        "max_score": exercise.max_score,
        "due_at": exercise.due_at,
        "created_at": exercise.created_at,
        "class_id": exercise.class_id,
        "class_name": class_name,
        "lesson_id": exercise.lesson_id,
        "lesson_title": None,
        "my_submission": my_submission
    }

@router.post("/{exercise_id}/submit", response_model=SubmissionResponse)
async def submit_exercise(
    exercise_id: int,
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Nộp bài tập
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    
    # Check if student has access
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == exercise.class_id,
        Enrollment.user_id == current_user.id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa tham gia lớp học này"
        )
    
    # Check if already submitted
    existing_submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).first()
    
    if existing_submission:
        # Update existing submission
        existing_submission.content_text = submission_data.content_text
        existing_submission.content_url = submission_data.content_url
        existing_submission.submitted_at = datetime.utcnow()
        existing_submission.status = "submitted"
        db.commit()
        db.refresh(existing_submission)
        return existing_submission
    
    # Check if late
    status_value = "submitted"
    if exercise.due_at and datetime.utcnow() > exercise.due_at:
        status_value = "late"
    
    # Create new submission
    submission = Submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content_text=submission_data.content_text,
        content_url=submission_data.content_url,
        status=status_value
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return submission

@router.get("/{exercise_id}/my-submission", response_model=SubmissionResponse)
async def get_my_submission(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy bài nộp của học sinh cho bài tập này
    """
    submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chưa có bài nộp"
        )
    
    return submission


@router.get("/my-submissions", response_model=List[SubmissionResponse])
async def get_my_submissions(
    class_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tất cả bài nộp của học sinh
    """
    query = db.query(Submission).filter(Submission.student_id == current_user.id)
    
    # Filter by class
    if class_id:
        query = query.join(Exercise).filter(Exercise.class_id == class_id)
    
    # Filter by status
    if status:
        query = query.filter(Submission.status == status)
    
    submissions = query.order_by(Submission.submitted_at.desc()).offset(skip).limit(limit).all()
    
    return submissions


@router.delete("/{exercise_id}/submission")
async def delete_my_submission(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xóa bài nộp của học sinh (chỉ khi chưa được chấm điểm)
    """
    submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài nộp"
        )
    
    if submission.status == "graded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa bài đã được chấm điểm"
        )
    
    db.delete(submission)
    db.commit()
    
    return {"message": "Đã xóa bài nộp thành công"}


@router.get("/statistics/summary")
async def get_exercise_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thống kê tổng quan về bài tập của học sinh
    """
    # Get enrolled classes
    enrolled_class_ids = (
        db.query(Enrollment.class_id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
        .all()
    )
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    if not enrolled_class_ids:
        return {
            "total_exercises": 0,
            "completed": 0,
            "pending": 0,
            "graded": 0,
            "average_score": 0,
            "late_submissions": 0
        }
    
    # Total exercises
    total_exercises = db.query(func.count(Exercise.id)).filter(
        Exercise.class_id.in_(enrolled_class_ids)
    ).scalar() or 0
    
    # Get all submissions
    submissions = db.query(Submission).filter(
        Submission.student_id == current_user.id
    ).all()
    
    completed = len(submissions)
    pending = total_exercises - completed
    graded = len([s for s in submissions if s.status == "graded"])
    late_submissions = len([s for s in submissions if s.status == "late"])
    
    # Calculate average score
    graded_submissions = [s for s in submissions if s.score is not None]
    average_score = 0
    if graded_submissions:
        average_score = sum(s.score for s in graded_submissions) / len(graded_submissions)
    
    return {
        "total_exercises": total_exercises,
        "completed": completed,
        "pending": pending,
        "graded": graded,
        "average_score": round(average_score, 2),
        "late_submissions": late_submissions
    }
