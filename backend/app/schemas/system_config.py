from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SystemConfigBase(BaseModel):
    """Base schema for system configuration"""
    key: str = Field(..., max_length=100, description="Configuration key")
    value: Optional[str] = Field(None, description="Configuration value")
    description: Optional[str] = Field(None, max_length=255, description="Configuration description")
    is_public: bool = Field(default=False, description="Whether this config is publicly accessible")


class SystemConfigCreate(SystemConfigBase):
    """Schema for creating a new system configuration"""
    pass


class SystemConfigUpdate(BaseModel):
    """Schema for updating a system configuration"""
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class SystemConfigOut(SystemConfigBase):
    """Schema for system configuration output"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SystemConfigBulkUpdate(BaseModel):
    """Schema for bulk updating system configurations"""
    configs: dict[str, str] = Field(..., description="Dictionary of key-value pairs to update")


class SystemSettingsOut(BaseModel):
    """Schema for grouped system settings output"""
    # General Settings
    site_name: Optional[str] = "EnglishWebAI"
    site_description: Optional[str] = "Online English Learning Platform"
    site_logo: Optional[str] = None
    site_favicon: Optional[str] = None
    
    # Email Settings
    email_enabled: bool = False
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    
    # Notification Settings
    notification_enabled: bool = True
    notification_email: bool = True
    notification_push: bool = False
    
    # Maintenance
    maintenance_mode: bool = False
    maintenance_message: Optional[str] = "System is under maintenance. Please check back later."
    
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
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    site_logo: Optional[str] = None
    site_favicon: Optional[str] = None
    
    # Email Settings
    email_enabled: Optional[bool] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    
    # Notification Settings
    notification_enabled: Optional[bool] = None
    notification_email: Optional[bool] = None
    notification_push: Optional[bool] = None
    
    # Maintenance
    maintenance_mode: Optional[bool] = None
    maintenance_message: Optional[str] = None
    
    # Registration
    registration_enabled: Optional[bool] = None
    email_verification_required: Optional[bool] = None
    
    # Class Settings
    max_students_per_class: Optional[int] = None
    allow_student_create_discussion: Optional[bool] = None
    
    # File Upload Settings
    max_file_size_mb: Optional[int] = None
    allowed_file_types: Optional[str] = None
