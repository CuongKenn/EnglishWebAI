from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import User
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    result = AuthService.register(db, register_data)
    return {
        "message": "User registered successfully",
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"]
    }

@router.post("/login", response_model=dict)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login user"""
    result = AuthService.login(db, login_data)
    return {
        "message": "Login successful",
        "access_token": result["access_token"],
        "token_type": result["token_type"],
        "user": result["user"]
    }

@router.post("/logout")
async def logout():
    """Logout user (client should discard token)"""
    return {"message": "Logout successful"}
