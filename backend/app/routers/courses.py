from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, case
import json
import os
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user
from app.models.user import User, UserRole
from app.models.course import Course, CourseExercise, CourseSubmission, CourseUnit
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListItem,
    CourseExerciseCreate,
    CourseExerciseResponse,
    CourseSubmissionCreate,
    CourseSubmissionResponse,
)
from app.services.ai_feedback_service import ai_feedback_service

router = APIRouter()


def _grade_label(grade: Optional[int]) -> Optional[str]:
    if grade is None:
        return None
    return f"Lớp {grade}"


def _level_from_grade(grade: int) -> str:
    if grade <= 3:
        return "Beginner"
    if grade <= 5:
        return "Elementary"
    if grade <= 8:
        return "Intermediate"
    if grade <= 10:
        return "Upper-Intermediate"
    return "Advanced"


@router.get("/", response_model=List[CourseListItem])
async def list_courses(
    grade: Optional[int] = None,
    skill: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List public courses by grade/skill for any authenticated user.

    Returns items shaped for the MyCourses page with computed progress and cups.
    """
    q = db.query(
        Course.id,
        Course.title,
        Course.grade,
        Course.skill,
        Course.is_active,
        Course.level,
        Course.created_by,
        Course.thumbnail_url,
    ).filter(Course.is_active == True)
    if grade is not None:
        q = q.filter(Course.grade == int(grade))
    if skill:
        q = q.filter(Course.skill == skill)
    if search:
        like = f"%{search}%"
        q = q.filter(Course.title.ilike(like))

    q = q.order_by(Course.grade.asc(), Course.skill.asc(), Course.id.desc()).offset(skip).limit(limit)
    rows = q.all()

    if not rows:
        return []

    course_ids = [r[0] for r in rows]

    # Total units per course (use CourseUnit)
    units_counts = dict(
        db.query(CourseUnit.course_id, func.count(CourseUnit.id))
        .filter(CourseUnit.course_id.in_(course_ids))
        .group_by(CourseUnit.course_id)
        .all()
    )

    # Total cups per course = sum of unit.max_cups
    cups_total_map = dict(
        db.query(CourseUnit.course_id, func.coalesce(func.sum(CourseUnit.max_cups), 0))
        .filter(CourseUnit.course_id.in_(course_ids))
        .group_by(CourseUnit.course_id)
        .all()
    )

    # For now, progress and cups earned are not tracked by unit yet
    completed_counts = {cid: 0 for cid in course_ids}
    cups_map = {cid: 0 for cid in course_ids}

    out: List[CourseListItem] = []
    out: List[CourseListItem] = []
    for r in rows:
        cid, title, grade_v, skill_v, is_active, level_v, created_by, thumbnail_url = r
        total_units = int(units_counts.get(cid, 0))
        completed_units = int(completed_counts.get(cid, 0))
        total_cups = int(cups_total_map.get(cid, 0) or 0)
        cups_earned = int(cups_map.get(cid, 0) or 0)

        if not is_active:
            status_str = "locked"
        elif total_units > 0 and completed_units == total_units:
            status_str = "completed"
        elif completed_units > 0:
            status_str = "in-progress"
        else:
            status_str = "not-started"

        instructor = "?????" if (created_by and (created_by % 2 == 0)) else "?????"

        out.append({
            "id": cid,
            "name": title,
            "category": skill_v,
            "gradeLabel": _grade_label(grade_v),
            "totalUnits": total_units,
            "completedUnits": completed_units,
            "cupsEarned": min(cups_earned, total_cups),
            "totalCups": total_cups,
            "status": status_str,
            "instructor": instructor,
            "level": level_v or _level_from_grade(int(grade_v or 0)),
            "thumbnail_url": thumbnail_url,
        })

    return out


@router.post("/", response_model=CourseResponse, status_code=201)
async def create_course(
    payload: CourseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a public course (teacher/admin)."""
    try:
        if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
            raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được tạo khóa học")

        # Keep 'category' mirrored with 'skill' for backward compatibility
        course = Course(
            title=payload.title,
            description=payload.description,
            grade=int(payload.grade),
            skill=payload.skill,
            category=payload.skill,
            total_cups=0,
            is_premium=False,
            level=payload.level or _level_from_grade(int(payload.grade)),
            is_active=payload.is_active if payload.is_active is not None else True,
            thumbnail_url=payload.thumbnail_url if hasattr(payload, 'thumbnail_url') else None,
            created_by=current_user.id,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return course
    except HTTPException:
        raise
    except Exception as e:
        # Log error for debugging and return JSON detail instead of plain 500
        print("[ERROR] create_course:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    payload: CourseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền sửa khóa học này")

    if payload.title is not None:
        course.title = payload.title
    if payload.description is not None:
        course.description = payload.description
    if payload.grade is not None:
        course.grade = int(payload.grade)
    if payload.skill is not None:
        course.skill = payload.skill
        course.category = payload.skill
    if payload.level is not None:
        course.level = payload.level
    if payload.is_active is not None:
        course.is_active = payload.is_active
    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/exercises", response_model=CourseExerciseResponse, status_code=201)
async def create_course_exercise(
    course_id: int,
    payload: CourseExerciseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    # Mở quyền: mọi giáo viên đều có thể thêm bài tập cho khóa công khai
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được thêm bài tập")

    ex = CourseExercise(
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        max_score=payload.max_score,
        order_index=payload.order_index,
        content_json=json.dumps(payload.content or {}, ensure_ascii=False),
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.get("/{course_id}/exercises", response_model=List[CourseExerciseResponse])
async def list_course_exercises(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    q = db.query(CourseExercise).filter(CourseExercise.course_id == course_id)
    q = q.order_by(CourseExercise.order_index.asc().nulls_last(), CourseExercise.id.asc())
    rows = q.all()
    out = []
    for r in rows:
        content = None
        try:
            if r.content_json:
                content = json.loads(r.content_json)
        except Exception:
            content = None
        out.append({
            "id": r.id,
            "course_id": r.course_id,
            "title": r.title,
            "description": r.description,
            "type": r.type,
            "max_score": r.max_score,
            "order_index": r.order_index,
            "created_at": r.created_at,
            "content": content,
        })
    return out


@router.post("/{course_id}/exercises/{exercise_id}/submit", response_model=CourseSubmissionResponse)
async def submit_course_exercise(
    course_id: int,
    exercise_id: int,
    payload: CourseSubmissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    exercise = db.query(CourseExercise).filter(
        CourseExercise.id == exercise_id,
        CourseExercise.course_id == course_id,
    ).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")

    # Update if exists, else create
    sub = (
        db.query(CourseSubmission)
        .filter(CourseSubmission.exercise_id == exercise_id, CourseSubmission.student_id == current_user.id)
        .first()
    )
    if sub:
        sub.content_text = payload.content_text
        sub.content_url = payload.content_url
        sub.status = "submitted"
        db.commit()
        db.refresh(sub)
        return sub

    sub = CourseSubmission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content_text=payload.content_text,
        content_url=payload.content_url,
        status="submitted",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/{course_id}/units", response_model=List[dict])
async def list_course_units(
    course_id: int,
    db: Session = Depends(get_db),
):
    try:
        # Ensure tables exist (defensive when running with old DBs)
        try:
            from app.utils.db_migrations import ensure_course_units_tables
            ensure_course_units_tables()
        except Exception:
            pass

        # Only check existence by id to avoid selecting all columns on partially-migrated DBs
        exists_id = db.query(Course.id).filter(Course.id == course_id).scalar()
        if not exists_id:
            raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
        from app.models.course import CourseUnit, CourseQuestion
        units = (
            db.query(CourseUnit)
            .filter(CourseUnit.course_id == course_id)
            .order_by(CourseUnit.week_index.asc().nulls_last(), CourseUnit.order_index.asc().nulls_last(), CourseUnit.id.asc())
            .all()
        )
        # Count questions per unit
        unit_ids = [u.id for u in units]
        counts = {}
        if unit_ids:
            rows = (
                db.query(CourseQuestion.unit_id, func.count(CourseQuestion.id))
                .filter(CourseQuestion.unit_id.in_(unit_ids))
                .group_by(CourseQuestion.unit_id)
                .all()
            )
            counts = {uid: int(c) for uid, c in rows}
        out = []
        for u in units:
            out.append({
                "id": u.id,
                "course_id": u.course_id,
                "title": u.title,
                "description": u.description,
                "week_index": u.week_index,
                "order_index": u.order_index,
                "created_at": u.created_at,
                "questions": counts.get(u.id, 0),
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] list_course_units:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{course_id}/units", response_model=dict, status_code=201)
async def create_course_unit(
    course_id: int,
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        # Ensure table/columns exist (defensive for legacy DBs)
        try:
            from app.utils.db_migrations import ensure_course_units_tables, ensure_course_units_columns
            ensure_course_units_tables(); ensure_course_units_columns()
        except Exception:
            pass
        from app.models.course import CourseUnit
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
        # Mở quyền: mọi giáo viên đều có thể thêm bài cho khóa công khai
        if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
            raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được thêm bài")
        title = (payload.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Thiếu tiêu đề bài (title)")
        week_index = payload.get("week_index")
        try:
            if week_index is not None:
                week_index = int(week_index)
        except Exception:
            week_index = None
        order_index = payload.get("order_index")
        try:
            if order_index is not None:
                order_index = int(order_index)
        except Exception:
            order_index = None
        unit = CourseUnit(
            course_id=course_id,
            title=title,
            description=payload.get("description"),
            week_index=week_index,
            order_index=order_index,
            unit_type=(payload.get("unit_type") or "lesson"),
            max_cups=int(payload.get("max_cups") or 2),
        )
        db.add(unit)
        db.commit()
        db.refresh(unit)
        return {
            "id": unit.id,
            "course_id": unit.course_id,
            "title": unit.title,
            "description": unit.description,
            "week_index": unit.week_index,
            "order_index": unit.order_index,
            "created_at": unit.created_at,
            "questions": 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] create_course_unit:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/questions", response_model=List[dict])
async def list_unit_questions(
    unit_id: int,
    db: Session = Depends(get_db),
):
    try:
        from app.models.course import CourseUnit, CourseQuestion
        unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
        if not unit:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài (unit)")
        rows = (
            db.query(CourseQuestion)
            .filter(CourseQuestion.unit_id == unit_id)
            .order_by(CourseQuestion.order_index.asc().nulls_last(), CourseQuestion.id.asc())
            .all()
        )
        out = []
        for q in rows:
            options = None
            answer = None
            try:
                if q.options_json:
                    options = json.loads(q.options_json)
            except Exception:
                options = None
            try:
                if q.answer_json:
                    answer = json.loads(q.answer_json)
            except Exception:
                answer = None
            out.append({
                "id": q.id,
                "unit_id": q.unit_id,
                "type": q.type,
                "prompt": q.prompt,
                "options": options,
                "answer": answer,
                "media_url": q.media_url,
                "points": q.points,
                "order_index": q.order_index,
                "created_at": q.created_at,
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] list_unit_questions:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/units/{unit_id}/questions", response_model=dict, status_code=201)
async def create_unit_question(
    unit_id: int,
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.models.course import CourseUnit, CourseQuestion, Course
    unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài (unit)")
    course = db.query(Course).filter(Course.id == unit.course_id).first()
    # Mở quyền: mọi giáo viên đều có thể thêm câu hỏi cho bài của khóa công khai
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được thêm câu hỏi")
    q = CourseQuestion(
        unit_id=unit_id,
        type=payload.get("type"),
        prompt=payload.get("prompt"),
        options_json=json.dumps(payload.get("options") or [], ensure_ascii=False),
        answer_json=json.dumps(payload.get("answer") or {}, ensure_ascii=False),
        media_url=payload.get("media_url"),
        points=payload.get("points"),
        order_index=payload.get("order_index"),
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {
        "id": q.id,
        "unit_id": q.unit_id,
        "type": q.type,
        "prompt": q.prompt,
        "options": json.loads(q.options_json or "[]"),
        "answer": json.loads(q.answer_json or "{}"),
        "media_url": q.media_url,
        "points": q.points,
        "order_index": q.order_index,
        "created_at": q.created_at,
    }


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a course (teacher/admin only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa khóa học này")
    
    db.delete(course)
    db.commit()
    return None


@router.put("/{course_id}/units/{unit_id}", response_model=dict)
async def update_course_unit(
    course_id: int,
    unit_id: int,
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a course unit."""
    try:
        from app.models.course import CourseUnit
        unit = db.query(CourseUnit).filter(
            CourseUnit.id == unit_id,
            CourseUnit.course_id == course_id
        ).first()
        if not unit:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Không có quyền sửa bài học này")
        
        # Update fields
        if "title" in payload:
            unit.title = payload["title"]
        if "description" in payload:
            unit.description = payload["description"]
        if "week_index" in payload:
            unit.week_index = int(payload["week_index"]) if payload["week_index"] else None
        if "order_index" in payload:
            unit.order_index = int(payload["order_index"]) if payload["order_index"] else None
        if "max_cups" in payload:
            unit.max_cups = int(payload["max_cups"])
        
        db.commit()
        db.refresh(unit)
        
        return {
            "id": unit.id,
            "course_id": unit.course_id,
            "title": unit.title,
            "description": unit.description,
            "week_index": unit.week_index,
            "order_index": unit.order_index,
            "max_cups": unit.max_cups,
            "created_at": unit.created_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] update_course_unit:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{course_id}/units/{unit_id}", status_code=204)
async def delete_course_unit(
    course_id: int,
    unit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a course unit."""
    try:
        from app.models.course import CourseUnit
        unit = db.query(CourseUnit).filter(
            CourseUnit.id == unit_id,
            CourseUnit.course_id == course_id
        ).first()
        if not unit:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
        
        course = db.query(Course).filter(Course.id == course_id).first()
        if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Không có quyền xóa bài học này")
        
        db.delete(unit)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] delete_course_unit:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/units/{unit_id}/questions/{question_id}", status_code=204)
async def delete_unit_question(
    unit_id: int,
    question_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a question from a unit."""
    try:
        from app.models.course import CourseUnit, CourseQuestion, Course
        question = db.query(CourseQuestion).filter(
            CourseQuestion.id == question_id,
            CourseQuestion.unit_id == unit_id
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")
        
        unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
        course = db.query(Course).filter(Course.id == unit.course_id).first()
        if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Không có quyền xóa câu hỏi này")
        
        db.delete(question)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] delete_unit_question:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============= File Uploads for Questions =============

UPLOAD_DIR = Path("media/courses")
ALLOWED_AUDIO_TYPES = {".mp3", ".wav", ".ogg", ".m4a"}
ALLOWED_DOC_TYPES = {".pdf", ".docx", ".doc", ".txt"}
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_DOC_SIZE = 10 * 1024 * 1024    # 10MB


@router.post("/upload/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload audio file for listening questions."""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được upload audio")
    
    # Check file type
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ chấp nhận file audio: {', '.join(ALLOWED_AUDIO_TYPES)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=400, detail="File audio không được vượt quá 50MB")
    
    # Create upload directory
    audio_dir = UPLOAD_DIR / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{current_user.id}_{file.filename}"
    file_path = audio_dir / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return relative URL
    return {
        "url": f"/media/courses/audio/{safe_filename}",
        "filename": file.filename,
        "size": len(contents)
    }


@router.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload document file for reading questions."""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được upload tài liệu")
    
    # Check file type
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ chấp nhận file: {', '.join(ALLOWED_DOC_TYPES)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_DOC_SIZE:
        raise HTTPException(status_code=400, detail="File không được vượt quá 10MB")
    
    # Create upload directory
    doc_dir = UPLOAD_DIR / "documents"
    doc_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{current_user.id}_{file.filename}"
    file_path = doc_dir / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Extract text content if possible (for preview)
    text_content = None
    try:
        if file_ext == ".txt":
            text_content = contents.decode("utf-8")[:1000]  # First 1000 chars
    except Exception:
        pass
    
    return {
        "url": f"/media/courses/documents/{safe_filename}",
        "filename": file.filename,
        "size": len(contents),
        "preview": text_content
    }


@router.post("/upload/thumbnail")
async def upload_thumbnail(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload thumbnail image for courses."""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được upload thumbnail")
    
    # Check file type
    allowed_image_types = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_image_types:
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ chấp nhận ảnh: {', '.join(allowed_image_types)}"
        )
    
    # Check file size (max 2MB)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ảnh không được vượt quá 2MB")
    
    # Create upload directory
    thumb_dir = UPLOAD_DIR / "thumbnails"
    thumb_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{current_user.id}_{file.filename}"
    file_path = thumb_dir / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {
        "url": f"/media/courses/thumbnails/{safe_filename}",
        "filename": file.filename,
        "size": len(contents)
    }


@router.post("/speaking/submit")
async def submit_speaking_audio(
    audio: UploadFile = File(...),
    reference_text: str = Form(...),
    unit_id: int = Form(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Submit speaking audio for AI grading using Azure Speech API.
    Returns detailed pronunciation assessment with word-level feedback.
    """
    try:
        # Validate file type
        allowed_audio = {".wav", ".mp3", ".m4a", ".ogg", ".webm"}
        file_ext = Path(audio.filename).suffix.lower() if audio.filename else ".wav"
        if file_ext not in allowed_audio:
            raise HTTPException(
                status_code=400, 
                detail=f"Chỉ chấp nhận file audio: {', '.join(allowed_audio)}"
            )
        
        # Save audio file temporarily
        audio_dir = UPLOAD_DIR / "speaking_temp"
        audio_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_filename = f"speaking_{current_user.id}_{timestamp}{file_ext}"
        temp_path = audio_dir / temp_filename
        
        contents = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        print(f"[SPEAKING] Saved audio to {temp_path}, size: {len(contents)} bytes")
        print(f"[SPEAKING] Reference text: {reference_text}")
        
        # Use Azure Speech Service for pronunciation assessment
        from app.services.azure_speech_service import azure_speech_service
        
        assessment = await azure_speech_service.assess_pronunciation(
            str(temp_path),
            reference_text,
            language="en-US"
        )
        
        print(f"[SPEAKING] Assessment result: {assessment}")
        
        # Calculate speaking score
        score_result = azure_speech_service.calculate_speaking_score(assessment, max_score=10.0)
        
        # Extract word-level feedback for frontend display
        words_feedback = []
        if 'words' in assessment:
            for word_data in assessment['words']:
                word_assessment = word_data.get('PronunciationAssessment', {})
                accuracy = word_assessment.get('AccuracyScore', 0)
                
                # Classify word as good/error based on accuracy
                word_type = 'good' if accuracy >= 75 else 'error'
                
                words_feedback.append({
                    'text': word_data.get('Word', ''),
                    'type': word_type,
                    'accuracy': accuracy,
                    'error_type': word_assessment.get('ErrorType', 'None')
                })
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
        
        # Return detailed result for frontend
        return {
            "success": True,
            "recognized_text": assessment.get('recognized_text', ''),
            "score": score_result['score'],
            "max_score": score_result['max_score'],
            "breakdown": {
                "pronunciation": score_result['breakdown']['pronunciation'],
                "fluency": score_result['breakdown']['fluency'],
                "completeness": score_result['breakdown']['completeness'],
                "accuracy": score_result['breakdown']['accuracy']
            },
            "words_feedback": words_feedback,
            "feedback": score_result.get('feedback', ''),
            "detailed_feedback": score_result.get('detailed_feedback', ''),
            "error_count": len([w for w in words_feedback if w['type'] == 'error']),
            "good_count": len([w for w in words_feedback if w['type'] == 'good'])
        }
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"File error: {str(e)}")
    except Exception as e:
        print(f"[SPEAKING ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI grading error: {str(e)}")


# ============= Student Progress & Unit Attempts =============

@router.post("/units/{unit_id}/submit")
async def submit_unit_attempt(
    unit_id: int,
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Student submits answers for a unit and gets scored."""
    try:
        from app.models.course import CourseUnit, CourseQuestion, UnitAttempt, CourseProgress, Course
        
        unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
        if not unit:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
        
        # Get all questions for this unit
        questions = db.query(CourseQuestion).filter(CourseQuestion.unit_id == unit_id).all()
        if not questions:
            raise HTTPException(status_code=400, detail="Bài học chưa có câu hỏi")
        
        # Get student's answers from payload
        student_answers = payload.get("answers", {})  # {question_id: answer}
        
        # Calculate score
        total_score = 0
        max_score = 0
        for q in questions:
            max_score += (q.points or 1)
            q_id_str = str(q.id)
            if q_id_str in student_answers:
                student_answer = student_answers[q_id_str]
                # Parse correct answer
                try:
                    correct_answer = json.loads(q.answer_json) if q.answer_json else {}
                    # Simple scoring: for MCQ, check if correct index matches
                    if q.type in ["mcq", "mcq-audio"] and "correct" in correct_answer:
                        if int(student_answer) == int(correct_answer["correct"]):
                            total_score += (q.points or 1)
                except Exception:
                    pass
        
        # Calculate cups earned (based on score percentage)
        score_percentage = (total_score / max_score * 100) if max_score > 0 else 0
        cups_earned = 0
        if score_percentage >= 90:
            cups_earned = unit.max_cups
        elif score_percentage >= 70:
            cups_earned = max(1, unit.max_cups - 1)
        elif score_percentage >= 50:
            cups_earned = max(0, unit.max_cups - 2)
        
        is_passed = score_percentage >= 50
        
        # Save attempt
        attempt = UnitAttempt(
            user_id=current_user.id,
            unit_id=unit_id,
            answers_json=json.dumps(student_answers, ensure_ascii=False),
            score=total_score,
            max_score=max_score,
            cups_earned=cups_earned,
            is_passed=is_passed,
        )
        db.add(attempt)
        
        # Update or create progress
        progress = db.query(CourseProgress).filter(
            CourseProgress.user_id == current_user.id,
            CourseProgress.unit_id == unit_id
        ).first()
        
        if progress:
            # Update existing progress
            if total_score > (progress.score or 0):
                progress.score = total_score
                progress.cups_earned = cups_earned
            if is_passed and not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = func.now()
        else:
            # Create new progress
            progress = CourseProgress(
                user_id=current_user.id,
                course_id=unit.course_id,
                unit_id=unit_id,
                is_completed=is_passed,
                cups_earned=cups_earned,
                score=total_score,
                completed_at=func.now() if is_passed else None
            )
            db.add(progress)
        
        db.commit()
        db.refresh(attempt)
        
        return {
            "attempt_id": attempt.id,
            "score": total_score,
            "max_score": max_score,
            "percentage": round(score_percentage, 1),
            "cups_earned": cups_earned,
            "is_passed": is_passed,
            "message": "Chúc mừng! Bạn đã hoàn thành bài học." if is_passed else "Hãy cố gắng thêm lần sau!"
        }
    except HTTPException:
        raise
    except Exception as e:
        print("[ERROR] submit_unit_attempt:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress/my")
async def get_my_progress(
    course_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user's progress across all courses or specific course."""
    try:
        from app.models.course import CourseProgress, Course, CourseUnit
        
        query = db.query(CourseProgress).filter(CourseProgress.user_id == current_user.id)
        if course_id:
            query = query.filter(CourseProgress.course_id == course_id)
        
        progress_records = query.all()
        
        # Group by course
        courses_progress = {}
        for p in progress_records:
            if p.course_id not in courses_progress:
                course = db.query(Course).filter(Course.id == p.course_id).first()
                courses_progress[p.course_id] = {
                    "course_id": p.course_id,
                    "course_title": course.title if course else "Unknown",
                    "total_cups": 0,
                    "units_completed": 0,
                    "units_total": 0,
                    "units": []
                }
            
            if p.unit_id:
                unit = db.query(CourseUnit).filter(CourseUnit.id == p.unit_id).first()
                courses_progress[p.course_id]["units"].append({
                    "unit_id": p.unit_id,
                    "unit_title": unit.title if unit else "Unknown",
                    "is_completed": p.is_completed,
                    "cups_earned": p.cups_earned,
                    "score": p.score,
                    "completed_at": p.completed_at.isoformat() if p.completed_at else None
                })
                courses_progress[p.course_id]["total_cups"] += p.cups_earned
                if p.is_completed:
                    courses_progress[p.course_id]["units_completed"] += 1
        
        # Get total units per course
        for cid in courses_progress:
            total_units = db.query(func.count(CourseUnit.id)).filter(CourseUnit.course_id == cid).scalar()
            courses_progress[cid]["units_total"] = total_units or 0
        
        return list(courses_progress.values())
    except Exception as e:
        print("[ERROR] get_my_progress:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/attempts")
async def get_unit_attempts(
    unit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all attempts for a unit by current user."""
    try:
        from app.models.course import UnitAttempt
        
        attempts = db.query(UnitAttempt).filter(
            UnitAttempt.unit_id == unit_id,
            UnitAttempt.user_id == current_user.id
        ).order_by(UnitAttempt.submitted_at.desc()).all()
        
        result = []
        for a in attempts:
            result.append({
                "id": a.id,
                "score": a.score,
                "max_score": a.max_score,
                "percentage": round((a.score / a.max_score * 100) if a.max_score else 0, 1),
                "cups_earned": a.cups_earned,
                "is_passed": a.is_passed,
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None
            })
        
        return result
    except Exception as e:
        print("[ERROR] get_unit_attempts:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


# ============= AI Feedback Endpoints =============

@router.post("/feedback/listening")
async def generate_listening_feedback(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI feedback for listening exercise
    Payload: {score, correct_answers, total_questions, time_spent, unit_id}
    """
    try:
        score = payload.get("score", 0)
        correct_answers = payload.get("correct_answers", 0)
        total_questions = payload.get("total_questions", 0)
        time_spent = payload.get("time_spent", 0)
        
        # Determine user level (can be from user profile or inferred)
        user_level = "Intermediate"  # Default
        
        feedback = ai_feedback_service.generate_listening_feedback(
            score=score,
            correct_answers=correct_answers,
            total_questions=total_questions,
            time_spent=time_spent,
            user_level=user_level
        )
        
        return {
            "success": True,
            "feedback": feedback
        }
    except Exception as e:
        print(f"[LISTENING FEEDBACK ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")


@router.post("/feedback/reading")
async def generate_reading_feedback(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI feedback for reading exercise
    Payload: {score, correct_answers, total_questions, time_spent, unit_id}
    """
    try:
        score = payload.get("score", 0)
        correct_answers = payload.get("correct_answers", 0)
        total_questions = payload.get("total_questions", 0)
        time_spent = payload.get("time_spent", 0)
        
        user_level = "Intermediate"
        
        feedback = ai_feedback_service.generate_reading_feedback(
            score=score,
            correct_answers=correct_answers,
            total_questions=total_questions,
            time_spent=time_spent,
            user_level=user_level
        )
        
        return {
            "success": True,
            "feedback": feedback
        }
    except Exception as e:
        print(f"[READING FEEDBACK ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")


@router.post("/feedback/writing")
async def generate_writing_feedback(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI feedback for writing exercise
    Payload: {essay_text, word_count, target_words, time_spent, unit_id}
    """
    try:
        essay_text = payload.get("essay_text", "")
        word_count = payload.get("word_count", 0)
        target_words = payload.get("target_words", 250)
        time_spent = payload.get("time_spent", 0)
        
        user_level = "Intermediate"
        
        feedback = ai_feedback_service.generate_writing_feedback(
            essay_text=essay_text,
            word_count=word_count,
            target_words=target_words,
            time_spent=time_spent,
            user_level=user_level
        )
        
        return {
            "success": True,
            "feedback": feedback
        }
    except Exception as e:
        print(f"[WRITING FEEDBACK ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating feedback: {str(e)}")


# ============= Learning Profile Stats =============

@router.get("/learning-profile/stats")
async def get_learning_profile_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive learning profile statistics for current user
    Includes:
    - Total study time
    - Total cups earned
    - Total tests/attempts
    - Total lessons completed
    - Skill-based average scores (Listening, Speaking, Reading, Writing)
    """
    try:
        from app.models.course import CourseProgress, UnitAttempt, Course, CourseUnit
        from sqlalchemy import func, case
        
        user_id = current_user.id
        
        # 1. Get all unit attempts for this user
        attempts = db.query(UnitAttempt).filter(
            UnitAttempt.user_id == user_id
        ).all()
        
        # 2. Get all course progress for this user
        progress_records = db.query(CourseProgress).filter(
            CourseProgress.user_id == user_id
        ).all()
        
        # Calculate total stats
        total_time_seconds = sum([
            (a.submitted_at - a.submitted_at).total_seconds() 
            if a.submitted_at else 0 
            for a in attempts
        ])
        # Fallback: estimate from number of attempts (avg 10 min per attempt)
        if total_time_seconds == 0:
            total_time_seconds = len(attempts) * 600  # 10 minutes per attempt
        
        total_cups = sum([p.cups_earned for p in progress_records])
        total_attempts = len(attempts)
        total_completed = len([p for p in progress_records if p.is_completed])
        
        # 3. Calculate skill-based scores
        # Get unit attempts with their associated course skills
        skill_scores = {
            'listening': [],
            'speaking': [],
            'reading': [],
            'writing': []
        }
        
        for attempt in attempts:
            # Get the unit
            unit = db.query(CourseUnit).filter(CourseUnit.id == attempt.unit_id).first()
            if not unit:
                continue
                
            # Get the course
            course = db.query(Course).filter(Course.id == unit.course_id).first()
            if not course or not course.skill:
                continue
            
            # Calculate percentage score
            if attempt.max_score and attempt.max_score > 0:
                percentage = (attempt.score / attempt.max_score) * 100
                skill = course.skill.lower()
                
                if skill in skill_scores:
                    skill_scores[skill].append(percentage)
        
        # Calculate average scores for each skill (0-10 scale)
        skill_averages = {}
        for skill, scores in skill_scores.items():
            if scores:
                avg_percentage = sum(scores) / len(scores)
                skill_averages[skill] = {
                    'score': round((avg_percentage / 100) * 10, 1),  # Convert to 0-10 scale
                    'max_score': 10,
                    'percentage': round(avg_percentage, 0),
                    'attempts_count': len(scores)
                }
            else:
                skill_averages[skill] = {
                    'score': 0,
                    'max_score': 10,
                    'percentage': 0,
                    'attempts_count': 0
                }
        
        # Format total time as hours and minutes
        total_hours = int(total_time_seconds // 3600)
        total_minutes = int((total_time_seconds % 3600) // 60)
        
        return {
            "success": True,
            "stats": {
                "total_time": {
                    "seconds": int(total_time_seconds),
                    "hours": total_hours,
                    "minutes": total_minutes,
                    "formatted": f"{total_hours} giờ {total_minutes} phút"
                },
                "total_cups": total_cups,
                "total_tests": total_attempts,
                "total_lessons_completed": total_completed,
                "skills": {
                    "listening": skill_averages['listening'],
                    "speaking": skill_averages['speaking'],
                    "reading": skill_averages['reading'],
                    "writing": skill_averages['writing']
                }
            }
        }
    except Exception as e:
        print(f"[LEARNING PROFILE ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching learning profile: {str(e)}")


