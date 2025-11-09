import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

logger = logging.getLogger(__name__)
import csv
import io

from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.attendance import AttendanceRecord
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.lesson import Lesson
from app.models.material import Material
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.schemas.excel_import import AddStudentsToClassRequest, AddStudentsToClassResponse
from app.schemas.student import (
    AddStudentsRequest,
    AttendanceRecordOut,
    AttendanceUpsertRequest,
    ClassroomListResponse,
    ClassroomResponse,
    ClassStudentOut,
    EnrollmentResponse,
    ExerciseWithSubmissionResponse,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    MaterialResponse,
)
from app.services.excel_import_service import ClassStudentService, ExcelImportService

router = APIRouter()

@router.get("/", response_model=list[ClassroomListResponse])
async def get_classes(
    search: str = None,
    grade: int = None,
    subject: str = None,
    skill: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các lớp học có sẵn để tham gia
    """
    # Lấy danh sách lớp trước, đếm sĩ số bằng truy vấn riêng để tránh lỗi GROUP BY trên Postgres
    query = db.query(Classroom)

    # Filter by search term
    if search:
        query = query.filter(
            (Classroom.name.ilike(f"%{search}%")) |
            (Classroom.description.ilike(f"%{search}%"))
        )

    # Filter by grade/skill
    if grade is not None:
        try:
            g = int(grade)
            query = query.filter(Classroom.grade == g)
        except Exception:
            pass
    if skill:
        query = query.filter(Classroom.skill == skill)

    # Filter active classes only
    query = query.filter(Classroom.is_active)
    query = query.offset(skip).limit(limit)
    classes_rows = query.all()

    # Đếm sĩ số theo class_id (chỉ active students)
    class_ids = [c.id for c in classes_rows]
    counts_map = {}
    if class_ids:
        counts = (
            db.query(Enrollment.class_id, func.count(Enrollment.id))
            .filter(
                Enrollment.class_id.in_(class_ids),
                Enrollment.status == "active",
                Enrollment.role == "student"
            )
            .group_by(Enrollment.class_id)
            .all()
        )
        counts_map = {cid: int(cnt) for cid, cnt in counts}

    # Resolve teacher names
    teacher_ids = [c.teacher_id for c in classes_rows if c.teacher_id]
    name_map = {}
    if teacher_ids:
        rows = db.query(User.id, User.full_name, User.username).filter(User.id.in_(teacher_ids)).all()
        for i, full_name, username in rows:
            name_map[i] = full_name or username

    # Format response
    classes = []
    for classroom in classes_rows:
        classes.append({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "schedule": classroom.schedule,
            "max_students": classroom.max_students,
            "maxStudents": classroom.max_students,
            "students": counts_map.get(classroom.id, 0),
            "student_count": counts_map.get(classroom.id, 0),
            "teacher_name": name_map.get(classroom.teacher_id, "Chưa có giáo viên"),
            "subject": "Tiếng Anh",
            "grade": f"Lớp {classroom.grade}" if classroom.grade else None,
            "skill": classroom.skill,
            "image": "📚",
            "color": "blue"
        })

    return classes

@router.get("/my-classes", response_model=list[ClassroomListResponse])
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

    classes_rows = db.query(Classroom).filter(Classroom.id.in_(class_ids)).all()

    # Count students for these classes
    counts = (
        db.query(Enrollment.class_id, func.count(Enrollment.id))
        .filter(
            Enrollment.class_id.in_(class_ids),
            Enrollment.status == "active",
            Enrollment.role == "student"
        )
        .group_by(Enrollment.class_id)
        .all()
    )
    counts_map = {cid: int(cnt) for cid, cnt in counts}

    # Resolve teacher names
    teacher_ids = [c.teacher_id for c in classes_rows if c.teacher_id]
    name_map = {}
    if teacher_ids:
        rows = db.query(User.id, User.full_name, User.username).filter(User.id.in_(teacher_ids)).all()
        for i, full_name, username in rows:
            name_map[i] = full_name or username

    # Format response
    classes = []
    for classroom in classes_rows:
        classes.append({
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "schedule": classroom.schedule,
            "max_students": classroom.max_students,
            "maxStudents": classroom.max_students,
            "students": counts_map.get(classroom.id, 0),
            "student_count": counts_map.get(classroom.id, 0),
            "teacher_name": name_map.get(classroom.teacher_id, "Chưa có giáo viên"),
            "subject": "Tiếng Anh",
            "grade": f"Lớp {classroom.grade}" if classroom.grade else None,
            "skill": classroom.skill,
            "image": "📚",
            "color": "green"
        })

    return classes

@router.get("/teaching", response_model=list[ClassroomListResponse])
async def get_classes_teaching(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Danh sách lớp do giáo viên hiện tại phụ trách"""
    try:
        if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
            return []

        if not current_user.id:
            return []

        classes_rows = (
            db.query(Classroom)
            .filter(Classroom.teacher_id == int(current_user.id))
            .all()
        )
        out: list[ClassroomListResponse] = []
        teacher_name = current_user.full_name or current_user.username

        # Count students for these classes
        class_ids = [c.id for c in classes_rows]
        counts_map = {}
        if class_ids:
            counts = (
                db.query(Enrollment.class_id, func.count(Enrollment.id))
                .filter(
                    Enrollment.class_id.in_(class_ids),
                    Enrollment.status == "active",
                    Enrollment.role == "student"
                )
                .group_by(Enrollment.class_id)
                .all()
            )
            counts_map = {cid: int(cnt) for cid, cnt in counts}

        for classroom in classes_rows:
            out.append({
                "id": classroom.id,
                "name": classroom.name,
                "description": classroom.description,
                "schedule": classroom.schedule,
                "max_students": classroom.max_students,
                "student_count": counts_map.get(classroom.id, 0),
                "teacher_name": teacher_name,
                "subject": None,
                "grade": None,
                "skill": None,
                "image": "📚",
                "color": "green",
            })
        return out
    except Exception as e:
        # Log để debug lỗi 500 thay vì trả text/plain chung chung
        logger.info("[ERROR] /classes/teaching:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

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
        Enrollment.status == "active",
        Enrollment.role == "student"
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
        # Reactivate enrollment
        existing_enrollment.status = "active"
        db.commit()
        db.refresh(existing_enrollment)
        return existing_enrollment

    # Check if class is full
    if classroom.max_students:
        student_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.class_id == class_id,
            Enrollment.status == "active",
            Enrollment.role == "student"
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


# ============= Teacher/Admin: Classes they teach and manage students =============

def _ensure_can_manage_class(db: Session, current_user: User, class_id: int) -> Classroom:
    classroom: Classroom | None = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lớp học")
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền quản lý lớp học này")


# Removed duplicate definition of /teaching endpoint to prevent ambiguous routing


def _ensure_can_view_class(db: Session, current_user: User, class_id: int) -> Classroom:
    """Allow teacher/admin of class or enrolled active student to view."""
    classroom: Classroom | None = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
    # Teachers/Admins
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    # Students: check enrollment active
    enr = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.user_id == current_user.id, Enrollment.status == "active")
        .first()
    )
    if enr:
        return classroom
    raise HTTPException(status_code=403, detail="Bạn chưa tham gia lớp này")


@router.get("/{class_id}/students", response_model=list[ClassStudentOut])
async def list_class_students(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Danh sách học sinh trong lớp (teacher của lớp hoặc admin)"""
    _ensure_can_manage_class(db, current_user, class_id)
    rows = (
        db.query(Enrollment, User)
        .join(User, User.id == Enrollment.user_id)
        .filter(Enrollment.class_id == class_id)
        .filter(Enrollment.role == "student")
        .filter(Enrollment.status == "active")
        .all()
    )
    out: list[ClassStudentOut] = []
    for enr, u in rows:
        out.append({
            "id": u.id,
            "username": u.username,
            "name": u.full_name or u.username,
            "email": u.email,
            "status": enr.status,
            "joined_at": enr.joined_at,
        })
    return out


@router.post("/{class_id}/students", response_model=list[ClassStudentOut])
async def add_students_to_class(
    class_id: int,
    req: AddStudentsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thêm học sinh vào lớp (teacher của lớp hoặc admin)"""
    classroom = _ensure_can_manage_class(db, current_user, class_id)

    created: list[ClassStudentOut] = []
    for identifier in req.identifiers:
        identifier = identifier.strip()
        if not identifier:
            continue
        # Find user by id/username/email
        user: User | None = None
        if req.idType == "id":
            try:
                uid = int(identifier)
                user = db.query(User).filter(User.id == uid).first()
            except Exception:
                user = None
        elif req.idType == "email":
            user = db.query(User).filter(User.email == identifier).first()
        else:  # username
            user = db.query(User).filter(User.username == identifier).first()
        if not user:
            # skip unknown users silently or raise? choose skip
            continue

        # Capacity check (if defined)
        if classroom.max_students:
            current_active = (
                db.query(func.count(Enrollment.id))
                .filter(Enrollment.class_id == class_id, Enrollment.role == "student", Enrollment.status == "active")
                .scalar()
            ) or 0
            if current_active >= classroom.max_students:
                # Stop adding more when class is full
                break

        # Check existing enrollment
        enr = (
            db.query(Enrollment)
            .filter(Enrollment.class_id == class_id, Enrollment.user_id == user.id)
            .first()
        )
        if enr:
            # reactivate if inactive
            enr.role = "student"
            enr.status = req.status
        else:
            enr = Enrollment(
                class_id=class_id,
                user_id=user.id,
                role="student",
                status=req.status,
            )
            db.add(enr)
        db.flush()
        created.append({
            "id": user.id,
            "username": user.username,
            "name": user.full_name or user.username,
            "email": user.email,
            "status": enr.status,
            "joined_at": enr.joined_at,
        })

    db.commit()
    return created


@router.delete("/{class_id}/students/{user_id}")
async def remove_student_from_class(
    class_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gỡ học sinh khỏi lớp (set inactive)"""
    _ensure_can_manage_class(db, current_user, class_id)
    enr = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == class_id, Enrollment.user_id == user_id, Enrollment.role == "student")
        .first()
    )
    if not enr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy học sinh trong lớp")
    enr.status = "inactive"
    db.commit()
    return {"message": "Đã gỡ học sinh khỏi lớp"}


# ============= Attendance =============

@router.get("/{class_id}/attendance", response_model=list[AttendanceRecordOut])
async def get_attendance_by_date(
    class_id: int,
    date: str,  # YYYY-MM-DD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_can_manage_class(db, current_user, class_id)
    from datetime import date as _d
    try:
        qdate = _d.fromisoformat(date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    rows = db.query(AttendanceRecord).filter(AttendanceRecord.class_id == class_id, AttendanceRecord.date == qdate).all()
    out: list[AttendanceRecordOut] = []
    for r in rows:
        out.append({"userId": r.user_id, "status": r.status, "note": r.note})
    return out


@router.post("/{class_id}/attendance")
async def upsert_attendance(
    class_id: int,
    payload: AttendanceUpsertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_can_manage_class(db, current_user, class_id)
    from datetime import date as _d
    try:
        qdate = _d.fromisoformat(payload.date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    for item in payload.records:
        rec = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.class_id == class_id, AttendanceRecord.user_id == item.userId, AttendanceRecord.date == qdate)
            .first()
        )
        if rec:
            rec.status = item.status
            rec.note = item.note
        else:
            rec = AttendanceRecord(class_id=class_id, user_id=item.userId, date=qdate, status=item.status, note=item.note)
            db.add(rec)
    db.commit()
    return {"message": "Attendance saved"}


# ============= Class content for enrolled students =============

@router.get("/{class_id}/materials", response_model=list[MaterialResponse])
async def list_class_materials(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách học liệu của lớp (học sinh đã tham gia, giáo viên lớp, hoặc admin)"""
    _ensure_can_view_class(db, current_user, class_id)
    return db.query(Material).filter(Material.class_id == class_id).all()


@router.get("/{class_id}/exercises", response_model=list[ExerciseWithSubmissionResponse])
async def list_class_exercises(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách bài tập của lớp, kèm bài nộp mới nhất của học sinh nếu có"""
    _ensure_can_view_class(db, current_user, class_id)

    exercises = (
        db.query(Exercise)
        .filter(Exercise.class_id == class_id)
        .order_by(Exercise.due_at.desc().nulls_last(), Exercise.created_at.desc())
        .all()
    )

    submissions_map: Dict[int, Submission] = {}
    if exercises and current_user.role == UserRole.USER:
        exercise_ids = [ex.id for ex in exercises]
        submissions = (
            db.query(Submission)
            .filter(
                Submission.exercise_id.in_(exercise_ids),
                Submission.student_id == current_user.id,
            )
            .order_by(Submission.submitted_at.desc().nulls_last())
            .all()
        )
        for sub in submissions:
            if sub.exercise_id not in submissions_map:
                submissions_map[sub.exercise_id] = sub

    result = []
    for exercise in exercises:
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description,
            "type": exercise.type,
            "skill_type": exercise.skill_type,
            "max_score": exercise.max_score,
            "duration": exercise.duration,
            "content": exercise.content,
            "class_id": exercise.class_id,
            "lesson_id": exercise.lesson_id,
            "due_at": exercise.due_at,
            "created_at": exercise.created_at,
            "enable_ai_grading": getattr(exercise, "enable_ai_grading", False),
            "my_submission": submissions_map.get(exercise.id),
        })

    return result


@router.post("/{class_id}/lessons/ensure-default", response_model=LessonResponse, status_code=201)
async def ensure_default_lesson(
    class_id: int,
    title: str = "Bài 1",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo một bài mặc định nếu lớp chưa có bài nào."""
    _ensure_can_manage_class(db, current_user, class_id)
    existing = db.query(Lesson).filter(Lesson.class_id == class_id).order_by(Lesson.order_index.asc()).first()
    if existing:
        return existing
    max_idx = db.query(func.max(Lesson.order_index)).filter(Lesson.class_id == class_id).scalar() or 0
    lesson = Lesson(class_id=class_id, title=title, order_index=(max_idx + 1))
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.post("/{class_id}/lessons/{lesson_id}/assign-ungrouped")
async def assign_ungrouped_to_lesson(
    class_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chuyển tất cả học liệu/bài tập chưa gán bài của lớp về bài chỉ định."""
    _ensure_can_manage_class(db, current_user, class_id)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.class_id == class_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")

    # Update materials
    db.query(Material).filter(Material.class_id == class_id, Material.lesson_id.is_(None)).update({Material.lesson_id: lesson_id})
    # Update exercises
    db.query(Exercise).filter(Exercise.class_id == class_id, Exercise.lesson_id.is_(None)).update({Exercise.lesson_id: lesson_id})
    db.commit()
    return {"message": "Đã gán các mục chưa phân loại vào bài", "lesson_id": lesson_id}


@router.get("/{class_id}/lessons", response_model=list[LessonResponse])
async def list_class_lessons(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách bài học theo lớp (học sinh đã tham gia, giáo viên, hoặc admin)"""
    _ensure_can_view_class(db, current_user, class_id)
    return (
        db.query(Lesson)
        .filter(Lesson.class_id == class_id)
        .order_by(Lesson.order_index.asc().nulls_last(), Lesson.id.asc())
        .all()
    )


@router.post("/{class_id}/lessons", response_model=LessonResponse, status_code=201)
async def create_class_lesson(
    class_id: int,
    payload: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo bài học mới trong lớp (giáo viên lớp hoặc admin)"""
    _ensure_can_manage_class(db, current_user, class_id)
    # Determine next order_index
    max_idx = db.query(func.max(Lesson.order_index)).filter(Lesson.class_id == class_id).scalar() or 0
    lesson = Lesson(
        class_id=class_id,
        title=payload.title,
        content=payload.content,
        order_index=(max_idx + 1),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.put("/{class_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def update_class_lesson(
    class_id: int,
    lesson_id: int,
    payload: LessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật tiêu đề/nội dung/thứ tự bài học (giáo viên lớp hoặc admin)"""
    _ensure_can_manage_class(db, current_user, class_id)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.class_id == class_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    if payload.title is not None:
        lesson.title = payload.title
    if payload.content is not None:
        lesson.content = payload.content
    if payload.order_index is not None:
        lesson.order_index = payload.order_index
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{class_id}/lessons/{lesson_id}")
async def delete_class_lesson(
    class_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xóa bài học (giáo viên lớp hoặc admin)"""
    _ensure_can_manage_class(db, current_user, class_id)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.class_id == class_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    db.delete(lesson)
    db.commit()
    return {"message": "Đã xóa bài học"}


# ==================== Import Students from CSV ====================

@router.get("/students/import-template")
async def download_students_import_template():
    """
    Download CSV template file for importing students
    """
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow(['email', 'name', 'phone'])

    # Write sample data
    writer.writerow(['student1@example.com', 'Nguyễn Văn A', '0123456789'])
    writer.writerow(['student2@example.com', 'Trần Thị B', '0987654321'])
    writer.writerow(['student3@example.com', 'Lê Văn C', '0369852147'])

    # Create response
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),  # UTF-8 BOM for Excel compatibility
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=students_import_template.csv"
        }
    )


@router.post("/{class_id}/students/import")
async def import_students_from_csv(
    class_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Import students to class from CSV file

    CSV Format:
    email,name,phone
    student1@example.com,Nguyễn Văn A,0123456789
    student2@example.com,Trần Thị B,0987654321

    Returns:
    - imported: Number of students successfully added
    - failed: Number of students that failed
    - errors: List of error messages
    - students: List of successfully added student info
    """
    # Ensure user can manage this class
    _ensure_can_manage_class(db, current_user, class_id)

    # Check class exists
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")

    # Check file type
    if not file.filename.lower().endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file CSV (.csv)")

    # Read and parse CSV
    try:
        contents = await file.read()
        # Try UTF-8 first, then UTF-8-BOM, then latin1
        try:
            decoded = contents.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                decoded = contents.decode('utf-8')
            except UnicodeDecodeError:
                decoded = contents.decode('latin1')

        csv_reader = csv.DictReader(io.StringIO(decoded))

        # Validate headers
        if not csv_reader.fieldnames or 'email' not in csv_reader.fieldnames:
            raise HTTPException(
                status_code=400,
                detail="File CSV phải có cột 'email'. Định dạng: email,name,phone"
            )

        imported = 0
        failed = 0
        errors = []
        added_students = []

        for row_num, row in enumerate(csv_reader, start=2):  # Start from 2 (header is row 1)
            try:
                email = row.get('email', '').strip()
                name = row.get('name', '').strip()
                phone = row.get('phone', '').strip()

                if not email:
                    errors.append(f"Dòng {row_num}: Email không được để trống")
                    failed += 1
                    continue

                # Validate email format
                if '@' not in email or '.' not in email:
                    errors.append(f"Dòng {row_num}: Email không hợp lệ: {email}")
                    failed += 1
                    continue

                # Find or create user
                user = db.query(User).filter(User.email == email).first()

                if not user:
                    # Create new student account
                    user = User(
                        email=email,
                        username=email.split('@')[0],  # Use email prefix as username
                        full_name=name or email.split('@')[0],
                        role=UserRole.USER,  # USER = student role
                        phone=phone if phone else None
                    )
                    # Set default password (should be changed on first login)
                    user.set_password("student123")  # Default password
                    db.add(user)
                    db.flush()  # Get user.id
                else:
                    # Update user info if provided
                    if name:
                        user.full_name = name
                    if phone:
                        user.phone = phone

                # Check if already enrolled
                existing = db.query(Enrollment).filter(
                    Enrollment.class_id == class_id,
                    Enrollment.user_id == user.id
                ).first()

                if existing:
                    if existing.status == 'active':
                        errors.append(f"Dòng {row_num}: Học sinh {email} đã có trong lớp")
                        failed += 1
                        continue
                    # Reactivate enrollment
                    existing.status = 'active'
                    existing.role = 'student'
                else:
                    # Create new enrollment
                    enrollment = Enrollment(
                        class_id=class_id,
                        student_id=user.id,
                        status='active',
                        role='student'
                    )
                    db.add(enrollment)

                imported += 1
                added_students.append({
                    "id": user.id,
                    "email": user.email,
                    "name": user.full_name,
                    "phone": user.phone
                })

            except Exception as e:
                errors.append(f"Dòng {row_num}: Lỗi - {str(e)}")
                failed += 1
                continue

        # Commit all changes
        db.commit()

        return {
            "imported": imported,
            "failed": failed,
            "total": imported + failed,
            "errors": errors[:20],  # Limit to first 20 errors
            "students": added_students,
            "message": f"Đã import {imported}/{imported + failed} học sinh thành công"
        }

    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file CSV: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi import: {str(e)}")


# -------- New Excel Import Features --------
@router.post("/{class_id}/students/add-by-email", response_model=AddStudentsToClassResponse)
async def add_students_to_class_by_email(
    class_id: int,
    request: AddStudentsToClassRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thêm học sinh vào lớp bằng danh sách email

    Chỉ teacher của lớp hoặc admin mới có thể thực hiện
    """
    return ClassStudentService.add_students_to_class(db, class_id, request, current_user)


@router.get("/{class_id}/students/available-emails")
async def get_available_student_emails(
    class_id: int,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách email của các học sinh chưa tham gia lớp

    Dùng để hiển thị suggestions khi teacher thêm học sinh
    """
    # Kiểm tra quyền
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if (current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and
        classroom.teacher_id != current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Chỉ giáo viên của lớp hoặc admin mới có thể xem danh sách này"
        )

    # Lấy danh sách học sinh chưa tham gia lớp
    enrolled_user_ids = db.query(Enrollment.user_id).filter(
        Enrollment.class_id == class_id,
        Enrollment.status == "active"
    ).subquery()

    query = db.query(User).filter(
        User.role == UserRole.USER,
        User.is_active,
        ~User.id.in_(enrolled_user_ids)
    )

    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )

    students = query.offset(skip).limit(limit).all()

    return {
        "available_students": [
            {
                "id": student.id,
                "email": student.email,
                "username": student.username,
                "full_name": student.full_name
            }
            for student in students
        ],
        "total": query.count()
    }


@router.post("/{class_id}/students/import-excel")
async def import_excel_to_class(
    class_id: int,
    file: UploadFile = File(...),
    default_password: str = Form("123456"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Teacher import học sinh từ Excel trực tiếp vào lớp

    - Tự động tạo tài khoản nếu học sinh chưa tồn tại
    - Thêm vào lớp ngay lập tức
    - Chỉ teacher của lớp hoặc admin mới có thể thực hiện

    File Excel phải có các cột:
    - STT: Số thứ tự
    - Mã học sinh: Mã học sinh (username)
    - Họ và tên: Họ và tên học sinh
    - Ngày sinh: Ngày sinh (tùy chọn)
    """
    try:
        logger.info(f"🔍 DEBUG: Received file: {file.filename}")
        logger.info(f"🔍 DEBUG: Default password: {default_password}")
        logger.info(f"🔍 DEBUG: Class ID: {class_id}")
        logger.info(f"🔍 DEBUG: User: {current_user.username}")

        # Validate file type - accept .xls, .xlsx, .csv
        if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            raise HTTPException(
                status_code=400,
                detail=f"File phải có định dạng Excel (.xlsx, .xls) hoặc CSV (.csv). File nhận được: {file.filename}"
            )

        logger.info(f"✅ File type OK: {file.filename}")

        # Parse Excel file
        logger.info("📄 Parsing Excel file...")
        students = ExcelImportService.parse_excel_file(file)
        logger.info(f"✅ Parsed {len(students)} students")

        # Import students to class
        logger.info(f"➕ Importing students to class {class_id}...")
        result = ExcelImportService.import_students_to_class(
            db=db,
            class_id=class_id,
            students=students,
            current_user=current_user,
            default_password=default_password
        )
        logger.info(f"✅ Import complete: {result.success_count} success, {result.failed_count} failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"❌ ERROR in import_excel_to_class: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi import Excel: {str(e)}"
        )

    return {
        "success_count": result.success_count,
        "failed_count": result.failed_count,
        "created_accounts": result.created_accounts,
        "added_to_class": result.added_to_class,
        "already_in_class": result.already_in_class,
        "failed_students": result.failed_students,
        "summary": {
            "total_processed": len(students),
            "new_accounts_created": len(result.created_accounts),
            "successfully_added": len(result.added_to_class),
            "already_enrolled": len(result.already_in_class),
            "failures": len(result.failed_students)
        }
    }


@router.post("/{class_id}/students/import-excel/preview")
async def preview_excel_import_to_class(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview file Excel trước khi import vào lớp
    """
    # Kiểm tra quyền truy cập lớp
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if (current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and
        classroom.teacher_id != current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Chỉ giáo viên của lớp hoặc admin mới có thể preview"
        )

    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="File phải có định dạng Excel (.xlsx hoặc .xls)"
        )

    # Parse Excel file
    students = ExcelImportService.parse_excel_file(file)

    # Phân tích trạng thái của từng học sinh
    analysis = {
        "total_students": len(students),
        "existing_accounts": [],
        "new_accounts": [],
        "already_in_class": [],
        "preview": students[:10]  # 10 dòng đầu
    }

    for student in students:
        # Kiểm tra tài khoản đã tồn tại
        email = f"{student.ma_hoc_sinh}@gmail.com"
        existing_user = db.query(User).filter(
            (User.username == student.ma_hoc_sinh) |
            (User.email == email)
        ).first()

        if existing_user:
            # Kiểm tra đã tham gia lớp chưa
            enrollment = db.query(Enrollment).filter(
                Enrollment.class_id == class_id,
                Enrollment.user_id == existing_user.id,
                Enrollment.status == "active"
            ).first()

            if enrollment:
                analysis["already_in_class"].append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "email": existing_user.email
                })
            else:
                analysis["existing_accounts"].append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "email": existing_user.email
                })
        else:
            analysis["new_accounts"].append({
                "ma_hoc_sinh": student.ma_hoc_sinh,
                "ho_va_ten": student.ho_va_ten,
                "email": email
            })

    return analysis


