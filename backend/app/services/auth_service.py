from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.core.security import create_access_token
from app.core.config import settings

class AuthService:
    @staticmethod
    def register(db: Session, register_data: RegisterRequest):
        """Register new user"""
        user_create = UserCreate(
            email=register_data.email,
            username=register_data.username,
            password=register_data.password,
            full_name=register_data.full_name
        )
        
        user = UserService.create_user(db, user_create)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    @staticmethod
    def login(db: Session, login_data: LoginRequest):
        """Login user"""
        user = UserService.authenticate_user(db, login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
