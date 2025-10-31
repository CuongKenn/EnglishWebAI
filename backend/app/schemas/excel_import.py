from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime


class StudentExcelRow(BaseModel):
    """Dữ liệu một hàng trong file Excel"""
    stt: int
    ma_hoc_sinh: str
    ho_va_ten: str
    ngay_sinh: Optional[str] = None
    
    @validator('ma_hoc_sinh')
    def validate_ma_hoc_sinh(cls, v):
        if not v or not v.strip():
            raise ValueError('Mã học sinh không được để trống')
        return v.strip()
    
    @validator('ho_va_ten')
    def validate_ho_va_ten(cls, v):
        if not v or not v.strip():
            raise ValueError('Họ và tên không được để trống')
        return v.strip()


class StudentsImportRequest(BaseModel):
    """Request body cho import học sinh"""
    students: List[StudentExcelRow]
    default_password: str = "123456"  # Mật khẩu mặc định
    
    @validator('default_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v


class StudentsImportResponse(BaseModel):
    """Response sau khi import"""
    success_count: int
    failed_count: int
    failed_students: List[dict]
    created_students: List[dict]
    
    
class StudentCreatedInfo(BaseModel):
    """Thông tin học sinh đã tạo"""
    id: int
    username: str
    email: str
    full_name: str
    created_at: datetime


class AddStudentsToClassRequest(BaseModel):
    """Request thêm học sinh vào lớp bằng email"""
    emails: List[EmailStr]
    
    @validator('emails')
    def validate_emails(cls, v):
        if not v:
            raise ValueError('Danh sách email không được để trống')
        if len(v) > 100:
            raise ValueError('Không thể thêm quá 100 học sinh cùng lúc')
        return v


class AddStudentsToClassResponse(BaseModel):
    """Response sau khi thêm học sinh vào lớp"""
    success_count: int
    failed_count: int
    failed_emails: List[dict]
    added_students: List[dict]


class TeacherImportToClassResponse(BaseModel):
    """Response sau khi teacher import Excel vào lớp"""
    class_id: int
    success_count: int
    failed_count: int
    failed_students: List[dict]
    created_students: List[dict]