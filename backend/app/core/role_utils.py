"""
Role Utility Functions
Handles role mapping and validation
"""

from typing import Union, List
from app.models.user import UserRole


# Role mapping: student <-> user
STUDENT_ROLE_ALIASES = ["student", "user"]
ROLE_MAPPING = {
    "student": UserRole.USER,  # student maps to USER in database
    "user": UserRole.USER,
    "parent": UserRole.PARENT,
    "teacher": UserRole.TEACHER,
    "admin": UserRole.ADMIN,
    "superadmin": UserRole.SUPERADMIN,
}

# Reverse mapping for display
DISPLAY_ROLE_MAPPING = {
    UserRole.USER: "student",  # Display USER as "student"
    UserRole.PARENT: "parent",
    UserRole.TEACHER: "teacher",
    UserRole.ADMIN: "admin",
    UserRole.SUPERADMIN: "superadmin",
}


def normalize_role(role: Union[str, UserRole]) -> UserRole:
    """
    Normalize role string to UserRole enum
    Accepts: 'student', 'user' -> returns UserRole.USER
    
    Args:
        role: Role as string or UserRole enum
        
    Returns:
        UserRole enum
        
    Examples:
        normalize_role("student") -> UserRole.USER
        normalize_role("user") -> UserRole.USER
        normalize_role("teacher") -> UserRole.TEACHER
    """
    if isinstance(role, UserRole):
        return role
    
    role_lower = role.lower() if isinstance(role, str) else role
    
    if role_lower in ROLE_MAPPING:
        return ROLE_MAPPING[role_lower]
    
    # Try to match UserRole enum directly
    try:
        return UserRole(role_lower)
    except ValueError:
        raise ValueError(f"Invalid role: {role}. Valid roles: {list(ROLE_MAPPING.keys())}")


def is_student_role(role: Union[str, UserRole]) -> bool:
    """
    Check if role is student (USER)
    
    Args:
        role: Role as string or UserRole enum
        
    Returns:
        True if role is student/user
    """
    normalized = normalize_role(role)
    return normalized == UserRole.USER


def is_teacher_role(role: Union[str, UserRole]) -> bool:
    """Check if role is teacher"""
    normalized = normalize_role(role)
    return normalized == UserRole.TEACHER


def is_parent_role(role: Union[str, UserRole]) -> bool:
    """Check if role is parent"""
    normalized = normalize_role(role)
    return normalized == UserRole.PARENT


def is_admin_role(role: Union[str, UserRole]) -> bool:
    """Check if role is admin or superadmin"""
    normalized = normalize_role(role)
    return normalized in (UserRole.ADMIN, UserRole.SUPERADMIN)


def get_display_role(role: Union[str, UserRole]) -> str:
    """
    Get display name for role
    USER -> "student"
    
    Args:
        role: Role as string or UserRole enum
        
    Returns:
        Display name as string
    """
    normalized = normalize_role(role)
    return DISPLAY_ROLE_MAPPING.get(normalized, normalized.value)


def validate_roles(roles: List[str]) -> List[UserRole]:
    """
    Validate and normalize list of roles
    
    Args:
        roles: List of role strings
        
    Returns:
        List of UserRole enums
        
    Raises:
        ValueError: If any role is invalid
    """
    return [normalize_role(role) for role in roles]


def role_matches(user_role: Union[str, UserRole], allowed_roles: List[Union[str, UserRole]]) -> bool:
    """
    Check if user role matches any of the allowed roles
    
    Args:
        user_role: User's role
        allowed_roles: List of allowed roles
        
    Returns:
        True if user role is in allowed roles
        
    Examples:
        role_matches("student", ["student", "teacher"]) -> True
        role_matches(UserRole.USER, ["student"]) -> True
        role_matches("user", ["student"]) -> True (same role)
    """
    normalized_user_role = normalize_role(user_role)
    normalized_allowed = [normalize_role(r) for r in allowed_roles]
    return normalized_user_role in normalized_allowed

