import io
import json
import logging

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.excel_import import (
    AddStudentsToClassRequest,
    AddStudentsToClassResponse,
    StudentExcelRow,
    StudentsImportRequest,
    StudentsImportResponse,
    TeacherImportToClassResponse,
)

logger = logging.getLogger(__name__)


class ExcelImportService:

    @staticmethod
    def parse_excel_with_ai(file: UploadFile) -> list[StudentExcelRow]:
        """AI đơn giản - chỉ lấy mã học sinh và tên"""
        try:
            from openai import OpenAI

            # Reset file position
            file.file.seek(0)
            contents = file.file.read()

            # Đọc raw Excel content - đọc TẤT CẢ dữ liệu
            try:
                df_raw = pd.read_excel(io.BytesIO(contents), header=None)
                excel_text = df_raw.to_string(index=False, header=False)  # Đọc TẤT CẢ
                logger.info(f"📄 Excel text length: {len(excel_text)} chars")
                logger.info(f"First 500 chars: {excel_text[:500]}")
            except Exception as parse_err:
                logger.info(f"⚠️ Pandas parse error: {parse_err}")
                excel_text = f"File size: {len(contents)} bytes"

            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Từ dữ liệu Excel này, hãy trích xuất TẤT CẢ MÃ HỌC SINH và TÊN HỌC SINH:

{excel_text}

QUAN TRỌNG:
- Tìm dòng header có "STT", "Mã học sinh", "Họ và tên", "Ngày sinh"
- Bỏ qua các dòng header, title như "ỦY BAN NHÂN DÂN", "TRƯỜNG TIỂU HỌC", "DANH SÁCH HỌC SINH"
- Lấy TẤT CẢ các dòng có mã học sinh (thường là 10 chữ số) và tên thật của học sinh
- Mã học sinh VÍ DỤ: 2102150966, 2102150967, 2200157681, 2506716807, etc.
- Tên học sinh: Bàn Thảo An, Dương Tuệ Anh, Lê Duy Quang Anh, etc.
- PHẢI trả về TẤT CẢ học sinh trong file, không được bỏ sót

Ví dụ output mong muốn:
{{
  "students": [
    {{"ma_hoc_sinh": "2102150966", "ho_va_ten": "Bàn Thảo An"}},
    {{"ma_hoc_sinh": "2102150967", "ho_va_ten": "Dương Tuệ Anh"}},
    {{"ma_hoc_sinh": "2102150968", "ho_va_ten": "Lê Duy Quang Anh"}},
    ... (TẤT CẢ học sinh còn lại)
  ]
}}

CHỈ trả về JSON với array "students", không giải thích gì thêm."""
                    }
                ],
                max_tokens=3000,
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
            logger.info(f"AI parsing failed: {e}")
            # Throw error thay vì tạo fake data
            raise HTTPException(
                status_code=400,
                detail=f"AI parsing thất bại: {str(e)}. Vui lòng kiểm tra format file Excel."
            )

    @staticmethod
    def parse_excel_file(file: UploadFile) -> list[StudentExcelRow]:
        """Parse file Excel để lấy danh sách học sinh - AI FIRST APPROACH"""
        logger.info(f"🤖 Using AI to parse Excel file: {file.filename}")

        # Try AI parsing first - more reliable for Vietnamese text
        try:
            return ExcelImportService.parse_excel_with_ai(file)
        except Exception as ai_error:
            logger.info(f"⚠️ AI parsing failed: {ai_error}, falling back to pandas...")

        # Fallback to pandas if AI fails
        try:
            # Reset file position
            file.file.seek(0)
            contents = file.file.read()

            logger.info(f"📄 Reading Excel file: {file.filename}, size: {len(contents)} bytes")

            # Try reading with openpyxl first (most common for .xlsx)
            df = None

            try:
                df = pd.read_excel(io.BytesIO(contents), engine='openpyxl', header=None)
                logger.info("✅ Successfully read with openpyxl")
            except Exception as e1:
                logger.info(f"❌ openpyxl failed: {e1}")
                str(e1)

                try:
                    df = pd.read_excel(io.BytesIO(contents), engine='xlrd', header=None)
                    logger.info("✅ Successfully read with xlrd")
                except Exception as e2:
                    logger.info(f"❌ xlrd also failed: {e2}")
                    # Fallback to AI parsing
                    logger.info("🤖 Trying AI parsing as last resort...")
                    return ExcelImportService.parse_excel_with_ai(file)

            if df is None or df.empty:
                raise HTTPException(status_code=400, detail="File Excel rỗng hoặc không đọc được")

            logger.info(f"📊 DataFrame shape: {df.shape}")
            logger.info("First 5 rows (raw):")
            logger.info(df.head().to_string())

            # SIMPLIFIED APPROACH: Tìm header row và data rows
            header_row_index = None

            # Scan qua các dòng để tìm header
            for idx in range(min(20, len(df))):  # Check first 20 rows only
                row = df.iloc[idx]
                row_str = ' '.join([str(v).lower() for v in row.values if pd.notna(v)])

                # Check if this row contains header keywords
                if ('mã' in row_str or 'ma' in row_str) and \
                   ('học sinh' in row_str or 'hoc sinh' in row_str or 'hs' in row_str) and \
                   ('họ' in row_str or 'ho' in row_str or 'tên' in row_str or 'ten' in row_str):
                    header_row_index = idx
                    logger.info(f"✅ Found header at row {idx}: {row.values}")
                    break

            if header_row_index is None:
                logger.info("⚠️ No clear header found, assuming row 0 is header")
                header_row_index = 0

            # Re-read with correct header
            try:
                df = pd.read_excel(io.BytesIO(contents), skiprows=header_row_index, header=0)
                logger.info(f"✅ Re-read with header row {header_row_index}")
                logger.info(f"Columns after re-read: {list(df.columns)}")
            except Exception as e:
                logger.info(f"❌ Failed to re-read: {e}")
                # Keep original df

            # FIND COLUMNS - Try multiple strategies
            ma_hs_col = None
            ten_hs_col = None

            # Strategy 1: Exact column name match
            for col in df.columns:
                col_str = str(col).lower().strip()
                if not ma_hs_col and ('mã' in col_str or 'ma' in col_str) and ('học' in col_str or 'hoc' in col_str or 'hs' in col_str):
                    ma_hs_col = col
                    logger.info(f"✅ Found student ID column: '{col}'")
                if not ten_hs_col and ('họ' in col_str or 'ho' in col_str or 'tên' in col_str or 'ten' in col_str or 'name' in col_str):
                    ten_hs_col = col
                    logger.info(f"✅ Found name column: '{col}'")

            # Strategy 2: Positional - assume standard format [STT, MaHS, Ten, NgaySinh]
            if not ma_hs_col or not ten_hs_col:
                logger.info("⚠️ Using positional strategy...")
                if len(df.columns) >= 3:
                    ma_hs_col = df.columns[1]  # 2nd column
                    ten_hs_col = df.columns[2]  # 3rd column
                    logger.info(f"Using columns by position: ID={ma_hs_col}, Name={ten_hs_col}")
                elif len(df.columns) >= 2:
                    ma_hs_col = df.columns[0]
                    ten_hs_col = df.columns[1]
                    logger.info(f"Using first 2 columns: ID={ma_hs_col}, Name={ten_hs_col}")
                else:
                    logger.info("❌ Not enough columns, trying AI...")
                    return ExcelImportService.parse_excel_with_ai(file)

            # PARSE ROWS
            students = []
            skipped = 0

            for idx, row in df.iterrows():
                try:
                    # Get values
                    ma_hs_raw = row[ma_hs_col] if pd.notna(row[ma_hs_col]) else ""
                    ten_hs_raw = row[ten_hs_col] if pd.notna(row[ten_hs_col]) else ""

                    ma_hs = str(ma_hs_raw).strip()
                    ten_hs = str(ten_hs_raw).strip()

                    # Skip empty or invalid rows
                    if not ma_hs or not ten_hs or ma_hs == 'nan' or ten_hs == 'nan':
                        skipped += 1
                        continue

                    # Skip if looks like header text
                    ma_lower = ma_hs.lower()
                    ten_lower = ten_hs.lower()

                    skip_keywords = ['mã', 'ma', 'stt', 'học sinh', 'hoc sinh', 'student', 'id',
                                    'họ', 'ho', 'tên', 'ten', 'name', 'full']

                    if any(kw in ma_lower for kw in skip_keywords) or \
                       any(kw in ten_lower for kw in skip_keywords):
                        skipped += 1
                        continue

                    # Valid student row
                    student = StudentExcelRow(
                        stt=len(students) + 1,
                        ma_hoc_sinh=ma_hs,
                        ho_va_ten=ten_hs,
                        ngay_sinh=None
                    )
                    students.append(student)

                    if len(students) <= 5:  # Log first 5
                        logger.info(f"  ✅ Student {len(students)}: {ma_hs} - {ten_hs}")

                except Exception as e:
                    logger.info(f"  ⚠️ Error parsing row {idx}: {e}")
                    skipped += 1
                    continue

            logger.info(f"📊 Parsing complete: {len(students)} students found, {skipped} rows skipped")

            if not students:
                logger.info("❌ No students found, trying AI parsing...")
                return ExcelImportService.parse_excel_with_ai(file)

            return students

        except Exception as e:
            logger.info(f"Excel parsing completely failed: {e}")
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

                logger.info(f"Created user: {new_user.username} | {new_user.full_name} | {new_user.email}")

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
        students: list[StudentExcelRow],
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

        created_accounts = []  # Tài khoản mới tạo
        added_to_class = []    # Tài khoản đã tồn tại, được thêm vào lớp
        already_in_class = []  # Đã có trong lớp
        failed_students = []   # Thất bại

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
                    # User đã tồn tại, kiểm tra đã có trong lớp chưa
                    existing_enrollment = db.query(Enrollment).filter(
                        Enrollment.user_id == existing_user.id,
                        Enrollment.class_id == class_id
                    ).first()

                    if existing_enrollment:
                        # Đã có trong lớp rồi
                        already_in_class.append({
                            "id": existing_user.id,
                            "username": existing_user.username,
                            "email": existing_user.email,
                            "full_name": existing_user.full_name,
                            "ma_hoc_sinh": student.ma_hoc_sinh,
                            "ho_va_ten": student.ho_va_ten
                        })
                        continue

                    # Thêm vào lớp
                    enrollment = Enrollment(
                        user_id=existing_user.id,
                        class_id=class_id,
                        role="student",
                        status="active"
                    )
                    db.add(enrollment)

                    added_to_class.append({
                        "id": existing_user.id,
                        "username": existing_user.username,
                        "email": existing_user.email,
                        "full_name": existing_user.full_name,
                        "ma_hoc_sinh": student.ma_hoc_sinh,
                        "ho_va_ten": student.ho_va_ten
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
                        class_id=class_id,
                        role="student",
                        status="active"
                    )
                    db.add(enrollment)

                    created_accounts.append({
                        "id": new_user.id,
                        "username": new_user.username,
                        "email": new_user.email,
                        "full_name": new_user.full_name,
                        "ma_hoc_sinh": student.ma_hoc_sinh,
                        "ho_va_ten": student.ho_va_ten
                    })

                    logger.info(f"✅ Created: {new_user.username} ({new_user.email}) | {new_user.full_name}")

            except Exception as e:
                logger.info(f"❌ Failed to process student {student.ma_hoc_sinh}: {e}")
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

        # Tạo response object
        response = TeacherImportToClassResponse(
            class_id=class_id,
            success_count=len(created_accounts) + len(added_to_class),
            failed_count=len(failed_students),
            failed_students=failed_students,
            created_students=created_accounts  # Giữ tên này để backward compatible
        )
        response.created_accounts = created_accounts
        response.added_to_class = added_to_class
        response.already_in_class = already_in_class

        return response


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
                    Enrollment.class_id == class_id
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
                    class_id=class_id,
                    role="student",
                    status="active"
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
