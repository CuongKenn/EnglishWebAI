from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.schemas.admin import (
    AdminUserOut, AdminUserCreate, AdminUserUpdate,
    AdminClassOut, AdminClassCreate, AdminClassUpdate,
    AdminTeacherOut, AdminOverviewStats
)
from app.services.admin_service import AdminService


router = APIRouter()


# -------- Users --------
@router.get("/users", response_model=List[AdminUserOut])
def admin_list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
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
        raise HTTPException(status_code=404, detail=str(e))


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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/teachers", response_model=List[AdminTeacherOut])
def admin_list_teachers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    return AdminService.list_teachers(db)


# -------- Classes --------
@router.get("/classes", response_model=List[AdminClassOut])
def admin_list_classes(
    search: Optional[str] = Query(None),
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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Surface server error details to the client for debugging
        raise HTTPException(status_code=500, detail=f"Create class failed: {str(e)}")


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
        raise HTTPException(status_code=404, detail=str(e))


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

