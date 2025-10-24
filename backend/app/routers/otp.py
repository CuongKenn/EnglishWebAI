from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.email_service import EmailService
from app.utils.otp import OTPService
from typing import Optional

router = APIRouter()


class SendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "verification"


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: Optional[str] = "verification"


class SendOTPToCurrentUserRequest(BaseModel):
    purpose: Optional[str] = "verification"


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_otp(
    request: SendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Send OTP to user email
    
    - **email**: User's email address  
    - **purpose**: Purpose of OTP (verification for registration, password_reset, etc.)
    
    For 'verification': Creates temporary inactive user if needed (for registration flow)
    For 'password_reset': User must already exist
    """
    from app.core.config import settings
    from app.core.security import get_password_hash
    import secrets
    
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    # For password reset, user must exist and be active
    if request.purpose == "password_reset":
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    # For verification (registration), create temporary user if doesn't exist
    if request.purpose == "verification" and not user:
        from app.models.user import UserRole
        # Create temporary inactive user for OTP storage
        temp_user = User(
            email=request.email,
            username=f"temp_{secrets.token_hex(4)}_{request.email.split('@')[0]}",  # Temp unique username
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random temp password
            full_name="",
            role=UserRole.USER,  # Use enum value
            is_active=False,  # Inactive until registration completes
            is_verified=False
        )
        db.add(temp_user)
        db.commit()
        db.refresh(temp_user)
        user = temp_user
    
    # Create and store OTP
    otp_data = OTPService.create_otp(db, user.id, request.purpose)
    
    # Send email
    username = user.username if user.is_active else request.email.split('@')[0]
    email_sent = EmailService.send_otp_email(
        to_email=request.email,
        otp_code=otp_data["code"],
        username=username
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return {
        "message": "OTP sent successfully",
        "email": request.email,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES
    }


@router.post("/send-to-me", status_code=status.HTTP_200_OK)
async def send_otp_to_current_user(
    request: SendOTPToCurrentUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send OTP to current authenticated user's email
    
    - **purpose**: Purpose of OTP (verification, password_reset, etc.)
    """
    # Create OTP
    otp_data = OTPService.create_otp(db, current_user.id, request.purpose)
    
    # Send email
    email_sent = EmailService.send_otp_email(
        to_email=current_user.email,
        otp_code=otp_data["code"],
        username=current_user.username
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    return {
        "message": "OTP sent successfully to your email",
        "email": current_user.email,
        "expires_in_minutes": 5
    }


@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP code
    
    - **email**: User's email address
    - **otp_code**: OTP code to verify
    - **purpose**: Purpose of OTP (verification, password_reset, etc.)
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify OTP
    is_valid = OTPService.verify_otp(db, user.id, request.otp_code, request.purpose)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # If purpose is verification, mark user as verified
    if request.purpose == "verification":
        user.is_verified = True
        db.commit()
    
    return {
        "message": "OTP verified successfully",
        "verified": True
    }


@router.post("/resend", status_code=status.HTTP_200_OK)
async def resend_otp(
    request: SendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Resend OTP to user email (same as send, but for clarity)
    
    - **email**: User's email address
    - **purpose**: Purpose of OTP (verification, password_reset, etc.)
    """
    return await send_otp(request, db)
