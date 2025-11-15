"""
Google OAuth Service
Handles Google Sign-In authentication
"""

import logging
from datetime import timedelta

from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User

logger = logging.getLogger(__name__)


class GoogleAuthService:
    """Service for Google OAuth authentication"""

    @staticmethod
    def verify_google_token(token: str) -> dict:
        """
        Verify Google ID token and return user info

        Args:
            token: Google ID token

        Returns:
            dict: User info from Google (email, name, picture, etc.)
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            # Verify issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # Return user info
            return {
                'email': idinfo.get('email'),
                'email_verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'google_id': idinfo.get('sub'),
            }

        except ValueError as e:
            logger.error(f"Invalid Google token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            ) from e

    @staticmethod
    def authenticate_with_google(db: Session, google_token: str) -> dict:
        """
        Authenticate or register user with Google

        Args:
            db: Database session
            google_token: Google ID token

        Returns:
            dict: Access token and user info
        """
        # Verify Google token
        google_user = GoogleAuthService.verify_google_token(google_token)

        if not google_user['email_verified']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not verified by Google"
            )

        email = google_user['email']
        google_id = google_user['google_id']

        # Check if user exists by email
        user = db.query(User).filter(User.email == email).first()

        is_new_user = False

        if user:
            # Existing user - update Google ID if not set
            if not user.google_id:
                user.google_id = google_id
                db.commit()
                db.refresh(user)
        else:
            # New user - register
            is_new_user = True

            # Generate unique username from email
            username = email.split('@')[0]
            base_username = username
            counter = 1

            # Ensure username is unique
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            # Create new user
            user = User(
                email=email,
                username=username,
                full_name=google_user.get('name', username),
                google_id=google_id,
                avatar_url=google_user.get('picture'),
                is_active=True,
                role='user',  # Default role
                password_hash=None,  # Google users don't have password
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            logger.info(f"New user registered via Google: {email}")

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "is_new_user": is_new_user
        }
