from datetime import datetime

from pydantic import BaseModel, Field


class SystemConfigBase(BaseModel):
    """Base schema for system configuration"""
    key: str = Field(..., max_length=100, description="Configuration key")
    value: str | None = Field(None, description="Configuration value")
    description: str | None = Field(None, max_length=255, description="Configuration description")
    is_public: bool = Field(default=False, description="Whether this config is publicly accessible")


class SystemConfigCreate(SystemConfigBase):
    """Schema for creating a new system configuration"""


class SystemConfigUpdate(BaseModel):
    """Schema for updating a system configuration"""
    value: str | None = None
    description: str | None = None
    is_public: bool | None = None


class SystemConfigOut(SystemConfigBase):
    """Schema for system configuration output"""
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class SystemConfigBulkUpdate(BaseModel):
    """Schema for bulk updating system configurations"""
    configs: dict[str, str] = Field(..., description="Dictionary of key-value pairs to update")


class SystemSettingsOut(BaseModel):
    """Schema for grouped system settings output"""
    # General Settings
    site_name: str | None = "EnglishWebAI"
    site_description: str | None = "Online English Learning Platform"
    site_logo: str | None = None
    site_favicon: str | None = None

    # Email Settings
    email_enabled: bool = False
    smtp_host: str | None = None
    smtp_port: int | None = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    email_from: str | None = None

    # Notification Settings
    notification_enabled: bool = True
    notification_email: bool = True
    notification_push: bool = False

    # Maintenance
    maintenance_mode: bool = False
    maintenance_message: str | None = "System is under maintenance. Please check back later."

    # Registration
    registration_enabled: bool = True
    email_verification_required: bool = False

    # Class Settings
    max_students_per_class: int = 30
    allow_student_create_discussion: bool = True

    # File Upload Settings
    max_file_size_mb: int = 10
    allowed_file_types: str = "pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif"


class SystemSettingsUpdate(BaseModel):
    """Schema for updating system settings"""
    # General Settings
    site_name: str | None = None
    site_description: str | None = None
    site_logo: str | None = None
    site_favicon: str | None = None

    # Email Settings
    email_enabled: bool | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    email_from: str | None = None

    # Notification Settings
    notification_enabled: bool | None = None
    notification_email: bool | None = None
    notification_push: bool | None = None

    # Maintenance
    maintenance_mode: bool | None = None
    maintenance_message: str | None = None

    # Registration
    registration_enabled: bool | None = None
    email_verification_required: bool | None = None

    # Class Settings
    max_students_per_class: int | None = None
    allow_student_create_discussion: bool | None = None

    # File Upload Settings
    max_file_size_mb: int | None = None
    allowed_file_types: str | None = None
