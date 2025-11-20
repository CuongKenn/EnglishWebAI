import random
import string
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings


class OTPGenerator:
    """Utility class for generating and managing OTP codes"""

    @staticmethod
    def generate_otp(length: int = None) -> str:
        """
        Generate a random numeric OTP code

        Args:
            length: Length of OTP code (default from settings)

        Returns:
            str: Generated OTP code
        """
        if length is None:
            length = settings.OTP_LENGTH

        # Generate numeric OTP
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def generate_alphanumeric_code(length: int = 8) -> str:
        """
        Generate a random alphanumeric code

        Args:
            length: Length of the code

        Returns:
            str: Generated alphanumeric code
        """
        characters = string.ascii_uppercase + string.digits
        return ''.join(random.choices(characters, k=length))

    @staticmethod
    def calculate_expiry_time(minutes: int = None) -> datetime:
        """
        Calculate OTP expiry time

        Args:
            minutes: Expiry time in minutes (default from settings)

        Returns:
            datetime: Expiry timestamp
        """
        if minutes is None:
            minutes = settings.OTP_EXPIRE_MINUTES

        return datetime.utcnow() + timedelta(minutes=minutes)

    @staticmethod
    def is_expired(expiry_time: datetime) -> bool:
        """
        Check if OTP has expired

        Args:
            expiry_time: Expiry timestamp to check

        Returns:
            bool: True if expired, False otherwise
        """
        return datetime.utcnow() > expiry_time

    @staticmethod
    def verify_otp(provided_otp: str, stored_otp: str, expiry_time: datetime) -> bool:
        """
        Verify OTP code

        Args:
            provided_otp: OTP provided by user
            stored_otp: OTP stored in database
            expiry_time: Expiry timestamp

        Returns:
            bool: True if OTP is valid and not expired
        """
        # Check if OTP has expired
        if OTPGenerator.is_expired(expiry_time):
            return False

        # Compare OTPs (case-insensitive for alphanumeric codes)
        return provided_otp.strip().upper() == stored_otp.strip().upper()


class OTPService:
    """Service for managing OTP in database"""

    @staticmethod
    def create_otp(db: Session, user_id: int, purpose: str = "verification") -> dict:
        """
        Create and store OTP for a user

        Args:
            db: Database session
            user_id: User ID
            purpose: Purpose of OTP (verification, password_reset, etc.)

        Returns:
            dict: OTP information including code and expiry time
        """
        from app.models.otp import OTP

        # Generate OTP
        otp_code = OTPGenerator.generate_otp()
        expiry_time = OTPGenerator.calculate_expiry_time()

        # Delete any existing OTP for this user and purpose
        db.query(OTP).filter(
            OTP.user_id == user_id,
            OTP.purpose == purpose,
            OTP.is_used.is_(False)  # Use explicit comparison instead of 'not'
        ).delete()

        # Create new OTP
        otp = OTP(
            user_id=user_id,
            code=otp_code,
            purpose=purpose,
            expires_at=expiry_time,
            is_used=False
        )

        db.add(otp)
        db.commit()
        db.refresh(otp)

        return {
            "code": otp_code,
            "expires_at": expiry_time,
            "id": otp.id
        }

    @staticmethod
    def verify_otp(db: Session, user_id: int, otp_code: str, purpose: str = "verification") -> bool:
        """
        Verify OTP for a user

        Args:
            db: Database session
            user_id: User ID
            otp_code: OTP code to verify
            purpose: Purpose of OTP

        Returns:
            bool: True if OTP is valid
        """
        from app.models.otp import OTP

        # Find the OTP
        otp = db.query(OTP).filter(
            OTP.user_id == user_id,
            OTP.purpose == purpose,
            OTP.is_used.is_(False)  # Use explicit comparison instead of 'not'
        ).order_by(OTP.created_at.desc()).first()

        if not otp:
            return False

        # Verify OTP
        is_valid = OTPGenerator.verify_otp(otp_code, otp.code, otp.expires_at)

        if is_valid:
            # Mark OTP as used
            otp.is_used = True
            db.commit()

        return is_valid

    @staticmethod
    def cleanup_expired_otps(db: Session):
        """
        Delete expired OTPs from database

        Args:
            db: Database session
        """
        from app.models.otp import OTP

        db.query(OTP).filter(
            OTP.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
