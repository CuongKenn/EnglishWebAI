import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
import json

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.course import Course, CourseExercise, CourseQuestion, CourseSubmission, CourseUnit
from app.models.user import User, UserRole
from app.schemas.course import (
    CourseCreate,
    CourseExerciseCreate,
    CourseExerciseResponse,
    CourseListItem,
    CourseResponse,
    CourseSubmissionCreate,
    CourseSubmissionResponse,
    CourseUpdate,
)

router = APIRouter()


def _grade_label(grade: int | None) -> str | None:
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


@router.get("/", response_model=list[CourseListItem])
async def list_courses(
    grade: int | None = None,
    skill: str | None = None,
    search: str | None = None,
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
        User.full_name,
    ).outerjoin(User, User.id == Course.created_by).filter(Course.is_active)
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

    # Calculate actual student progress based on unit completions
    # A unit is "completed" if the student has answered questions in that unit
    # Get distinct units where student has submissions via CourseQuestion -> CourseSubmission
    # Note: CourseSubmission table needs a question_id field for this to work properly
    # For now, we'll use a simpler approach based on course exercises

    # Check if student has any submissions for exercises in each course
    student_activity = (
        db.query(
            Course.id.label('course_id'),
            func.count(func.distinct(CourseExercise.id)).label('completed_exercises')
        )
        .join(CourseExercise, CourseExercise.course_id == Course.id)
        .join(CourseSubmission, CourseSubmission.exercise_id == CourseExercise.id)
        .filter(
            Course.id.in_(course_ids),
            CourseSubmission.student_id == current_user.id
        )
        .group_by(Course.id)
        .all()
    )
    # Map completed exercises to "completed units" as a rough estimate
    completed_counts = {row.course_id: min(row.completed_exercises, units_counts.get(row.course_id, 0))
                       for row in student_activity}

    # Calculate cups earned based on submission scores
    student_cups = (
        db.query(
            Course.id.label('course_id'),
            func.coalesce(func.sum(CourseSubmission.score), 0).label('cups_earned')
        )
        .join(CourseExercise, CourseExercise.course_id == Course.id)
        .join(CourseSubmission, CourseSubmission.exercise_id == CourseExercise.id)
        .filter(
            Course.id.in_(course_ids),
            CourseSubmission.student_id == current_user.id
        )
        .group_by(Course.id)
        .all()
    )
    cups_map = {row.course_id: int(row.cups_earned or 0) for row in student_cups}

    out: list[CourseListItem] = []
    out: list[CourseListItem] = []
    for r in rows:
        cid, title, grade_v, skill_v, is_active, level_v, created_by, creator_name = r
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

        instructor = creator_name if creator_name else "Giáo viên"

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
        logger.info("[ERROR] create_course:", repr(e))
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


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Xóa khóa học (hard delete).
    Chỉ admin/superadmin hoặc người tạo khóa học mới có quyền xóa.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Không tìm thấy khóa học")

    # Kiểm tra quyền: chỉ admin/superadmin hoặc người tạo
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and course.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa khóa học này")

    # Hard delete
    db.delete(course)
    db.commit()
    return


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


@router.get("/{course_id}/exercises", response_model=list[CourseExerciseResponse])
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


@router.post("/units/{unit_id}/submit", response_model=CourseSubmissionResponse)
async def submit_unit_answers(
    unit_id: int,
    payload: CourseSubmissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Submit answers for a course unit (for writing/listening/etc exercises in courses)
    Creates a CourseExercise if not exists, then saves submission
    """
    from app.models.course import CourseUnit
    unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")

    # Find or create a CourseExercise for this unit
    exercise = (
        db.query(CourseExercise)
        .filter(CourseExercise.course_id == unit.course_id, CourseExercise.title == unit.title)
        .first()
    )
    if not exercise:
        exercise = CourseExercise(
            course_id=unit.course_id,
            title=unit.title,
            description=unit.description,
            type="assignment",
            max_score=unit.max_cups or 10,
            order_index=unit.order_index,
        )
        db.add(exercise)
        db.commit()
        db.refresh(exercise)

    # Update if exists, else create submission
    sub = (
        db.query(CourseSubmission)
        .filter(CourseSubmission.exercise_id == exercise.id, CourseSubmission.student_id == current_user.id)
        .first()
    )
    if sub:
        sub.content_text = payload.content_text
        sub.content_url = payload.content_url
        if payload.score is not None:
            try:
                sub.score = int(round(payload.score))
            except Exception:
                sub.score = payload.score
            sub.status = "graded"
            sub.graded_at = datetime.utcnow()
        else:
            sub.status = "submitted"
        if payload.time_spent is not None:
            try:
                sub.time_spent = int(payload.time_spent)
            except Exception:
                sub.time_spent = payload.time_spent
        db.commit()
        db.refresh(sub)
        return sub

    sub = CourseSubmission(
        exercise_id=exercise.id,
        student_id=current_user.id,
        content_text=payload.content_text,
        content_url=payload.content_url,
        status="graded" if payload.score is not None else "submitted",
    )
    if payload.score is not None:
        try:
            sub.score = int(round(payload.score))
        except Exception:
            sub.score = payload.score
        sub.graded_at = datetime.utcnow()
    if payload.time_spent is not None:
        try:
            sub.time_spent = int(payload.time_spent)
        except Exception:
            sub.time_spent = payload.time_spent
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/{course_id}/units", response_model=list[dict])
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
        from app.models.course import CourseQuestion, CourseUnit
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
        logger.info("[ERROR] list_course_units:", repr(e))
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
            from app.utils.db_migrations import ensure_course_units_columns, ensure_course_units_tables
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
        logger.info("[ERROR] create_course_unit:", repr(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/questions", response_model=list[dict])
async def list_unit_questions(
    unit_id: int,
    db: Session = Depends(get_db),
):
    try:
        from app.models.course import CourseQuestion, CourseUnit
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
        logger.info("[ERROR] list_unit_questions:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/units/{unit_id}/questions", response_model=dict, status_code=201)
async def create_unit_question(
    unit_id: int,
    payload: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from app.models.course import Course, CourseUnit
    unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài (unit)")
    db.query(Course).filter(Course.id == unit.course_id).first()
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


@router.delete("/units/{unit_id}", status_code=204)
async def delete_course_unit(
    unit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Xóa một bài (unit) trong khóa học. Chỉ giáo viên hoặc admin được phép.

    Lưu ý: Ràng buộc FK đã cấu hình CASCADE nên câu hỏi trong unit sẽ bị xóa theo.
    """
    from app.models.course import CourseUnit
    unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài (unit)")

    # Quyền: giáo viên, admin, superadmin
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được xóa bài")

    try:
        db.delete(unit)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/units/{unit_id}/questions/{question_id}", status_code=204)
async def delete_unit_question(
    unit_id: int,
    question_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Xóa một câu hỏi trong bài (unit). Chỉ giáo viên hoặc admin được phép."""
    from app.models.course import CourseUnit
    unit = db.query(CourseUnit).filter(CourseUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài (unit)")

    q = (
        db.query(CourseQuestion)
        .filter(CourseQuestion.id == question_id, CourseQuestion.unit_id == unit_id)
        .first()
    )
    if not q:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")

    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được xóa câu hỏi")

    try:
        db.delete(q)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



