import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

logger = logging.getLogger(__name__)
import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User as UserModel
from app.schemas.auth import ResetPasswordRequest
from app.schemas.user import LinkParentRequest, ParentStudentLink, PasswordChange, User, UserUpdate
from app.services.parent_service import ParentService
from app.services.user_service import UserService

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user(
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get current user profilee"""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    return UserService.update_user(db, current_user.id, user_update)

@router.post("/me/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload avatar image for current user"""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"}
    if not file.content_type or file.content_type.lower() not in allowed_types:
        raise HTTPException(status_code=400, detail="Định dạng ảnh không hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP")

    # Read and validate file size
    content = await file.read()
    max_bytes = 5 * 1024 * 1024  # 5MB
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="Kích thước ảnh vượt quá 5MB")

    # Create avatars directory
    media_dir = Path("media") / "avatars"
    media_dir.mkdir(parents=True, exist_ok=True)

    # Delete old avatar file if exists
    if current_user.avatar_url:
        try:
            # Extract filename from URL path (e.g., "/media/avatars/filename.jpg" -> "filename.jpg")
            old_filename = current_user.avatar_url.split("/")[-1]
            old_file_path = media_dir / old_filename
            if old_file_path.exists() and old_file_path.is_file():
                os.remove(old_file_path)
                logger.info(f"Deleted old avatar: {old_file_path}")
        except Exception as e:
            # Log but don't fail if old file deletion fails
            logger.info(f"Warning: Could not delete old avatar: {e}")

    # Generate unique filename
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        # Derive from content-type
        ct_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        }
        ext = ct_map.get((file.content_type or "").lower(), ".jpg")

    filename = f"user_{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = media_dir / filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể lưu file: {str(e)}") from e

    # Update user avatar_url in database
    # Store relative path in database for portability
    avatar_url = f"/media/avatars/{filename}"
    user_update = UserUpdate(avatar_url=avatar_url)
    updated_user = UserService.update_user(db, current_user.id, user_update)

    # For response, include both relative and potentially full URL
    # Frontend can use relative path which works with backend's /media mount
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url,
        "user": updated_user
    }

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

@router.get("/", response_model=list[User])
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
    return ParentService.link_parent(db, current_user.id, link_data.parent_email)

@router.delete("/me/unlink-parent/{parent_id}")
async def unlink_parent(
    parent_id: int,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unlink a parent from current student"""
    ParentService.unlink_parent(db, current_user.id, parent_id)
    return {"message": "Parent unlinked successfully"}

@router.get("/me/parents", response_model=list[ParentStudentLink])
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

