"""
Google OAuth Schemas
"""

from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    """Request schema for Google OAuth login/register"""
    id_token: str = Field(..., description="Google ID token")


class GoogleAuthResponse(BaseModel):
    """Response schema for Google OAuth"""
    access_token: str
    token_type: str = "bearer"
    user: dict
    is_new_user: bool = Field(default=False, description="True if this is a new registration")
