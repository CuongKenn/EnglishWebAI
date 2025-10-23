from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.lesson import Lesson
from app.models.material import Material
from app.schemas.student import LessonListResponse, LessonResponse

router = APIRouter()

@router.get("/", response_model=List[LessonListResponse])
async def get_lessons(
    grade: str = None,
    subject: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các khóa học/bài học có sẵn
    """
    query = db.query(Lesson)
    query = query.offset(skip).limit(limit)
    lessons = query.all()
    
    # Mock data response matching frontend expectations
    mock_lessons = []
    lesson_templates = [
        {"title": "Mẫu giáo", "icon": "🧸", "color": "pink", "grade": "Mẫu giáo"},
        {"title": "Lớp 1", "icon": "🌈", "color": "yellow", "grade": "Lớp 1"},
        {"title": "Lớp 2", "icon": "🎨", "color": "orange", "grade": "Lớp 2"},
        {"title": "Lớp 3", "icon": "📚", "color": "blue", "grade": "Lớp 3"},
        {"title": "Lớp 4", "icon": "✏️", "color": "green", "grade": "Lớp 4"},
        {"title": "Lớp 5", "icon": "🎯", "color": "purple", "grade": "Lớp 5"},
    ]
    
    for idx, template in enumerate(lesson_templates):
        mock_lessons.append({
            "id": idx + 1,
            "title": template["title"],
            "description": f"Chương trình học tiếng Anh {template['title']}",
            "subject": "Tiếng Anh",
            "grade": template["grade"],
            "difficulty": "Trung bình",
            "lessons": 15 + (idx * 2),
            "duration": f"{2 + idx} tuần",
            "progress": 0,
            "image": template["icon"],
            "color": template["color"],
            "chapters": []
        })
    
    return mock_lessons

@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một bài học
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài học"
        )
    
    return lesson

@router.get("/{lesson_id}/materials", response_model=List[dict])
async def get_lesson_materials(
    lesson_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tài liệu của một bài học
    """
    materials = db.query(Material).filter(Material.lesson_id == lesson_id).all()
    return materials

@router.post("/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: int,
    progress: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật tiến độ học của học sinh
    """
    # TODO: Implement LessonProgress model and logic
    return {"message": "Đã cập nhật tiến độ học", "progress": progress}
