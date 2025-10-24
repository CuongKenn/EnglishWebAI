from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.user import User, UserUpdate, PasswordChange, LinkParentRequest, ParentStudentLink
from app.schemas.auth import ResetPasswordRequest
from app.services.user_service import UserService
from app.services.parent_service import ParentService
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user(
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    return UserService.update_user(db, current_user.id, user_update)

@router.post("/me/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change current user password"""
    UserService.change_password(
        db,
        current_user.id,
        password_data.old_password,
        password_data.new_password
    )
    return {"message": "Password changed successfully"}

@router.post("/reset-password")
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password (for forgot password flow - OTP must be verified first)"""
    UserService.reset_password(db, reset_data.email, reset_data.new_password)
    return {"message": "Password reset successfully"}

@router.get("/", response_model=List[User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get list of users (admin only in production)"""
    return UserService.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get user by ID"""
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Delete user (admin only in production)"""
    UserService.delete_user(db, user_id)
    return {"message": "User deleted successfully"}

@router.post("/me/link-parent", response_model=ParentStudentLink)
async def link_parent(
    link_data: LinkParentRequest,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Link a parent account to current student"""
    link = ParentService.link_parent(db, current_user.id, link_data.parent_email)
    return link

@router.delete("/me/unlink-parent/{parent_id}")
async def unlink_parent(
    parent_id: int,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unlink a parent from current student"""
    ParentService.unlink_parent(db, current_user.id, parent_id)
    return {"message": "Parent unlinked successfully"}

@router.get("/me/parents", response_model=List[ParentStudentLink])
async def get_my_parents(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all parents linked to current student"""
    return ParentService.get_student_parents(db, current_user.id)

@router.post("/me/verify-parent/{parent_id}")
async def verify_parent_link(
    parent_id: int,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify/confirm parent link (student accepts the connection)"""
    ParentService.verify_parent_link(db, current_user.id, parent_id)
    return {"message": "Parent link verified successfully"}
