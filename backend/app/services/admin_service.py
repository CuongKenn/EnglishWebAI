from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime

from app.models.user import User, UserRole
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.admin import (
    AdminUserCreate, AdminUserUpdate,
    AdminClassCreate, AdminClassUpdate
)
from app.core.security import get_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from fastapi import UploadFile
import csv
import io


def _vn_date(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    return dt.strftime("%d/%m/%Y")


class AdminService:
    # -------- Users --------
    @staticmethod
    def list_users(db: Session, search: Optional[str] = None,
                   role: Optional[str] = None, status: Optional[str] = None,
                   skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        q = db.query(User)
        if search:
            like = f"%{search}%"
            q = q.filter((User.full_name.ilike(like)) | (User.email.ilike(like)) | (User.username.ilike(like)))
        if role:
            try:
                q = q.filter(User.role == UserRole(role))
            except Exception:
                pass
        if status:
            if status == "active":
                q = q.filter(User.is_active.is_(True))
            elif status == "inactive":
                q = q.filter(User.is_active.is_(False))
        users = q.offset(skip).limit(limit).all()

        # Precompute teacher classes mapping and student counts
        teacher_ids = [u.id for u in users if u.role == UserRole.TEACHER]
        teacher_class_counts: Dict[int, int] = {}
        teacher_student_counts: Dict[int, int] = {}
        if teacher_ids:
            # classes per teacher
            rows = (
                db.query(Classroom.teacher_id, func.count(Classroom.id))
                .filter(Classroom.teacher_id.in_(teacher_ids))
                .group_by(Classroom.teacher_id)
                .all()
            )
            teacher_class_counts = {tid: cnt for tid, cnt in rows}

            # unique students across teacher's classes
            rows2 = (
                db.query(Classroom.teacher_id, func.count(distinct(Enrollment.user_id)))
                .join(Enrollment, Enrollment.class_id == Classroom.id)
                .filter(Classroom.teacher_id.in_(teacher_ids))
                .filter(Enrollment.role == "student")
                .filter(Enrollment.status == "active")
                .group_by(Classroom.teacher_id)
                .all()
            )
            teacher_student_counts = {tid: cnt for tid, cnt in rows2}

        # student class counts
        student_ids = [u.id for u in users if u.role == UserRole.USER]
        student_class_counts: Dict[int, int] = {}
        if student_ids:
            rows3 = (
                db.query(Enrollment.user_id, func.count(Enrollment.id))
                .filter(Enrollment.user_id.in_(student_ids))
                .filter(Enrollment.role == "student")
                .filter(Enrollment.status == "active")
                .group_by(Enrollment.user_id)
                .all()
            )
            student_class_counts = {uid: cnt for uid, cnt in rows3}

        out = []
        for u in users:
            if u.role == UserRole.TEACHER:
                classes = teacher_class_counts.get(u.id, 0)
                students = teacher_student_counts.get(u.id, 0)
            elif u.role == UserRole.USER:
                classes = student_class_counts.get(u.id, 0)
                students = 0
            else:
                classes = 0
                students = 0
            out.append({
                "id": u.id,
                "name": u.full_name or u.username,
                "email": u.email,
                "role": u.role.value,
                "status": "active" if u.is_active else "inactive",
                "classes": classes,
                "students": students,
                "joinDate": _vn_date(u.created_at),
            })
        return out

    @staticmethod
    def create_user(db: Session, payload: AdminUserCreate) -> Dict[str, Any]:
        # Username from payload if provided, otherwise email local-part
        username = (payload.username or payload.email.split("@")[0]).strip()
        # Create user
        user = User(
            email=payload.email,
            username=username,
            full_name=payload.name,
            hashed_password=get_password_hash(payload.password),
            role=UserRole(payload.role),
            is_active=(payload.status == "active"),
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "id": user.id,
            "name": user.full_name or user.username,
            "email": user.email,
            "role": user.role.value,
            "status": "active" if user.is_active else "inactive",
            "classes": 0,
            "students": 0,
            "joinDate": _vn_date(user.created_at),
        }

    @staticmethod
    def update_user(db: Session, user_id: int, payload: AdminUserUpdate) -> Dict[str, Any]:
        user = db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        if payload.name is not None:
            user.full_name = payload.name
        if payload.email is not None:
            user.email = payload.email
        if payload.role is not None:
            user.role = UserRole(payload.role)
        if payload.status is not None:
            user.is_active = (payload.status == "active")
        if payload.password:
            user.hashed_password = get_password_hash(payload.password)
        db.commit()
        db.refresh(user)
        return {
            "id": user.id,
            "name": user.full_name or user.username,
            "email": user.email,
            "role": user.role.value,
            "status": "active" if user.is_active else "inactive",
            "classes": 0,
            "students": 0,
            "joinDate": _vn_date(user.created_at),
        }

    @staticmethod
    def delete_user(db: Session, user_id: int) -> None:
        user = db.get(User, user_id)
        if not user:
            return
        db.delete(user)
        db.commit()

    @staticmethod
    def list_teachers(db: Session) -> List[Dict[str, Any]]:
        teachers = db.query(User).filter(User.role == UserRole.TEACHER, User.is_active.is_(True)).all()
        return [{"id": t.id, "name": t.full_name or t.username} for t in teachers]

    # -------- Classes --------
    @staticmethod
    def list_classes(db: Session, search: Optional[str] = None) -> List[Dict[str, Any]]:
        q = db.query(Classroom)
        if search:
            like = f"%{search}%"
            q = q.filter((Classroom.name.ilike(like)) | (Classroom.code.ilike(like)))
        classes = q.order_by(Classroom.created_at.desc()).all()

        # Students count per class
        counts = dict(
            db.query(Enrollment.class_id, func.count(Enrollment.id))
            .filter(Enrollment.role == "student")
            .filter(Enrollment.status == "active")
            .group_by(Enrollment.class_id)
            .all()
        )

        # Teacher names map
        teacher_ids = [c.teacher_id for c in classes if c.teacher_id]
        names_map: Dict[int, str] = {}
        if teacher_ids:
            rows = db.query(User.id, User.full_name, User.username).filter(User.id.in_(teacher_ids)).all()
            for i, full_name, username in rows:
                names_map[i] = full_name or username

        out = []
        for c in classes:
            out.append({
                "id": c.id,
                "name": c.name,
                "code": c.code,
                "teacher": names_map.get(c.teacher_id) if c.teacher_id else None,
                "teacherId": c.teacher_id,
                "students": counts.get(c.id, 0),
                "maxStudents": c.max_students,
                "schedule": c.schedule,
                "status": c.status,
                "description": c.description,
            })
        return out

    @staticmethod
    def create_class(db: Session, payload: AdminClassCreate) -> Dict[str, Any]:
        # Validate unique code
        exists = db.query(Classroom).filter(Classroom.code == payload.code).first()
        if exists:
            raise ValueError("Class code already exists")

        # Validate teacher if provided
        teacher_id = payload.teacherId
        if teacher_id is not None:
            t = db.get(User, teacher_id)
            if not t:
                raise ValueError("Teacher not found")
            # allow only teacher role assignment
            if t.role != UserRole.TEACHER:
                raise ValueError("Assigned user is not a teacher")

        c = Classroom(
            name=payload.name,
            code=payload.code,
            teacher_id=teacher_id,
            max_students=payload.maxStudents,
            schedule=payload.schedule,
            status=payload.status,
            description=payload.description,
            is_active=(payload.status == "active"),
        )
        db.add(c)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            # Likely duplicate code or FK constraint
            raise ValueError("Database integrity error while creating class")
        except SQLAlchemyError as e:
            db.rollback()
            raise ValueError("Database error while creating class")
        db.refresh(c)
        return AdminService.get_class(db, c.id)

    @staticmethod
    def get_class(db: Session, class_id: int) -> Dict[str, Any]:
        c = db.get(Classroom, class_id)
        if not c:
            raise ValueError("Class not found")
        students_count = (
            db.query(func.count(Enrollment.id))
            .filter(Enrollment.class_id == c.id, Enrollment.role == "student", Enrollment.status == "active")
            .scalar()
        ) or 0
        teacher_name = None
        if c.teacher_id:
            t = db.get(User, c.teacher_id)
            teacher_name = (t.full_name or t.username) if t else None
        return {
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "teacher": teacher_name,
            "teacherId": c.teacher_id,
            "students": students_count,
            "maxStudents": c.max_students,
            "schedule": c.schedule,
            "status": c.status,
            "description": c.description,
        }

    @staticmethod
    def update_class(db: Session, class_id: int, payload: AdminClassUpdate) -> Dict[str, Any]:
        c = db.query(Classroom).get(class_id)
        if not c:
            raise ValueError("Class not found")
        if payload.name is not None:
            c.name = payload.name
        if payload.code is not None:
            c.code = payload.code
        if payload.teacherId is not None:
            c.teacher_id = payload.teacherId
        if payload.maxStudents is not None:
            c.max_students = payload.maxStudents
        if payload.schedule is not None:
            c.schedule = payload.schedule
        if payload.status is not None:
            c.status = payload.status
            c.is_active = (payload.status == "active")
        if payload.description is not None:
            c.description = payload.description
        db.commit()
        db.refresh(c)
        return AdminService.get_class(db, c.id)

    @staticmethod
    def delete_class(db: Session, class_id: int) -> None:
        c = db.query(Classroom).get(class_id)
        if not c:
            return
        db.delete(c)
        db.commit()

    # -------- Stats --------
    @staticmethod
    def overview_stats(db: Session) -> Dict[str, Any]:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_teachers = db.query(func.count(User.id)).filter(User.role == UserRole.TEACHER).scalar() or 0
        total_students = db.query(func.count(User.id)).filter(User.role == UserRole.USER).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
        total_classes = db.query(func.count(Classroom.id)).scalar() or 0
        active_classes = db.query(func.count(Classroom.id)).filter(Classroom.status == "active").scalar() or 0
        # average students per class
        class_student_counts = dict(
            db.query(Enrollment.class_id, func.count(Enrollment.id))
            .filter(Enrollment.role == "student", Enrollment.status == "active")
            .group_by(Enrollment.class_id)
            .all()
        )
        avg_students = 0.0
        if class_student_counts:
            avg_students = sum(class_student_counts.values()) / max(len(class_student_counts), 1)
        return {
            "totalUsers": total_users,
            "totalTeachers": total_teachers,
            "totalStudents": total_students,
            "activeUsers": active_users,
            "totalClasses": total_classes,
            "activeClasses": active_classes,
            "averageStudents": round(avg_students, 2),
        }

    # -------- Bulk Import Users (CSV) --------
    @staticmethod
    def _normalize_role(raw: Optional[str]) -> str:
        if not raw:
            return "user"
        s = raw.strip().lower()
        mapping = {
            "user": "user", "student": "user", "hs": "user", "học sinh": "user", "hoc sinh": "user",
            "teacher": "teacher", "gv": "teacher", "giáo viên": "teacher", "giao vien": "teacher",
            "parent": "parent", "ph": "parent", "phụ huynh": "parent", "phu huynh": "parent",
            "admin": "admin", "quản trị": "admin", "quan tri": "admin",
            "superadmin": "superadmin", "super admin": "superadmin",
        }
        return mapping.get(s, "user")

    @staticmethod
    def _ensure_unique_username(db: Session, base: str) -> str:
        base = (base or "user").strip().lower()
        cand = base
        idx = 1
        while db.query(User).filter(User.username == cand).first() is not None:
            idx += 1
            cand = f"{base}{idx}"
        return cand

    @staticmethod
    def import_users_csv(db: Session, file: UploadFile) -> Dict[str, Any]:
        if not file.filename or not file.filename.lower().endswith((".csv", ".txt")):
            raise ValueError("Please upload a .csv or .txt file")

        content = file.file.read()
        try:
            text = content.decode("utf-8-sig")
        except Exception:
            text = content.decode("utf-8", errors="ignore")

        reader = csv.DictReader(io.StringIO(text))
        headers = [h.strip().lower() for h in (reader.fieldnames or [])]
        if not headers:
            raise ValueError("CSV has no headers")

        def pick(row: dict, *names: str) -> Optional[str]:
            for n in names:
                if n in row and row[n]:
                    return str(row[n]).strip()
            return None

        created = 0
        skipped = 0
        errors: List[Dict[str, Any]] = []
        preview: List[Dict[str, Any]] = []

        for idx, row in enumerate(reader, start=2):
            lower_row = {k.strip().lower(): (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
            try:
                name = pick(lower_row, "name", "full_name", "fullname", "ho ten", "ho_va_ten", "ten") or ""
                email = pick(lower_row, "email")
                username = pick(lower_row, "username", "tai_khoan", "ten_dang_nhap")
                role_raw = pick(lower_row, "role", "vai_tro", "phan_quyen")
                status_raw = pick(lower_row, "status", "trang_thai") or "active"
                password = pick(lower_row, "password", "mat_khau") or "Temp123!"

                if not email:
                    skipped += 1
                    errors.append({"row": idx, "message": "Missing email"})
                    continue

                role = AdminService._normalize_role(role_raw)
                status = "active" if str(status_raw).strip().lower() in ("active", "1", "true", "đang hoạt động") else "inactive"
                if not username:
                    username = (email.split("@")[0]).lower()
                username = AdminService._ensure_unique_username(db, username)

                if db.query(User).filter(User.email == email).first():
                    skipped += 1
                    errors.append({"row": idx, "message": "Email already exists"})
                    continue

                user = User(
                    email=email,
                    username=username,
                    full_name=name or username,
                    hashed_password=get_password_hash(password),
                    role=UserRole(role),
                    is_active=(status == "active"),
                    is_verified=False,
                )
                db.add(user)
                try:
                    db.commit()
                except IntegrityError:
                    db.rollback()
                    skipped += 1
                    errors.append({"row": idx, "message": "Integrity error (duplicate username/email)"})
                    continue
                db.refresh(user)
                created += 1
                if len(preview) < 20:
                    preview.append({
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "role": user.role.value,
                        "status": "active" if user.is_active else "inactive",
                    })
            except Exception as e:
                db.rollback()
                errors.append({"row": idx, "message": str(e)})
                skipped += 1

        return {"created": created, "skipped": skipped, "errors": errors, "preview": preview}
