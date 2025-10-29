from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user
from app.models.user import User
from app.models.lesson import Lesson
from app.models.material import Material
from app.models.course import Course, CourseUnit, CourseProgress
from app.schemas.student import LessonListResponse, LessonResponse

router = APIRouter()


# Icon mapping for skills
SKILL_ICONS = {
    "listening": "🎧",
    "speaking": "🗣️",
    "reading": "📖",
    "writing": "✍️",
}

SKILL_COLORS = {
    "listening": "#10b981",
    "speaking": "#8b5cf6",
    "reading": "#3b82f6",
    "writing": "#f97316",
}


@router.get("/", response_model=List[dict])
async def get_lessons(
    grade: Optional[int] = None,
    skill: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các khóa học có sẵn (thay thế mock data bằng courses thật)
    """
    # Query active courses
    query = db.query(Course).filter(Course.is_active == True)
    
    if grade:
        query = query.filter(Course.grade == grade)
    if skill:
        query = query.filter(Course.skill == skill)
    
    query = query.order_by(Course.grade.asc(), Course.skill.asc())
    query = query.offset(skip).limit(limit)
    courses = query.all()
    
    result = []
    for course in courses:
        # Get unit count
        unit_count = db.query(func.count(CourseUnit.id)).filter(
            CourseUnit.course_id == course.id
        ).scalar() or 0
        
        # Get student's progress
        completed_units = db.query(func.count(CourseProgress.id)).filter(
            CourseProgress.course_id == course.id,
            CourseProgress.user_id == current_user.id,
            CourseProgress.is_completed == True,
            CourseProgress.unit_id.isnot(None)
        ).scalar() or 0
        
        total_cups = db.query(func.sum(CourseUnit.max_cups)).filter(
            CourseUnit.course_id == course.id
        ).scalar() or 0
        
        earned_cups = db.query(func.sum(CourseProgress.cups_earned)).filter(
            CourseProgress.course_id == course.id,
            CourseProgress.user_id == current_user.id,
            CourseProgress.unit_id.isnot(None)
        ).scalar() or 0
        
        progress = round((completed_units / unit_count * 100) if unit_count > 0 else 0, 1)
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description or f"Khóa học {course.skill} lớp {course.grade}",
            "subject": "Tiếng Anh",
            "grade": f"Lớp {course.grade}",
            "skill": course.skill,
            "level": course.level or "Intermediate",
            "difficulty": course.level or "Trung bình",
            "lessons": unit_count,
            "duration": f"{unit_count} bài",
            "progress": progress,
            "image": SKILL_ICONS.get(course.skill, "📚"),
            "color": SKILL_COLORS.get(course.skill, "#64748b"),
            "totalUnits": unit_count,
            "completedUnits": completed_units,
            "totalCups": total_cups,
            "earnedCups": earned_cups,
            "thumbnail_url": course.thumbnail_url,
        })
    
    return result

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
