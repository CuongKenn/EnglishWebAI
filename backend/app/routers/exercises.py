from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.schemas.student import ExerciseListResponse, ExerciseResponse

router = APIRouter()

@router.get("/", response_model=List[ExerciseListResponse])
async def get_exercises(
    subject: str = None,
    grade: str = None,
    difficulty: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách bài tập
    """
    # Mock data matching frontend expectations
    mock_exercises = [
        {
            "id": 1,
            "title": "Phép cộng trong phạm vi 20",
            "description": "Luyện tập phép cộng cơ bản từ 1-20",
            "subject": "Toán",
            "grade": "Lớp 2",
            "difficulty": "Dễ",
            "questions": 10,
            "timeLimit": 15,
            "image": "➕",
            "color": "blue",
            "completed": False,
            "score": None
        },
        {
            "id": 2,
            "title": "Từ vựng tiếng Anh - Gia đình",
            "description": "Học từ vựng về các thành viên trong gia đình",
            "subject": "Tiếng Anh",
            "grade": "Lớp 3",
            "difficulty": "Trung bình",
            "questions": 15,
            "timeLimit": 20,
            "image": "👨‍👩‍👧‍👦",
            "color": "green",
            "completed": False,
            "score": None
        },
        {
            "id": 3,
            "title": "Thực vật và động vật",
            "description": "Khám phá thế giới thực vật và động vật",
            "subject": "Khoa học",
            "grade": "Lớp 4",
            "difficulty": "Trung bình",
            "questions": 12,
            "timeLimit": 18,
            "image": "🌱",
            "color": "purple",
            "completed": False,
            "score": None
        }
    ]
    
    # Filter by parameters
    filtered = mock_exercises
    if subject:
        filtered = [ex for ex in filtered if ex["subject"] == subject]
    if grade:
        filtered = [ex for ex in filtered if ex["grade"] == grade]
    if difficulty:
        filtered = [ex for ex in filtered if ex["difficulty"] == difficulty]
    
    return filtered

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: int,
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
    
    return exercise

@router.post("/{exercise_id}/submit")
async def submit_exercise(
    exercise_id: int,
    answers: dict,
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
    
    # Create submission
    submission = Submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content="",  # Store answers as JSON string if needed
        score=0  # TODO: Calculate score based on correct answers
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {
        "message": "Đã nộp bài tập thành công",
        "submission_id": submission.id,
        "score": submission.score
    }

@router.get("/{exercise_id}/result")
async def get_exercise_result(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy kết quả bài tập của học sinh
    """
    submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chưa có kết quả bài tập"
        )
    
    return {
        "submission_id": submission.id,
        "score": submission.score,
        "submitted_at": submission.submitted_at,
        "graded": submission.graded_at is not None,
        "feedback": submission.feedback
    }
