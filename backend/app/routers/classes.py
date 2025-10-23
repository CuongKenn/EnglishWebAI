from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.student import (
    ClassroomListResponse,
    ClassroomResponse,
    EnrollmentCreate,
    EnrollmentResponse
)

router = APIRouter()

@router.get("/", response_model=List[ClassroomListResponse])
async def get_classes(
    search: str = None,
    grade: str = None,
    subject: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các lớp học có sẵn để tham gia
    """
    query = db.query(
        Classroom,
        func.count(Enrollment.id).label("student_count")
    ).outerjoin(Enrollment, Classroom.id == Enrollment.class_id)
    
    # Filter by search term
    if search:
        query = query.filter(
            (Classroom.name.ilike(f"%{search}%")) |
            (Classroom.description.ilike(f"%{search}%"))
        )
    
    # Filter active classes only
    query = query.filter(Classroom.is_active == True)
    query = query.group_by(Classroom.id)
    query = query.offset(skip).limit(limit)
    
    results = query.all()
    
    # Format response
    classes = []
    for classroom, student_count in results:
        classes.append({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "schedule": classroom.schedule,
            "max_students": classroom.max_students,
            "student_count": student_count,
            "teacher_name": "Chưa có giáo viên",  # TODO: Join with User table
            "subject": "Tiếng Anh",  # TODO: Add subject field to Classroom
            "grade": "Lớp 3",  # TODO: Add grade field to Classroom
            "image": "📚",
            "color": "blue"
        })
    
    return classes

@router.get("/my-classes", response_model=List[ClassroomListResponse])
async def get_my_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các lớp học mà học sinh đã tham gia
    """
    # Get enrolled classes
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.status == "active"
    ).all()
    
    class_ids = [e.class_id for e in enrollments]
    
    if not class_ids:
        return []
    
    query = db.query(
        Classroom,
        func.count(Enrollment.id).label("student_count")
    ).outerjoin(Enrollment, Classroom.id == Enrollment.class_id)
    
    query = query.filter(Classroom.id.in_(class_ids))
    query = query.group_by(Classroom.id)
    
    results = query.all()
    
    # Format response
    classes = []
    for classroom, student_count in results:
        classes.append({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "schedule": classroom.schedule,
            "max_students": classroom.max_students,
            "student_count": student_count,
            "teacher_name": "Chưa có giáo viên",
            "subject": "Tiếng Anh",
            "grade": "Lớp 3",
            "image": "📚",
            "color": "green"
        })
    
    return classes

@router.get("/{class_id}", response_model=ClassroomResponse)
async def get_class(
    class_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một lớp học
    """
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy lớp học"
        )
    
    # Count students
    student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.class_id == class_id,
        Enrollment.status == "active"
    ).scalar()
    
    return {
        **classroom.__dict__,
        "student_count": student_count
    }

@router.post("/{class_id}/join", response_model=EnrollmentResponse)
async def join_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tham gia vào một lớp học
    """
    # Check if class exists
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy lớp học"
        )
    
    if not classroom.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lớp học này đã bị đóng"
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.user_id == current_user.id
    ).first()
    
    if existing_enrollment:
        if existing_enrollment.status == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn đã tham gia lớp học này rồi"
            )
        else:
            # Reactivate enrollment
            existing_enrollment.status = "active"
            db.commit()
            db.refresh(existing_enrollment)
            return existing_enrollment
    
    # Check if class is full
    if classroom.max_students:
        student_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.class_id == class_id,
            Enrollment.status == "active"
        ).scalar()
        
        if student_count >= classroom.max_students:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lớp học đã đầy"
            )
    
    # Create enrollment
    enrollment = Enrollment(
        class_id=class_id,
        user_id=current_user.id,
        role="student",
        status="active"
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return enrollment

@router.post("/{class_id}/leave")
async def leave_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rời khỏi một lớp học
    """
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.user_id == current_user.id,
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bạn chưa tham gia lớp học này"
        )
    
    # Set status to inactive instead of deleting
    enrollment.status = "inactive"
    db.commit()
    
    return {"message": "Đã rời khỏi lớp học thành công"}
