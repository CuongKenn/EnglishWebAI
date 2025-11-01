import pandas as pd
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, UploadFile
import io
import base64
from datetime import datetime
import json

from app.models.user import User, UserRole
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.excel_import import (
    StudentExcelRow, StudentsImportRequest, StudentsImportResponse,
    AddStudentsToClassRequest, AddStudentsToClassResponse, TeacherImportToClassResponse
)
from app.core.security import get_password_hash
from app.core.config import settings
import openai


class TeacherImportToClassResponse:
    def __init__(self, class_id, success_count=0, failed_count=0, failed_students=None, created_students=None):
        self.class_id = class_id
        self.success_count = success_count
        self.failed_count = failed_count
        self.failed_students = failed_students or []
        self.created_students = created_students or []
        self.added_to_class = []    # Đã thêm vào lớp
        self.created_new = []      # Tạo mới
        self.already_in_class = []  # Đã có trong lớp


class ExcelImportService:
    
    @staticmethod
    def parse_excel_with_ai(file: UploadFile) -> List[StudentExcelRow]:
        """AI đơn giản - chỉ lấy mã học sinh và tên"""
        try:
            from openai import OpenAI
            
            # Reset file position
            file.file.seek(0)
            contents = file.file.read()
            
            # Đọc raw Excel content - đọc nhiều dữ liệu hơn
            try:
                df_raw = pd.read_excel(io.BytesIO(contents), header=None)
                excel_text = df_raw.to_string(index=False, header=False, max_rows=100)  # Đọc tối đa 100 dòng
                print(f"Sending to AI: first 1000 chars: {excel_text[:1000]}")
            except:
                excel_text = f"File size: {len(contents)} bytes"
            
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-5-nano",
                messages=[
                    {
                        "role": "user", 
                        "content": f"""Từ dữ liệu Excel này, hãy trích xuất MÃ HỌC SINH và TÊN HỌC SINH:

{excel_text}

QUAN TRỌNG:
- Tìm dòng header có "STT", "Mã học sinh", "Họ và tên", "Ngày sinh"  
- Bỏ qua các dòng header, title như "ỦY BAN NHÂN DÂN", "TRƯỜNG TIỂU HỌC", "DANH SÁCH HỌC SINH"
- Chỉ lấy dữ liệu từ các dòng có mã học sinh (10 chữ số) và tên thật của học sinh
- Mã học sinh: 2102150966, 2102150967, etc.
- Tên học sinh: Bàn Thảo An, Dương Tuệ Anh, etc.

Ví dụ từ dữ liệu:
1  2102150966  Bàn Thảo An        27/01/2015
2  2102150967  Dương Tuệ Anh      20/08/2015  
3  2102150968  Lê Duy Quang Anh   02/11/2015

Trả về JSON với TẤT CẢ học sinh tìm được:
{{
  "students": [
    {{"ma_hoc_sinh": "2102150966", "ho_va_ten": "Bàn Thảo An"}},
    {{"ma_hoc_sinh": "2102150967", "ho_va_ten": "Dương Tuệ Anh"}},
    {{"ma_hoc_sinh": "2102150968", "ho_va_ten": "Lê Duy Quang Anh"}}
  ]
}}

CHỈ trả về JSON, không giải thích."""
                    }
                ],
                max_tokens=1000,
                temperature=0
            )
            
            ai_text = response.choices[0].message.content.strip()
            
            # Extract JSON
            if '{' in ai_text:
                start = ai_text.find('{')
                end = ai_text.rfind('}') + 1
                ai_text = ai_text[start:end]
            
            data = json.loads(ai_text)
            students = []
            
            for i, item in enumerate(data.get("students", [])):
                ma_hs = str(item.get("ma_hoc_sinh", f"HS{i+1:03d}")).strip()
                ten_hs = str(item.get("ho_va_ten", f"Học sinh {i+1}")).strip()
                
                if ma_hs and ten_hs:
                    students.append(StudentExcelRow(
                        stt=i + 1,
                        ma_hoc_sinh=ma_hs,
                        ho_va_ten=ten_hs,
                        ngay_sinh=None
                    ))
            
            if not students:
                # Nếu AI parsing thất bại hoàn toàn, throw error thay vì tạo fake data
                raise HTTPException(
                    status_code=400,
                    detail="Không thể đọc được dữ liệu học sinh từ file Excel. Vui lòng kiểm tra format file."
                )
            
            return students
            
        except Exception as e:
            print(f"AI parsing failed: {e}")
            # Throw error thay vì tạo fake data
            raise HTTPException(
                status_code=400,
                detail=f"AI parsing thất bại: {str(e)}. Vui lòng kiểm tra format file Excel."
            )
    
    @staticmethod
    def parse_excel_file(file: UploadFile) -> List[StudentExcelRow]:
        """Parse file Excel để lấy danh sách học sinh"""
        try:
            # Reset file position
            file.file.seek(0)
            contents = file.file.read()
            
            # Try reading with different engines
            df = None
            try:
                df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
            except Exception as e1:
                print(f"openpyxl failed: {e1}")
                try:
                    file.file.seek(0)
                    contents = file.file.read()
                    df = pd.read_excel(io.BytesIO(contents), engine='xlrd')
                except Exception as e2:
                    print(f"xlrd failed: {e2}")
                    try:
                        file.file.seek(0)
                        contents = file.file.read()
                        df = pd.read_excel(io.BytesIO(contents), engine='xlrd')
                    except Exception as e3:
                        # Nếu tất cả đều thất bại, dùng AI
                        print(f"All pandas engines failed: {e1}, {e2}, {e3}")
                        return ExcelImportService.parse_excel_with_ai(file)
            
            if df.empty:
                raise HTTPException(status_code=400, detail="File Excel rỗng")
            
            print(f"Excel columns found: {list(df.columns)}")
            print(f"First few rows of data:")
            for i in range(min(5, len(df))):
                print(f"  Row {i}: {df.iloc[i].to_dict()}")
            
            # Tìm header row thực sự bằng cách tìm dòng có "Mã học sinh" và "Họ và tên"
            header_row_index = None
            for idx, row in df.iterrows():
                row_values = [str(val).lower().strip() for val in row.values if pd.notna(val)]
                if any('mã học sinh' in val or 'ma hoc sinh' in val for val in row_values) and \
                   any('họ và tên' in val or 'ho va ten' in val or 'tên' in val for val in row_values):
                    header_row_index = idx
                    print(f"Found header row at index: {header_row_index}")
                    print(f"Header row content: {row.values}")
                    break
            
            if header_row_index is not None:
                # Đọc lại Excel với header đúng và skip rows
                try:
                    file.file.seek(0)
                    contents = file.file.read()
                    # Skip các row trước header và dùng header_row_index làm header
                    df = pd.read_excel(io.BytesIO(contents), skiprows=header_row_index, header=0)
                    print(f"Re-read Excel with header at row {header_row_index}")
                    print(f"New columns: {list(df.columns)}")
                    print(f"First few rows after re-read:")
                    for i in range(min(3, len(df))):
                        print(f"  Row {i}: {df.iloc[i].to_dict()}")
                except Exception as e:
                    print(f"Failed to re-read with header row {header_row_index}: {e}")
            
            # Tìm cột mã học sinh và tên (cải thiện) - dùng exact match hoặc position
            ma_hs_col = None
            ten_hs_col = None
            
            # Thử exact match trước
            for col in df.columns:
                col_clean = str(col).strip()
                col_lower = col_clean.lower()
                print(f"Checking column: '{col}' -> '{col_lower}'")
                
                # Exact match cho cột mã học sinh
                if col_clean == 'Mã học sinh' or col_lower in ['mã học sinh', 'ma hoc sinh', 'mã hs', 'ma hs']:
                    ma_hs_col = col
                    print(f"Found student ID column: {col}")
                # Exact match cho cột họ tên  
                elif col_clean == 'Họ và tên' or col_lower in ['họ và tên', 'ho va ten', 'họ tên', 'ho ten', 'tên', 'ten']:
                    ten_hs_col = col
                    print(f"Found name column: {col}")
            
            # Nếu không tìm được exact match, dùng position (assume standard Excel format)
            if ma_hs_col is None or ten_hs_col is None:
                print("Exact column match failed, trying positional mapping...")
                if len(df.columns) >= 3:
                    # Assume: STT=0, Mã học sinh=1, Họ và tên=2, Ngày sinh=3
                    ma_hs_col = df.columns[1]  # Column 1 = Mã học sinh
                    ten_hs_col = df.columns[2]  # Column 2 = Họ và tên
                    print(f"Using positional mapping - Mã HS: '{ma_hs_col}', Tên: '{ten_hs_col}'")
                else:
                    print("Not enough columns for positional mapping, using AI parsing...")
                    return ExcelImportService.parse_excel_with_ai(file)
            
            print(f"Final mapping - Mã HS: '{ma_hs_col}', Tên: '{ten_hs_col}'")
            
            students = []
            for index, row in df.iterrows():
                try:
                    ma_hs = str(row[ma_hs_col]).strip() if pd.notna(row[ma_hs_col]) else ""
                    ten_hs = str(row[ten_hs_col]).strip() if pd.notna(row[ten_hs_col]) else ""
                    
                    print(f"Row {index + 1}: ma_hs='{ma_hs}', ten_hs='{ten_hs}'")
                    
                    # Bỏ qua dòng trống hoặc header - cải thiện phát hiện header
                    if (not ma_hs or not ten_hs or 
                        ma_hs.lower() in ['nan', 'mã', 'ma', 'stt', 'số', 'no'] or
                        'mã học sinh' in ma_hs.lower() or 
                        'tên' in ten_hs.lower() or
                        'họ và tên' in ten_hs.lower() or
                        any(keyword in ma_hs.lower() for keyword in ['student', 'id', 'code']) or
                        any(keyword in ten_hs.lower() for keyword in ['name', 'họ', 'full'])):
                        print(f"Skipping header/invalid row {index + 1}: ma_hs='{ma_hs}', ten_hs='{ten_hs}'")
                        continue
                    
                    student = StudentExcelRow(
                        stt=index + 1,
                        ma_hoc_sinh=ma_hs,
                        ho_va_ten=ten_hs,
                        ngay_sinh=None
                    )
                    students.append(student)
                    
                except Exception as e:
                    print(f"Skipping row {index + 1}: {e}")
                    continue
            
            if not students:
                # Last resort: AI parsing
                print("No valid students found, trying AI")
                return ExcelImportService.parse_excel_with_ai(file)
            
            print(f"✅ Successfully parsed {len(students)} students")
            return students
            
        except Exception as e:
            print(f"Excel parsing completely failed: {e}")
            # Final fallback to AI
            try:
                return ExcelImportService.parse_excel_with_ai(file)
            except Exception as ai_error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Không thể đọc file Excel: {str(e)}. AI cũng thất bại: {str(ai_error)}"
                )
    
    @staticmethod
    def import_students(db: Session, request: StudentsImportRequest) -> StudentsImportResponse:
        """Import danh sách học sinh vào database (Admin function)"""
        created_students = []
        failed_students = []
        
        for student in request.students:
            try:
                # Tạo email từ mã học sinh
                email = f"{student.ma_hoc_sinh.lower()}@gmail.com"
                
                # Kiểm tra xem user đã tồn tại chưa
                existing_user = db.query(User).filter(
                    (User.username == student.ma_hoc_sinh) | 
                    (User.email == email)
                ).first()
                
                if existing_user:
                    failed_students.append({
                        "ma_hoc_sinh": student.ma_hoc_sinh,
                        "ho_va_ten": student.ho_va_ten,
                        "error": "Học sinh đã tồn tại"
                    })
                    continue
                
                # Tạo user mới với email từ mã học sinh
                email = f"{student.ma_hoc_sinh.lower()}@gmail.com"
                
                new_user = User(
                    username=student.ma_hoc_sinh,  # Mã học sinh làm username
                    email=email,                   # Email từ mã học sinh  
                    full_name=student.ho_va_ten,   # GIỮ NGUYÊN TÊN GỐC
                    hashed_password=get_password_hash(request.default_password),
                    role=UserRole.USER,  # USER = student
                    is_active=True,
                    is_verified=True
                )
                
                db.add(new_user)
                db.flush()  # Để lấy ID
                
                print(f"Created user: {new_user.username} | {new_user.full_name} | {new_user.email}")
                
                created_students.append({
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                    "full_name": new_user.full_name,  # Đảm bảo trả về tên đúng
                    "created_at": new_user.created_at
                })
                
            except Exception as e:
                failed_students.append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "error": str(e)
                })
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lưu vào database: {str(e)}"
            )
        
        return StudentsImportResponse(
            success_count=len(created_students),
            failed_count=len(failed_students),
            failed_students=failed_students,
            created_students=created_students
        )

    @staticmethod
    def import_students_to_class(
        db: Session,
        class_id: int,
        students: List[StudentExcelRow],
        current_user: User,
        default_password: str = "123456"
    ) -> TeacherImportToClassResponse:
        """
        Teacher import học sinh trực tiếp vào lớp từ Excel
        - Tự động tạo tài khoản nếu chưa tồn tại
        - Thêm vào lớp ngay lập tức
        """
        # Kiểm tra quyền truy cập lớp
        classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
        if (current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and 
            classroom.teacher_id != current_user.id):
            raise HTTPException(
                status_code=403, 
                detail="Chỉ giáo viên của lớp hoặc admin mới có thể thêm học sinh"
            )
        
        created_students = []
        failed_students = []
        
        for student in students:
            try:
                # Tạo email từ mã học sinh
                email = f"{student.ma_hoc_sinh.lower()}@gmail.com"
                
                # Kiểm tra xem user đã tồn tại chưa
                existing_user = db.query(User).filter(
                    (User.username == student.ma_hoc_sinh) | 
                    (User.email == email)
                ).first()
                
                if existing_user:
                    # User đã tồn tại, chỉ thêm vào lớp
                    existing_enrollment = db.query(Enrollment).filter(
                        Enrollment.user_id == existing_user.id,
                        Enrollment.classroom_id == class_id
                    ).first()
                    
                    if existing_enrollment:
                        failed_students.append({
                            "ma_hoc_sinh": student.ma_hoc_sinh,
                            "ho_va_ten": student.ho_va_ten,
                            "error": "Học sinh đã có trong lớp"
                        })
                        continue
                    
                    # Thêm vào lớp
                    enrollment = Enrollment(
                        user_id=existing_user.id,
                        classroom_id=class_id,
                        is_active=True
                    )
                    db.add(enrollment)
                    
                    created_students.append({
                        "id": existing_user.id,
                        "username": existing_user.username,
                        "email": existing_user.email,
                        "full_name": existing_user.full_name,
                        "action": "added_to_class"
                    })
                else:
                    # Tạo user mới
                    new_user = User(
                        username=student.ma_hoc_sinh,
                        email=email,
                        full_name=student.ho_va_ten,
                        hashed_password=get_password_hash(default_password),
                        role=UserRole.USER,
                        is_active=True,
                        is_verified=True
                    )
                    
                    db.add(new_user)
                    db.flush()  # Để lấy ID
                    
                    # Thêm vào lớp
                    enrollment = Enrollment(
                        user_id=new_user.id,
                        classroom_id=class_id,
                        is_active=True
                    )
                    db.add(enrollment)
                    
                    created_students.append({
                        "id": new_user.id,
                        "username": new_user.username,
                        "email": new_user.email,
                        "full_name": new_user.full_name,
                        "action": "created_and_added"
                    })
                    
                    print(f"Created user and added to class: {new_user.username} | {new_user.full_name}")
                    
            except Exception as e:
                failed_students.append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "error": str(e)
                })
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lưu vào database: {str(e)}"
            )
        
        return TeacherImportToClassResponse(
            class_id=class_id,
            success_count=len(created_students),
            failed_count=len(failed_students),
            failed_students=failed_students,
            created_students=created_students
        )


class ClassStudentService:
    
    @staticmethod
    def add_students_to_class(
        db: Session, 
        class_id: int, 
        request: AddStudentsToClassRequest,
        current_user: User
    ) -> AddStudentsToClassResponse:
        """Thêm học sinh vào lớp bằng email"""
        
        # Kiểm tra quyền - chỉ teacher của lớp hoặc admin mới được thêm
        classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
        if (current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and 
            classroom.teacher_id != current_user.id):
            raise HTTPException(
                status_code=403, 
                detail="Chỉ giáo viên của lớp hoặc admin mới có thể thêm học sinh"
            )
        
        added_students = []
        failed_emails = []
        
        for email in request.emails:
            try:
                # Tìm user theo email
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    failed_emails.append({
                        "email": email,
                        "error": "Không tìm thấy tài khoản với email này"
                    })
                    continue
                
                # Kiểm tra xem đã là học sinh chưa
                if user.role != UserRole.USER:
                    failed_emails.append({
                        "email": email,
                        "error": f"Tài khoản này có vai trò {user.role.value}, không phải học sinh"
                    })
                    continue
                
                # Kiểm tra xem đã có trong lớp chưa
                existing_enrollment = db.query(Enrollment).filter(
                    Enrollment.user_id == user.id,
                    Enrollment.classroom_id == class_id
                ).first()
                
                if existing_enrollment:
                    failed_emails.append({
                        "email": email,
                        "error": "Học sinh đã có trong lớp"
                    })
                    continue
                
                # Thêm vào lớp
                enrollment = Enrollment(
                    user_id=user.id,
                    classroom_id=class_id,
                    is_active=True
                )
                db.add(enrollment)
                
                added_students.append({
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "username": user.username
                })
                
            except Exception as e:
                failed_emails.append({
                    "email": email,
                    "error": str(e)
                })
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lưu vào database: {str(e)}"
            )
        
        return AddStudentsToClassResponse(
            success_count=len(added_students),
            failed_count=len(failed_emails),
            failed_emails=failed_emails,
            added_students=added_students
        )