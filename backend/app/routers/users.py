from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.user import User, UserUpdate, PasswordChange
from app.services.user_service import UserService
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
