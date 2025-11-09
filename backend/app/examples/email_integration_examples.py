"""
Integration Examples: How to Use Email Service with OTP

This file contains practical examples of integrating the email service
into your authentication and security flows.
"""

from datetime import datetime

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.services.email_service import EmailService
from app.utils.otp import OTPService

# Example 1: Email Verification on Registration
# ============================================

class RegisterWithVerification(BaseModel):
    email: EmailStr
    username: str
    password: str


async def register_user_with_email_verification(
    data: RegisterWithVerification,
    db: Session = Depends(get_db)
):
    """
    Register a new user and send email verification OTP
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == data.email) | (User.username == data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )

    # Create user (not verified yet)
    new_user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        is_verified=False,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate and send OTP
    otp_data = OTPService.create_otp(db, new_user.id, purpose="verification")

    email_sent = EmailService.send_otp_email(
        to_email=new_user.email,
        otp_code=otp_data["code"],
        username=new_user.username
    )

    if not email_sent:
        # Optionally delete the user if email fails
        # db.delete(new_user)
        # db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )

    return {
        "message": "User registered successfully. Please check your email for verification code.",
        "user_id": new_user.id,
        "email": new_user.email
    }


class VerifyEmail(BaseModel):
    email: EmailStr
    otp_code: str


async def verify_user_email(
    data: VerifyEmail,
    db: Session = Depends(get_db)
):
    """
    Verify user's email with OTP
    """
    # Find user
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.is_verified:
        return {"message": "Email already verified"}

    # Verify OTP
    is_valid = OTPService.verify_otp(db, user.id, data.otp_code, purpose="verification")

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    # Mark user as verified
    user.is_verified = True
    db.commit()

    return {
        "message": "Email verified successfully",
        "verified": True
    }


# Example 2: Password Reset Flow
# ===============================

class RequestPasswordReset(BaseModel):
    email: EmailStr


async def request_password_reset(
    data: RequestPasswordReset,
    db: Session = Depends(get_db)
):
    """
    Request password reset - sends OTP to user's email
    """
    # Find user
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        # Security: Don't reveal if user exists or not
        return {
            "message": "If the email exists, a password reset code has been sent."
        }

    # Generate and send OTP
    otp_data = OTPService.create_otp(db, user.id, purpose="password_reset")

    EmailService.send_password_reset_email(
        to_email=user.email,
        reset_code=otp_data["code"],
        username=user.username
    )

    # Don't reveal if email sending failed (security)
    return {
        "message": "If the email exists, a password reset code has been sent."
    }


class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


async def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    """
    Reset password after verifying OTP
    """
    # Find user
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify OTP
    is_valid = OTPService.verify_otp(db, user.id, data.otp_code, purpose="password_reset")

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code"
        )

    # Update password
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {
        "message": "Password reset successfully"
    }


# Example 3: Two-Factor Authentication (2FA)
# ===========================================

class LoginWith2FA(BaseModel):
    username: str
    password: str


async def login_request_2fa(
    data: LoginWith2FA,
    db: Session = Depends(get_db)
):
    """
    Step 1: Login with username/password, then send 2FA OTP
    """
    from app.services.user_service import UserService

    # Authenticate user
    user = UserService.authenticate_user_by_username(db, data.username, data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Generate and send 2FA OTP
    otp_data = OTPService.create_otp(db, user.id, purpose="2fa")

    email_sent = EmailService.send_otp_email(
        to_email=user.email,
        otp_code=otp_data["code"],
        username=user.username
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send 2FA code"
        )

    return {
        "message": "2FA code sent to your email",
        "email": user.email,
        "requires_2fa": True
    }


class Verify2FA(BaseModel):
    username: str
    otp_code: str


async def verify_2fa_and_login(
    data: Verify2FA,
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify 2FA OTP and issue access token
    """
    from datetime import timedelta

    from app.core.config import settings
    from app.core.security import create_access_token

    # Find user
    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

    # Verify 2FA OTP
    is_valid = OTPService.verify_otp(db, user.id, data.otp_code, purpose="2fa")

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired 2FA code"
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


# Example 4: Change Email Verification
# =====================================

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr


async def request_email_change(
    data: ChangeEmailRequest,
    current_user: User,
    db: Session = Depends(get_db)
):
    """
    Request to change email - sends OTP to NEW email
    """
    # Check if new email is already in use
    existing_user = db.query(User).filter(User.email == data.new_email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )

    # Generate and send OTP to NEW email
    otp_data = OTPService.create_otp(db, current_user.id, purpose="email_change")

    # Store the new email temporarily (you might want a separate table for this)
    # For simplicity, we'll use the OTP code as a way to verify

    email_sent = EmailService.send_otp_email(
        to_email=data.new_email,
        otp_code=otp_data["code"],
        username=current_user.username
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )

    return {
        "message": f"Verification code sent to {data.new_email}",
        "new_email": data.new_email
    }


class ConfirmEmailChange(BaseModel):
    new_email: EmailStr
    otp_code: str


async def confirm_email_change(
    data: ConfirmEmailChange,
    current_user: User,
    db: Session = Depends(get_db)
):
    """
    Confirm email change with OTP
    """
    # Verify OTP
    is_valid = OTPService.verify_otp(db, current_user.id, data.otp_code, purpose="email_change")

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    # Update email
    current_user.email = data.new_email
    current_user.is_verified = True  # New email is verified
    db.commit()

    return {
        "message": "Email changed successfully",
        "new_email": data.new_email
    }


# Example 5: Periodic Security Checks
# ====================================

async def send_login_notification(user: User, db: Session):
    """
    Send notification when user logs in from new location/device
    """
    # This is just a notification, not an OTP
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>New Login Detected</h2>
            <p>Hello {user.username},</p>
            <p>We detected a new login to your account.</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>If this was you, you can ignore this email.</p>
            <p>If you did not login, please secure your account immediately.</p>
        </body>
    </html>
    """

    EmailService.send_email(
        to_email=user.email,
        subject="New Login Detected",
        html_content=html_content
    )


# Cleanup Job (run periodically with cron or scheduler)
# ======================================================

async def cleanup_expired_otps_job(db: Session):
    """
    Periodic job to clean up expired OTPs
    Run this daily or hourly depending on your needs
    """
    try:
        OTPService.cleanup_expired_otps(db)
        print(f"✅ Cleaned up expired OTPs at {datetime.now()}")
    except Exception as e:
        print(f"❌ Error cleaning up OTPs: {str(e)}")


# Usage Notes:
# ===========
#
# 1. Add these functions to your routers or use them as reference
# 2. Customize the email templates in email_service.py as needed
# 3. Add rate limiting to prevent OTP spam
# 4. Consider adding a cooldown period between OTP requests
# 5. Log all OTP-related actions for security auditing
# 6. Use background tasks for sending emails to avoid blocking requests
# 7. Monitor email delivery rates and failures
