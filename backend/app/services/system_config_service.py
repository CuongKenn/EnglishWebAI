from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.models.system_config import SystemConfig
from app.schemas.system_config import (
    SystemConfigCreate, SystemConfigUpdate, 
    SystemSettingsOut, SystemSettingsUpdate
)


class SystemConfigService:
    """Service for managing system configurations"""
    
    @staticmethod
    def get_config_by_key(db: Session, key: str) -> Optional[SystemConfig]:
        """Get a configuration by key"""
        return db.query(SystemConfig).filter(SystemConfig.key == key).first()
    
    @staticmethod
    def get_config_value(db: Session, key: str, default: Any = None) -> Any:
        """Get configuration value by key, return default if not found"""
        config = SystemConfigService.get_config_by_key(db, key)
        if config:
            return config.value
        return default
    
    @staticmethod
    def get_all_configs(db: Session, public_only: bool = False) -> list[SystemConfig]:
        """Get all configurations"""
        query = db.query(SystemConfig)
        if public_only:
            query = query.filter(SystemConfig.is_public == True)
        return query.all()
    
    @staticmethod
    def create_config(db: Session, config_data: SystemConfigCreate) -> SystemConfig:
        """Create a new configuration"""
        config = SystemConfig(**config_data.model_dump())
        db.add(config)
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def update_config(db: Session, key: str, config_data: SystemConfigUpdate) -> Optional[SystemConfig]:
        """Update an existing configuration"""
        config = SystemConfigService.get_config_by_key(db, key)
        if not config:
            return None
        
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def set_config(db: Session, key: str, value: str, description: str = None, is_public: bool = False) -> SystemConfig:
        """Set a configuration value (create if not exists, update if exists)"""
        config = SystemConfigService.get_config_by_key(db, key)
        
        if config:
            config.value = value
            if description:
                config.description = description
            config.is_public = is_public
        else:
            config = SystemConfig(
                key=key,
                value=value,
                description=description,
                is_public=is_public
            )
            db.add(config)
        
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def delete_config(db: Session, key: str) -> bool:
        """Delete a configuration"""
        config = SystemConfigService.get_config_by_key(db, key)
        if not config:
            return False
        
        db.delete(config)
        db.commit()
        return True
    
    @staticmethod
    def get_all_settings(db: Session) -> SystemSettingsOut:
        """Get all system settings as a structured object"""
        configs = SystemConfigService.get_all_configs(db)
        config_dict = {c.key: c.value for c in configs}
        
        # Convert string values to appropriate types
        def to_bool(val: str) -> bool:
            if val is None:
                return False
            return val.lower() in ('true', '1', 'yes', 'on')
        
        def to_int(val: str, default: int) -> int:
            try:
                return int(val) if val else default
            except (ValueError, TypeError):
                return default
        
        return SystemSettingsOut(
            # General Settings
            site_name=config_dict.get('site_name', 'EnglishWebAI'),
            site_description=config_dict.get('site_description', 'Online English Learning Platform'),
            site_logo=config_dict.get('site_logo'),
            site_favicon=config_dict.get('site_favicon'),
            
            # Email Settings
            email_enabled=to_bool(config_dict.get('email_enabled')),
            smtp_host=config_dict.get('smtp_host'),
            smtp_port=to_int(config_dict.get('smtp_port'), 587),
            smtp_user=config_dict.get('smtp_user'),
            smtp_password=config_dict.get('smtp_password'),
            email_from=config_dict.get('email_from'),
            
            # Notification Settings
            notification_enabled=to_bool(config_dict.get('notification_enabled', 'true')),
            notification_email=to_bool(config_dict.get('notification_email', 'true')),
            notification_push=to_bool(config_dict.get('notification_push')),
            
            # Maintenance
            maintenance_mode=to_bool(config_dict.get('maintenance_mode')),
            maintenance_message=config_dict.get('maintenance_message', 'System is under maintenance. Please check back later.'),
            
            # Registration
            registration_enabled=to_bool(config_dict.get('registration_enabled', 'true')),
            email_verification_required=to_bool(config_dict.get('email_verification_required')),
            
            # Class Settings
            max_students_per_class=to_int(config_dict.get('max_students_per_class'), 30),
            allow_student_create_discussion=to_bool(config_dict.get('allow_student_create_discussion', 'true')),
            
            # File Upload Settings
            max_file_size_mb=to_int(config_dict.get('max_file_size_mb'), 10),
            allowed_file_types=config_dict.get('allowed_file_types', 'pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif'),
        )
    
    @staticmethod
    def update_settings(db: Session, settings: SystemSettingsUpdate) -> SystemSettingsOut:
        """Update system settings"""
        update_data = settings.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            # Convert value to string for storage
            if isinstance(value, bool):
                str_value = 'true' if value else 'false'
            elif value is None:
                str_value = ''
            else:
                str_value = str(value)
            
            SystemConfigService.set_config(db, key, str_value, is_public=False)
        
        return SystemConfigService.get_all_settings(db)
    
    @staticmethod
    def bulk_update(db: Session, configs: Dict[str, str]) -> list[SystemConfig]:
        """Bulk update configurations"""
        updated_configs = []
        
        for key, value in configs.items():
            config = SystemConfigService.set_config(db, key, value)
            updated_configs.append(config)
        
        return updated_configs
    
    @staticmethod
    def initialize_default_configs(db: Session):
        """Initialize default system configurations if they don't exist"""
        defaults = {
            'site_name': ('EnglishWebAI', 'Website name', True),
            'site_description': ('Online English Learning Platform', 'Website description', True),
            'email_enabled': ('false', 'Enable email notifications', False),
            'notification_enabled': ('true', 'Enable notifications', False),
            'notification_email': ('true', 'Enable email notifications', False),
            'maintenance_mode': ('false', 'Maintenance mode status', True),
            'registration_enabled': ('true', 'Allow new user registration', True),
            'max_students_per_class': ('30', 'Maximum students per class', False),
            'allow_student_create_discussion': ('true', 'Allow students to create discussions', False),
            'max_file_size_mb': ('10', 'Maximum file upload size in MB', False),
            'allowed_file_types': ('pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif', 'Allowed file types for upload', False),
        }
        
        for key, (value, description, is_public) in defaults.items():
            existing = SystemConfigService.get_config_by_key(db, key)
            if not existing:
                SystemConfigService.set_config(db, key, value, description, is_public)
