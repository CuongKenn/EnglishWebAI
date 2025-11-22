
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user, get_current_user
from app.models.user import User
from app.schemas.admin import (
    AdminClassCreate,
    AdminClassOut,
    AdminClassUpdate,
    AdminOverviewStats,
    AdminTeacherOut,
    AdminUserCreate,
    AdminUserOut,
    AdminUserUpdate,
)
from app.schemas.excel_import import StudentsImportRequest, StudentsImportResponse
from app.schemas.system_config import (
    SystemConfigBulkUpdate,
    SystemConfigCreate,
    SystemConfigOut,
    SystemConfigUpdate,
    SystemSettingsOut,
    SystemSettingsUpdate,
)
from app.services.admin_service import AdminService
from app.services.excel_import_service import ExcelImportService
from app.services.system_config_service import SystemConfigService

router = APIRouter()


# -------- Users --------
@router.get("/users", response_model=list[AdminUserOut])
def admin_list_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    status: str | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.list_users(db, search=search, role=role, status=status, skip=skip, limit=limit)


@router.post("/users", response_model=AdminUserOut)
def admin_create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.create_user(db, payload)


@router.put("/users/{user_id}", response_model=AdminUserOut)
def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    try:
        return AdminService.update_user(db, user_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    AdminService.delete_user(db, user_id)
    return {"message": "User deleted"}


@router.post("/users/import-csv")
def admin_import_users_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    try:
        return AdminService.import_users_csv(db, file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}") from e


@router.get("/teachers", response_model=list[AdminTeacherOut])
def admin_list_teachers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.list_teachers(db)


# -------- Classes --------
@router.get("/classes", response_model=list[AdminClassOut])
def admin_list_classes(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.list_classes(db, search=search)


@router.post("/classes", response_model=AdminClassOut)
def admin_create_class(
    payload: AdminClassCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    try:
        return AdminService.create_class(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        # Surface server error details to the client for debugging
        raise HTTPException(status_code=500, detail=f"Create class failed: {str(e)}") from e


@router.put("/classes/{class_id}", response_model=AdminClassOut)
def admin_update_class(
    class_id: int,
    payload: AdminClassUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    try:
        return AdminService.update_class(db, class_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/classes/{class_id}")
def admin_delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    AdminService.delete_class(db, class_id)
    return {"message": "Class deleted"}


# -------- Overview Stats --------
@router.get("/stats/overview", response_model=AdminOverviewStats)
def admin_overview_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.overview_stats(db)


# -------- System Configuration --------
@router.get("/system-config", response_model=list[SystemConfigOut])
def get_all_system_configs(
    public_only: bool = Query(False),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Get all system configurations"""
    return SystemConfigService.get_all_configs(db, public_only=public_only)


@router.get("/system-config/{key}", response_model=SystemConfigOut)
def get_system_config_by_key(
    key: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Get a specific configuration by key"""
    config = SystemConfigService.get_config_by_key(db, key)
    if not config:
        raise HTTPException(status_code=404, detail=f"Configuration '{key}' not found")
    return config


@router.post("/system-config", response_model=SystemConfigOut)
def create_system_config(
    config_data: SystemConfigCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Create a new system configuration"""
    existing = SystemConfigService.get_config_by_key(db, config_data.key)
    if existing:
        raise HTTPException(status_code=400, detail=f"Configuration '{config_data.key}' already exists")
    return SystemConfigService.create_config(db, config_data)


@router.put("/system-config/{key}", response_model=SystemConfigOut)
def update_system_config(
    key: str,
    config_data: SystemConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Update an existing configuration"""
    config = SystemConfigService.update_config(db, key, config_data)
    if not config:
        raise HTTPException(status_code=404, detail=f"Configuration '{key}' not found")
    return config


@router.delete("/system-config/{key}")
def delete_system_config(
    key: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Delete a configuration"""
    success = SystemConfigService.delete_config(db, key)
    if not success:
        raise HTTPException(status_code=404, detail=f"Configuration '{key}' not found")
    return {"message": f"Configuration '{key}' deleted successfully"}


@router.post("/system-config/bulk-update", response_model=list[SystemConfigOut])
def bulk_update_system_configs(
    bulk_data: SystemConfigBulkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Bulk update configurations"""
    return SystemConfigService.bulk_update(db, bulk_data.configs)


# -------- System Settings (Grouped) --------
@router.get("/settings", response_model=SystemSettingsOut)
def get_system_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Get all system settings as a structured object"""
    return SystemConfigService.get_all_settings(db)


@router.put("/settings", response_model=SystemSettingsOut)
def update_system_settings(
    settings: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Update system settings"""
    return SystemConfigService.update_settings(db, settings)


@router.post("/settings/initialize")
def initialize_default_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Initialize default system settings"""
    SystemConfigService.initialize_default_configs(db)
    return {"message": "Default settings initialized successfully"}


# -------- Excel Import --------
@router.post("/import/students/excel", response_model=StudentsImportResponse)
async def import_students_from_excel(
    file: UploadFile = File(...),
    default_password: str = "123456",
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Import học sinh từ file Excel

    File Excel phải có các cột:
    - STT: Số thứ tự
    - Mã học sinh: Mã học sinh (sẽ dùng làm username)
    - Họ và tên: Họ và tên học sinh
    - Ngày sinh: Ngày sinh (tùy chọn)

    Email sẽ được tạo tự động: {mã học sinh}@gmail.com
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="File phải có định dạng Excel (.xlsx hoặc .xls)"
        )

    # Parse Excel file
    students = ExcelImportService.parse_excel_file(file)

    # Create import request
    import_request = StudentsImportRequest(
        students=students,
        default_password=default_password
    )

    # Import students
    return ExcelImportService.import_students(db, import_request)


@router.post("/import/students/preview")
async def preview_excel_import(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin_user),
):
    """
    Preview file Excel trước khi import để kiểm tra dữ liệu
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="File phải có định dạng Excel (.xlsx hoặc .xls)"
        )

    # Parse Excel file
    students = ExcelImportService.parse_excel_file(file)

    return {
        "total_students": len(students),
        "preview": students[:10],  # Chỉ hiển thị 10 dòng đầu
        "sample_emails": [f"{s.ma_hoc_sinh}@gmail.com" for s in students[:5]],
        "all_students": [{"ma_hoc_sinh": s.ma_hoc_sinh, "ho_va_ten": s.ho_va_ten} for s in students]  # Debug: show all
    }


# -------- Teacher Dashboard --------
@router.get("/teachers/classes", response_model=list[AdminClassOut])
def get_teacher_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy danh sách lớp học mà teacher này dạy (hoặc tất cả nếu là admin)
    """
    from app.models.classroom import Classroom

    # Kiểm tra user phải là teacher hoặc admin
    if current_user.role not in ["TEACHER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Nếu là admin thì lấy tất cả classes
    if current_user.role == "ADMIN":
        classes = db.query(Classroom).all()
    else:
        # Nếu là teacher thì chỉ lấy classes mình dạy
        classes = db.query(Classroom).filter(Classroom.teacher_id == current_user.id).all()

    return [
        AdminClassOut(
            id=cls.id,
            name=cls.name,
            subject=cls.subject,
            grade=cls.grade,
            teacher_id=cls.teacher_id,
            teacher_name=cls.teacher.full_name if cls.teacher else None,
            student_count=len([e for e in cls.enrollments if e.status == "active"]),
            created_at=cls.created_at
        )
        for cls in classes
    ]


@router.post("/debug/excel")
async def debug_excel_content(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin_user),
):
    """
    Debug endpoint để xem raw content của Excel file
    """
    try:
        import io

        import pandas as pd

        contents = file.file.read()

        # Đọc raw Excel
        df_raw = pd.read_excel(io.BytesIO(contents), header=None)

        return {
            "filename": file.filename,
            "file_size": len(contents),
            "shape": df_raw.shape,
            "columns": list(df_raw.columns),
            "first_10_rows": df_raw.head(10).to_dict(orient='records'),
            "all_values": df_raw.values.tolist()[:20]  # First 20 rows as list
        }
    except Exception as e:
        return {
            "error": str(e),
            "filename": file.filename,
            "file_size": len(contents) if 'contents' in locals() else 0
        }
