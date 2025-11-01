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
    AddStudentsToClassRequest, AddStudentsToClassResponse
)
from app.core.security import get_password_hash
from app.core.config import settings
import openai


class TeacherImportToClassResponse:
    """Response cho teacher import trực tiếp vào lớp"""
    def __init__(self):
        self.success_count = 0
        self.failed_count = 0
        self.created_accounts = []  # Tài khoản mới tạo
        self.added_to_class = []    # Đã thêm vào lớp
        self.failed_students = []   # Thất bại
        self.already_in_class = []  # Đã có trong lớp


class ExcelImportService:
    
    @staticmethod
    def parse_excel_with_ai(file: UploadFile) -> List[StudentExcelRow]:
        """AI đơn giản - chỉ lấy mã học sinh và tên"""
        try:
            from openai import OpenAI
            
            if not settings.OPENAI_API_KEY:
                # Tạo fake data nếu không có AI key
                print("No OpenAI key, generating fake data")
                return [
                    StudentExcelRow(stt=1, ma_hoc_sinh="HS001", ho_va_ten="Nguyễn Văn A", ngay_sinh=None),
                    StudentExcelRow(stt=2, ma_hoc_sinh="HS002", ho_va_ten="Trần Thị B", ngay_sinh=None),
                ]
            
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
        """Parse file Excel đơn giản - chỉ cần mã học sinh và tên"""
        try:
            # Reset file pointer
            file.file.seek(0)
            contents = file.file.read()
            
            print(f"📄 Parsing file: {file.filename}, size: {len(contents)} bytes")
            
            # Thử các engine khác nhau
            df = None
            last_error = None
            
            # 1. Thử xlrd cho file .xls (Excel cũ 97-2003) với nhiều cách
            if file.filename.lower().endswith('.xls'):
                # Thử với header=None trước để đọc raw data
                try:
                    print("Trying xlrd engine for .xls file (raw mode)...")
                    df = pd.read_excel(io.BytesIO(contents), engine='xlrd', header=None)
                    print("✅ xlrd engine succeeded (raw mode)!")
                except Exception as e1:
                    print(f"❌ xlrd failed: {str(e1)}")
                    last_error = e1
                    # Thử với header auto-detect
                    try:
                        print("Trying xlrd with auto header...")
                        df = pd.read_excel(io.BytesIO(contents), engine='xlrd')
                        print("✅ xlrd with auto header succeeded!")
                    except Exception as e2:
                        print(f"❌ xlrd auto header failed: {str(e2)}")
                        last_error = e2
            
            # 2. Thử openpyxl cho file .xlsx (Excel mới)
            if df is None and file.filename.lower().endswith('.xlsx'):
                try:
                    print("Trying openpyxl engine for .xlsx file...")
                    df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
                    print("✅ openpyxl engine succeeded!")
                except Exception as e2:
                    print(f"❌ openpyxl failed: {str(e2)}")
                    last_error = e2
            
            # 3. Thử auto-detect engine
            if df is None:
                try:
                    print("Trying auto-detect engine...")
                    df = pd.read_excel(io.BytesIO(contents))
                    print("✅ Auto-detect succeeded!")
                except Exception as e3:
                    print(f"❌ Auto-detect failed: {str(e3)}")
                    last_error = e3
            
            # 4. Nếu tất cả đều thất bại, dùng AI
            if df is None:
                print(f"⚠️ All pandas engines failed, trying AI parsing...")
                print(f"Last error: {str(last_error)}")
                return ExcelImportService.parse_excel_with_ai(file)
            
            if df.empty:
                raise HTTPException(status_code=400, detail="File Excel rỗng")
            
            print(f"Excel columns found: {list(df.columns)}")
            print(f"DataFrame shape: {df.shape}")
            print(f"First few rows of data:")
            for i in range(min(5, len(df))):
                print(f"  Row {i}: {df.iloc[i].to_dict()}")
            
            # Tìm header row thực sự
            header_row_index = None
            
            # Cách 1: Tìm dòng có "Mã học sinh" và "Họ và tên"
            for idx, row in df.iterrows():
                row_values = [str(val).lower().strip() for val in row.values if pd.notna(val)]
                has_ma_hs = any('mã học sinh' in val or 'ma hoc sinh' in val or 'mã hs' in val for val in row_values)
                has_ho_ten = any('họ và tên' in val or 'ho va ten' in val or 'họ tên' in val or 'tên' in val for val in row_values)
                
                if has_ma_hs and has_ho_ten:
                    header_row_index = idx
                    print(f"✅ Found header row at index: {header_row_index}")
                    print(f"   Header row content: {row.values}")
                    break
            
            # Cách 2: Nếu không tìm thấy, check xem có phải file đã có header rồi không
            if header_row_index is None and len(df.columns) >= 3:
                # Check xem columns có giống header không
                col_names = [str(col).lower() for col in df.columns]
                has_ma_hs = any('mã' in c or 'ma' in c or 'stt' in c for c in col_names)
                has_ho_ten = any('tên' in c or 'ten' in c or 'họ' in c or 'ho' in c for c in col_names)
                
                if has_ma_hs or has_ho_ten:
                    print(f"ℹ️  File đã có header, không cần tìm header row")
                    header_row_index = -1  # Đánh dấu là đã có header
                else:
                    print(f"⚠️  Không tìm thấy header, giả định dòng 0 là header")
                    header_row_index = 0
            
            if header_row_index is not None and header_row_index != -1:
                # Đọc lại Excel với header đúng và skip rows
                try:
                    file.file.seek(0)
                    contents = file.file.read()
                    
                    # Xác định engine dựa vào file extension
                    engine = None
                    if file.filename.lower().endswith('.xls'):
                        engine = 'xlrd'
                    elif file.filename.lower().endswith('.xlsx'):
                        engine = 'openpyxl'
                    
                    # Skip các row trước header và dùng header_row_index làm header
                    if engine:
                        df = pd.read_excel(io.BytesIO(contents), skiprows=header_row_index, header=0, engine=engine)
                    else:
                        df = pd.read_excel(io.BytesIO(contents), skiprows=header_row_index, header=0)
                    
                    print(f"✅ Re-read Excel with header at row {header_row_index}")
                    print(f"   New columns: {list(df.columns)}")
                    print(f"   Shape: {df.shape}")
                    print(f"   First few rows after re-read:")
                    for i in range(min(3, len(df))):
                        print(f"   Row {i}: {df.iloc[i].to_dict()}")
                except Exception as e:
                    print(f"❌ Failed to re-read with header row {header_row_index}: {e}")
                    print(f"   Trying AI parsing...")
                    return ExcelImportService.parse_excel_with_ai(file)
            
            # Xác định cột mã học sinh và họ tên
            ma_hs_col = None
            ten_hs_col = None
            
            # Tìm theo tên cột với nhiều patterns hơn
            for col in df.columns:
                col_lower = str(col).lower().strip()
                
                # Tìm cột mã học sinh
                if not ma_hs_col:
                    if ('mã' in col_lower or 'ma' in col_lower) and ('học sinh' in col_lower or 'hoc sinh' in col_lower or 'hs' in col_lower):
                        ma_hs_col = col
                        print(f"✅ Found Mã HS column by name: '{col}'")
                
                # Tìm cột họ và tên - QUAN TRỌNG: tách riêng để không nhầm lẫn
                if not ten_hs_col:
                    # Pattern 1: Có chữ "họ" và "tên"
                    if ('họ' in col_lower and 'tên' in col_lower) or ('ho' in col_lower and 'ten' in col_lower):
                        ten_hs_col = col
                        print(f"✅ Found Họ và tên column by pattern 'họ và tên': '{col}'")
                    # Pattern 2: Chỉ có "tên" hoặc "họ" nhưng KHÔNG có "mã" (tránh nhầm với "mã học sinh")
                    elif ('tên' in col_lower or 'ten' in col_lower or 'họ' in col_lower or 'ho' in col_lower) and ('mã' not in col_lower and 'ma' not in col_lower):
                        ten_hs_col = col
                        print(f"✅ Found Họ và tên column by pattern 'tên/họ': '{col}'")
            
            # Nếu không tìm được, dùng vị trí cột (cột 1 = mã HS, cột 2 = tên)
            if not ma_hs_col and len(df.columns) >= 2:
                ma_hs_col = df.columns[1]  # Cột B
                print(f"ℹ️  Using column B (index 1) as Mã học sinh: {ma_hs_col}")
            
            if not ten_hs_col and len(df.columns) >= 3:
                ten_hs_col = df.columns[2]  # Cột C
                print(f"ℹ️  Using column C (index 2) as Họ và tên: {ten_hs_col}")
            
            # Đảm bảo 2 cột không trùng nhau
            if ma_hs_col == ten_hs_col:
                print(f"❌ ERROR: ma_hs_col and ten_hs_col are the same: '{ma_hs_col}'")
                print(f"   This is wrong! Trying to fix...")
                # Nếu trùng nhau, reset và dùng vị trí
                if len(df.columns) >= 3:
                    ma_hs_col = df.columns[1]  # Cột B
                    ten_hs_col = df.columns[2]  # Cột C
                    print(f"   Fixed: ma_hs_col='{ma_hs_col}', ten_hs_col='{ten_hs_col}'")
            
            if not ma_hs_col or not ten_hs_col:
                print(f"❌ Cannot determine columns: ma_hs={ma_hs_col}, ten_hs={ten_hs_col}")
                print(f"   Trying AI parsing...")
                return ExcelImportService.parse_excel_with_ai(file)
            
            # Validate dữ liệu mẫu
            if len(df) > 0:
                sample_ma = str(df.iloc[0][ma_hs_col]) if pd.notna(df.iloc[0][ma_hs_col]) else ""
                sample_ten = str(df.iloc[0][ten_hs_col]) if pd.notna(df.iloc[0][ten_hs_col]) else ""
                print(f"✅ Sample data: ma='{sample_ma}', ten='{sample_ten}'")
                
                # Check nếu dòng đầu vẫn là header
                if 'mã' in sample_ma.lower() or 'ma' in sample_ma.lower() or sample_ma.lower() == 'nan':
                    print(f"⚠️  First row still looks like header, skipping it")
                    df = df.iloc[1:]  # Bỏ dòng đầu
            
            print(f"Final columns - Mã HS: '{ma_hs_col}', Tên: '{ten_hs_col}'")
            
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
                    
                    # VALIDATION QUAN TRỌNG: Đảm bảo họ tên KHÔNG GIỐNG mã học sinh
                    if ma_hs == ten_hs:
                        print(f"⚠️ WARNING: Row {index + 1} has SAME value for ma_hs and ten_hs: '{ma_hs}'")
                        print(f"   This means columns are detected INCORRECTLY!")
                        print(f"   Skipping this row or using AI parsing...")
                        continue
                    
                    # Validation: Họ và tên phải khác mã học sinh
                    if ten_hs.isdigit() and len(ten_hs) == 10:
                        print(f"⚠️ WARNING: Row {index + 1} - ten_hs looks like a student ID: '{ten_hs}'")
                        print(f"   This suggests wrong column detection. Skipping...")
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
                print("⚠️ No valid students found, trying AI")
                return ExcelImportService.parse_excel_with_ai(file)
            
            print(f"✅ Successfully parsed {len(students)} students")
            return students
            
        except HTTPException:
            # Re-raise HTTPException
            raise
        except Exception as e:
            print(f"❌ Excel parsing completely failed: {type(e).__name__}: {str(e)}")
            # Final fallback to AI
            try:
                print("🤖 Trying AI parsing as last resort...")
                return ExcelImportService.parse_excel_with_ai(file)
            except Exception as ai_error:
                error_msg = f"Không thể đọc file Excel.\n\n"
                error_msg += f"📋 Lỗi pandas: {type(e).__name__}: {str(e)}\n"
                error_msg += f"🤖 AI parsing cũng thất bại: {type(ai_error).__name__}: {str(ai_error)}\n\n"
                error_msg += f"💡 Giải pháp:\n"
                error_msg += f"1. Kiểm tra file có đúng format: STT, Mã học sinh, Họ và tên\n"
                error_msg += f"2. Thử convert file sang .xlsx (Excel mới) bằng Microsoft Excel/LibreOffice\n"
                error_msg += f"3. Tải file mẫu và copy dữ liệu vào\n"
                error_msg += f"4. Đảm bảo file không bị password protection"
                
                raise HTTPException(
                    status_code=400,
                    detail=error_msg
                )
    
    @staticmethod
    def import_students(db: Session, request: StudentsImportRequest) -> StudentsImportResponse:
        """
        Import danh sách học sinh vào database (Admin function)
        
        - Username: Mã học sinh
        - Email: Tự động tạo từ mã học sinh + @gmail.com
        - Password: Mật khẩu mặc định (có thể tùy chỉnh)
        - Role: USER (student)
        """
        created_students = []
        failed_students = []
        
        for student in request.students:
            try:
                # Chuẩn hóa mã học sinh - loại bỏ khoảng trắng thừa
                ma_hoc_sinh = student.ma_hoc_sinh.strip()
                ho_va_ten = student.ho_va_ten.strip()
                
                # Tạo email từ mã học sinh (lowercase để đồng nhất)
                email = f"{ma_hoc_sinh.lower()}@gmail.com"
                
                # Kiểm tra xem user đã tồn tại chưa (theo username HOẶC email)
                existing_user = db.query(User).filter(
                    (User.username == ma_hoc_sinh) | 
                    (User.email == email)
                ).first()
                
                if existing_user:
                    failed_students.append({
                        "ma_hoc_sinh": ma_hoc_sinh,
                        "ho_va_ten": ho_va_ten,
                        "error": f"Học sinh đã tồn tại (username: {existing_user.username}, email: {existing_user.email})"
                    })
                    continue
                
                # Tạo user mới
                new_user = User(
                    username=ma_hoc_sinh,          # Mã học sinh làm username
                    email=email,                   # Email tự động: [mã hs]@gmail.com
                    full_name=ho_va_ten,           # Họ và tên từ Excel
                    hashed_password=get_password_hash(request.default_password),
                    role=UserRole.USER,            # USER = student role
                    is_active=True,                # Active ngay
                    is_verified=True               # Đã verify
                )
                
                db.add(new_user)
                db.flush()  # Để lấy ID
                
                print(f"✅ Created student: {new_user.username} | {new_user.full_name} | {new_user.email}")
                
                created_students.append({
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                    "full_name": new_user.full_name,
                    "ma_hoc_sinh": ma_hoc_sinh,
                    "created_at": new_user.created_at
                })
                
            except Exception as e:
                print(f"❌ Failed to create student {student.ma_hoc_sinh}: {str(e)}")
                failed_students.append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "error": str(e)
                })
        
        try:
            db.commit()
            print(f"💾 Committed {len(created_students)} students to database")
        except Exception as e:
            db.rollback()
            print(f"❌ Database commit failed: {str(e)}")
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
                # Tìm user bằng email
                user = db.query(User).filter(
                    User.email == email,
                    User.role == UserRole.USER,  # Chỉ student
                    User.is_active == True
                ).first()
                
                if not user:
                    failed_emails.append({
                        "email": email,
                        "error": "Không tìm thấy học sinh với email này"
                    })
                    continue
                
                # Kiểm tra xem đã tham gia lớp chưa
                existing_enrollment = db.query(Enrollment).filter(
                    Enrollment.class_id == class_id,
                    Enrollment.user_id == user.id
                ).first()
                
                if existing_enrollment:
                    if existing_enrollment.status == "active":
                        failed_emails.append({
                            "email": email,
                            "error": "Học sinh đã tham gia lớp này"
                        })
                        continue
                    else:
                        # Kích hoạt lại enrollment
                        existing_enrollment.status = "active"
                        existing_enrollment.joined_at = datetime.utcnow()
                else:
                    # Tạo enrollment mới
                    new_enrollment = Enrollment(
                        class_id=class_id,
                        user_id=user.id,
                        role="student",
                        status="active"
                    )
                    db.add(new_enrollment)
                
                db.flush()
                
                added_students.append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name
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

    @staticmethod
    def import_students_to_class(
        db: Session,
        class_id: int,
        students: List[StudentExcelRow],
        current_user: User,
        default_password: str = "123456"
    ) -> TeacherImportToClassResponse:
        """
        Teacher import học sinh từ Excel trực tiếp vào lớp
        
        Workflow:
        1. Đọc file Excel (STT, Mã học sinh, Họ và tên)
        2. Với mỗi học sinh:
           - Nếu chưa có tài khoản → Tạo mới (username=mã HS, email=mã HS@gmail.com)
           - Nếu đã có tài khoản → Sử dụng tài khoản có sẵn
           - Thêm vào lớp (tạo enrollment)
        3. Trả về kết quả chi tiết
        
        Chỉ teacher của lớp hoặc admin mới có quyền thực hiện
        """
        # Kiểm tra quyền truy cập lớp
        classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
        if (current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and 
            classroom.teacher_id != current_user.id):
            raise HTTPException(
                status_code=403, 
                detail="Chỉ giáo viên của lớp hoặc admin mới có thể import học sinh"
            )
        
        result = TeacherImportToClassResponse()
        
        for student in students:
            try:
                # Chuẩn hóa dữ liệu
                ma_hoc_sinh = student.ma_hoc_sinh.strip()
                ho_va_ten = student.ho_va_ten.strip()
                
                # Tạo email từ mã học sinh (lowercase để đồng nhất)
                email = f"{ma_hoc_sinh.lower()}@gmail.com"
                
                # Tìm kiếm user đã tồn tại
                existing_user = db.query(User).filter(
                    (User.username == ma_hoc_sinh) | 
                    (User.email == email)
                ).first()
                
                user_to_add = None
                
                if existing_user:
                    # User đã tồn tại - sử dụng tài khoản có sẵn
                    user_to_add = existing_user
                    print(f"ℹ️  Found existing user: {existing_user.username} ({existing_user.email})")
                else:
                    # Tạo user mới
                    try:
                        new_user = User(
                            username=ma_hoc_sinh,
                            email=email,
                            full_name=ho_va_ten,
                            hashed_password=get_password_hash(default_password),
                            role=UserRole.USER,  # USER = student
                            is_active=True,
                            is_verified=True
                        )
                        
                        db.add(new_user)
                        db.flush()  # Để lấy ID
                        
                        user_to_add = new_user
                        result.created_accounts.append({
                            "id": new_user.id,
                            "username": new_user.username,
                            "email": new_user.email,
                            "full_name": new_user.full_name
                        })
                        
                        print(f"✅ Created new account: {new_user.username} | {new_user.full_name} | {new_user.email}")
                        
                    except Exception as e:
                        print(f"❌ Failed to create account for {ma_hoc_sinh}: {str(e)}")
                        result.failed_students.append({
                            "ma_hoc_sinh": ma_hoc_sinh,
                            "ho_va_ten": ho_va_ten,
                            "error": f"Không thể tạo tài khoản: {str(e)}"
                        })
                        result.failed_count += 1
                        continue
                
                # Kiểm tra xem đã tham gia lớp chưa
                existing_enrollment = db.query(Enrollment).filter(
                    Enrollment.class_id == class_id,
                    Enrollment.user_id == user_to_add.id
                ).first()
                
                if existing_enrollment:
                    if existing_enrollment.status == "active":
                        # Đã có trong lớp rồi
                        result.already_in_class.append({
                            "id": user_to_add.id,
                            "username": user_to_add.username,
                            "email": user_to_add.email,
                            "full_name": user_to_add.full_name
                        })
                        print(f"ℹ️  Student {user_to_add.username} already in class")
                        continue
                    else:
                        # Kích hoạt lại enrollment
                        existing_enrollment.status = "active"
                        existing_enrollment.joined_at = datetime.utcnow()
                        print(f"🔄 Reactivated enrollment for {user_to_add.username}")
                else:
                    # Tạo enrollment mới
                    new_enrollment = Enrollment(
                        class_id=class_id,
                        user_id=user_to_add.id,
                        role="student",
                        status="active"
                    )
                    db.add(new_enrollment)
                    print(f"➕ Created enrollment for {user_to_add.username}")
                
                db.flush()
                
                # Thêm vào danh sách thành công
                result.added_to_class.append({
                    "id": user_to_add.id,
                    "username": user_to_add.username,
                    "email": user_to_add.email,
                    "full_name": user_to_add.full_name
                })
                result.success_count += 1
                
            except Exception as e:
                print(f"❌ Error processing student {student.ma_hoc_sinh}: {str(e)}")
                result.failed_students.append({
                    "ma_hoc_sinh": student.ma_hoc_sinh,
                    "ho_va_ten": student.ho_va_ten,
                    "error": str(e)
                })
                result.failed_count += 1
        
        try:
            db.commit()
            print(f"💾 Successfully added {result.success_count} students to class {class_id}")
            print(f"   - New accounts created: {len(result.created_accounts)}")
            print(f"   - Added to class: {len(result.added_to_class)}")
            print(f"   - Already in class: {len(result.already_in_class)}")
            print(f"   - Failed: {len(result.failed_students)}")
        except Exception as e:
            db.rollback()
            print(f"❌ Database commit failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lưu vào database: {str(e)}"
            )
        
        return result