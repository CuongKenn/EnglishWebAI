from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.role_utils import get_display_role
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.schemas.google_auth import GoogleAuthRequest, GoogleAuthResponse
from app.services.auth_service import AuthService
from app.services.google_auth_service import GoogleAuthService

router = APIRouter()

@router.post("/login/", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login user with username and password"""
    try:
        result = AuthService.login(db, login_data)
        user = result["user"]

        # Get display role (user -> student)
        display_role = get_display_role(user.role)

        return {
            "role": display_role,  # Return 'student' instead of 'user' for frontend
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": display_role,  # Display role
                "phone": user.phone,
                "avatar_url": user.avatar_url  # Include avatar_url
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) from e

@router.post("/register/", status_code=status.HTTP_201_CREATED)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Validate passwords match
    if register_data.password != register_data.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    try:
        result = AuthService.register(db, register_data)
        return {
            "message": "User registered successfully",
            "user": {
                "id": result["user"].id,
                "username": result["user"].username,
                "email": result["user"].email,
                "phone": result["user"].phone
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) from e

@router.post("/logout/")
async def logout():
    """Logout user (client should discard token)"""
    return {"message": "Logout successful"}

@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate or register user with Google OAuth

    - Verifies Google ID token
    - Creates new account if user doesn't exist
    - Returns JWT access token
    """
    try:
        result = GoogleAuthService.authenticate_with_google(db, auth_data.id_token)
        user = result["user"]

        # Get display role
        display_role = get_display_role(user.role)

        return GoogleAuthResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            is_new_user=result["is_new_user"],
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": display_role,
                "phone": user.phone,
                "avatar_url": user.avatar_url
            }
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        ) from e
