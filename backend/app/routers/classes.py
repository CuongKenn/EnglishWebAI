from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.attendance import AttendanceRecord
from app.schemas.student import (
    ClassroomListResponse,
    ClassroomResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    AddStudentsRequest,
    ClassStudentOut,
    AttendanceUpsertRequest,
    AttendanceRecordOut
)
from app.schemas.student import MaterialResponse, ExerciseResponse
from app.schemas.student import LessonResponse, LessonCreate, LessonUpdate
from app.models.material import Material
from app.models.exercise import Exercise
from app.models.lesson import Lesson

router = APIRouter()

@router.get("/", response_model=List[ClassroomListResponse])
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
    query = query.filter(Classroom.is_active == True)
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

@router.get("/teaching", response_model=List[ClassroomListResponse])
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
        out: List[ClassroomListResponse] = []
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
        print("[ERROR] /classes/teaching:", repr(e))
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
    classroom: Optional[Classroom] = db.query(Classroom).filter(Classroom.id == class_id).first()
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
    classroom: Optional[Classroom] = db.query(Classroom).filter(Classroom.id == class_id).first()
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


@router.get("/{class_id}/students", response_model=List[ClassStudentOut])
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
    out: List[ClassStudentOut] = []
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


@router.post("/{class_id}/students", response_model=List[ClassStudentOut])
async def add_students_to_class(
    class_id: int,
    req: AddStudentsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Thêm học sinh vào lớp (teacher của lớp hoặc admin)"""
    classroom = _ensure_can_manage_class(db, current_user, class_id)

    created: List[ClassStudentOut] = []
    for identifier in req.identifiers:
        identifier = identifier.strip()
        if not identifier:
            continue
        # Find user by id/username/email
        user: Optional[User] = None
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

@router.get("/{class_id}/attendance", response_model=List[AttendanceRecordOut])
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
    out: List[AttendanceRecordOut] = []
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

@router.get("/{class_id}/materials", response_model=List[MaterialResponse])
async def list_class_materials(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách học liệu của lớp (học sinh đã tham gia, giáo viên lớp, hoặc admin)"""
    _ensure_can_view_class(db, current_user, class_id)
    rows = db.query(Material).filter(Material.class_id == class_id).all()
    return rows


@router.get("/{class_id}/exercises", response_model=List[ExerciseResponse])
async def list_class_exercises(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách bài tập của lớp (học sinh đã tham gia, giáo viên lớp, hoặc admin)"""
    _ensure_can_view_class(db, current_user, class_id)
    rows = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    return rows


@router.get("/{class_id}/lessons", response_model=List[LessonResponse])
async def list_class_lessons(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách bài học theo lớp (học sinh đã tham gia, giáo viên, hoặc admin)"""
    _ensure_can_view_class(db, current_user, class_id)
    rows = (
        db.query(Lesson)
        .filter(Lesson.class_id == class_id)
        .order_by(Lesson.order_index.asc().nulls_last(), Lesson.id.asc())
        .all()
    )
    return rows


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
