"""
Export API endpoints for generating Excel/CSV/PDF reports
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
import io
from datetime import datetime, date
import csv

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.models.enrollment import Enrollment
from app.models.classroom import Classroom

router = APIRouter(prefix="/api/v1/exports", tags=["exports"])

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False
    print("Warning: openpyxl not installed. Excel export will not be available.")


def create_excel_workbook(title: str):
    """Create a new Excel workbook with styling"""
    wb = Workbook()
    ws = wb.active
    ws.title = title
    
    # Define styles
    header_font = Font(bold=True, size=12, color="FFFFFF")
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    return wb, ws, header_font, header_fill, header_alignment, border


def apply_header_style(ws, row: int, columns: List[str], header_font, header_fill, header_alignment, border):
    """Apply header styling to a row"""
    for col_idx, col_name in enumerate(columns, start=1):
        cell = ws.cell(row=row, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border


def auto_adjust_column_width(ws):
    """Auto-adjust column widths based on content"""
    for column in ws.columns:
        max_length = 0
        column_letter = get_column_letter(column[0].column)
        
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width


@router.get("/exercise/{exercise_id}/grades")
async def export_exercise_grades(
    exercise_id: int,
    format: str = Query("xlsx", regex="^(xlsx|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export grades for a single exercise
    
    - **exercise_id**: ID of the exercise
    - **format**: Export format (xlsx or csv)
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can export grades")
    
    # Get exercise
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Check if teacher owns this exercise
    if current_user.role == "teacher" and exercise.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to export this exercise")
    
    # Get all submissions for this exercise
    submissions = db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).all()
    
    # Get student info
    student_grades = []
    for sub in submissions:
        student = db.query(User).filter(User.id == sub.student_id).first()
        if student:
            student_grades.append({
                'student_id': student.id,
                'student_name': student.full_name,
                'student_email': student.email,
                'score': sub.score or 0,
                'max_score': sub.max_score or 100,
                'percentage': round((sub.score / sub.max_score * 100) if sub.max_score else 0, 2),
                'submitted_at': sub.submitted_at.strftime('%Y-%m-%d %H:%M') if sub.submitted_at else 'N/A',
                'status': 'Đã chấm' if sub.is_graded else 'Chưa chấm'
            })
    
    # Sort by student name
    student_grades.sort(key=lambda x: x['student_name'])
    
    if format == "xlsx":
        if not EXCEL_AVAILABLE:
            raise HTTPException(status_code=500, detail="Excel export not available. Please install openpyxl.")
        
        # Create Excel workbook
        wb, ws, header_font, header_fill, header_alignment, border = create_excel_workbook("Grades")
        
        # Add title
        ws.merge_cells('A1:H1')
        title_cell = ws['A1']
        title_cell.value = f"BẢNG ĐIỂM: {exercise.title}"
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal="center")
        
        # Add metadata
        ws['A2'] = f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        ws['A3'] = f"Giáo viên: {current_user.full_name}"
        ws['A4'] = f"Tổng số bài nộp: {len(student_grades)}"
        
        # Add headers
        headers = ['STT', 'Mã HS', 'Họ và tên', 'Email', 'Điểm', 'Tối đa', '%', 'Ngày nộp', 'Trạng thái']
        apply_header_style(ws, 6, headers, header_font, header_fill, header_alignment, border)
        
        # Add data
        for idx, grade in enumerate(student_grades, start=1):
            row = idx + 6
            ws.cell(row=row, column=1, value=idx)
            ws.cell(row=row, column=2, value=grade['student_id'])
            ws.cell(row=row, column=3, value=grade['student_name'])
            ws.cell(row=row, column=4, value=grade['student_email'])
            ws.cell(row=row, column=5, value=grade['score'])
            ws.cell(row=row, column=6, value=grade['max_score'])
            ws.cell(row=row, column=7, value=grade['percentage'])
            ws.cell(row=row, column=8, value=grade['submitted_at'])
            ws.cell(row=row, column=9, value=grade['status'])
            
            # Apply border to all cells
            for col in range(1, 10):
                ws.cell(row=row, column=col).border = border
        
        # Add summary
        summary_row = len(student_grades) + 8
        ws.cell(row=summary_row, column=3, value="Điểm trung bình:")
        ws.cell(row=summary_row, column=3).font = Font(bold=True)
        
        avg_score = sum(g['score'] for g in student_grades) / len(student_grades) if student_grades else 0
        ws.cell(row=summary_row, column=5, value=round(avg_score, 2))
        ws.cell(row=summary_row, column=5).font = Font(bold=True)
        
        # Auto-adjust columns
        auto_adjust_column_width(ws)
        
        # Save to BytesIO
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"diem_{exercise.title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # CSV format
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write title and metadata
        writer.writerow([f"BẢNG ĐIỂM: {exercise.title}"])
        writer.writerow([f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"])
        writer.writerow([f"Giáo viên: {current_user.full_name}"])
        writer.writerow([])
        
        # Write headers
        writer.writerow(['STT', 'Mã HS', 'Họ và tên', 'Email', 'Điểm', 'Tối đa', '%', 'Ngày nộp', 'Trạng thái'])
        
        # Write data
        for idx, grade in enumerate(student_grades, start=1):
            writer.writerow([
                idx,
                grade['student_id'],
                grade['student_name'],
                grade['student_email'],
                grade['score'],
                grade['max_score'],
                grade['percentage'],
                grade['submitted_at'],
                grade['status']
            ])
        
        # Write summary
        writer.writerow([])
        avg_score = sum(g['score'] for g in student_grades) / len(student_grades) if student_grades else 0
        writer.writerow(['', '', 'Điểm trung bình:', '', round(avg_score, 2)])
        
        filename = f"diem_{exercise.title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),  # utf-8-sig for Excel compatibility
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )


@router.get("/class/{class_id}/grades")
async def export_class_grades(
    class_id: int,
    format: str = Query("xlsx", regex="^(xlsx|csv)$"),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export all grades for a class
    
    - **class_id**: ID of the class
    - **format**: Export format (xlsx or csv)
    - **from_date**: Optional start date filter
    - **to_date**: Optional end date filter
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can export grades")
    
    # Get class
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if teacher owns this class
    if current_user.role == "teacher" and class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to export this class")
    
    # Get all students in class
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]
    
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    
    # Get all exercises assigned to this class
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id)
    
    # Apply date filters
    if from_date:
        exercises = exercises.filter(Exercise.created_at >= from_date)
    if to_date:
        exercises = exercises.filter(Exercise.created_at <= to_date)
    
    exercises = exercises.all()
    
    # Build grade matrix
    grade_data = []
    for student in students:
        row = {
            'student_id': student.id,
            'student_name': student.full_name,
            'student_email': student.email,
            'grades': {}
        }
        
        total_score = 0
        total_max = 0
        
        for exercise in exercises:
            submission = db.query(Submission).filter(
                and_(
                    Submission.student_id == student.id,
                    Submission.exercise_id == exercise.id
                )
            ).first()
            
            if submission and submission.is_graded:
                row['grades'][exercise.id] = {
                    'score': submission.score or 0,
                    'max_score': submission.max_score or 100
                }
                total_score += submission.score or 0
                total_max += submission.max_score or 100
            else:
                row['grades'][exercise.id] = None
        
        row['average'] = round((total_score / total_max * 100) if total_max > 0 else 0, 2)
        grade_data.append(row)
    
    # Sort by student name
    grade_data.sort(key=lambda x: x['student_name'])
    
    if format == "xlsx":
        if not EXCEL_AVAILABLE:
            raise HTTPException(status_code=500, detail="Excel export not available. Please install openpyxl.")
        
        wb, ws, header_font, header_fill, header_alignment, border = create_excel_workbook("Class Grades")
        
        # Title
        ws.merge_cells(f'A1:{get_column_letter(len(exercises) + 5)}1')
        title_cell = ws['A1']
        title_cell.value = f"BẢNG ĐIỂM LỚP: {class_obj.name}"
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal="center")
        
        # Metadata
        ws['A2'] = f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        ws['A3'] = f"Giáo viên: {current_user.full_name}"
        ws['A4'] = f"Tổng số học sinh: {len(students)}"
        ws['A5'] = f"Tổng số bài tập: {len(exercises)}"
        
        # Headers
        headers = ['STT', 'Mã HS', 'Họ và tên', 'Email']
        for ex in exercises:
            headers.append(f"{ex.title[:20]}...")  # Truncate long titles
        headers.append('Trung bình (%)')
        
        apply_header_style(ws, 7, headers, header_font, header_fill, header_alignment, border)
        
        # Data
        for idx, student_data in enumerate(grade_data, start=1):
            row = idx + 7
            ws.cell(row=row, column=1, value=idx)
            ws.cell(row=row, column=2, value=student_data['student_id'])
            ws.cell(row=row, column=3, value=student_data['student_name'])
            ws.cell(row=row, column=4, value=student_data['student_email'])
            
            col = 5
            for exercise in exercises:
                grade = student_data['grades'].get(exercise.id)
                if grade:
                    ws.cell(row=row, column=col, value=f"{grade['score']}/{grade['max_score']}")
                else:
                    ws.cell(row=row, column=col, value="-")
                col += 1
            
            ws.cell(row=row, column=col, value=student_data['average'])
            
            # Apply borders
            for c in range(1, col + 1):
                ws.cell(row=row, column=c).border = border
        
        auto_adjust_column_width(ws)
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"bangdiem_{class_obj.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([f"BẢNG ĐIỂM LỚP: {class_obj.name}"])
        writer.writerow([f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"])
        writer.writerow([])
        
        headers = ['STT', 'Mã HS', 'Họ và tên', 'Email']
        for ex in exercises:
            headers.append(ex.title)
        headers.append('Trung bình (%)')
        writer.writerow(headers)
        
        for idx, student_data in enumerate(grade_data, start=1):
            row = [idx, student_data['student_id'], student_data['student_name'], student_data['student_email']]
            
            for exercise in exercises:
                grade = student_data['grades'].get(exercise.id)
                if grade:
                    row.append(f"{grade['score']}/{grade['max_score']}")
                else:
                    row.append("-")
            
            row.append(student_data['average'])
            writer.writerow(row)
        
        filename = f"bangdiem_{class_obj.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )


@router.get("/class/{class_id}/students")
async def export_student_list(
    class_id: int,
    format: str = Query("xlsx", regex="^(xlsx|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export student list for a class
    
    - **class_id**: ID of the class
    - **format**: Export format (xlsx or csv)
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can export student lists")
    
    # Get class
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check permission
    if current_user.role == "teacher" and class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to export this class")
    
    # Get students
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).order_by(User.full_name).all()
    
    if format == "xlsx":
        if not EXCEL_AVAILABLE:
            raise HTTPException(status_code=500, detail="Excel export not available")
        
        wb, ws, header_font, header_fill, header_alignment, border = create_excel_workbook("Students")
        
        # Title
        ws.merge_cells('A1:F1')
        title_cell = ws['A1']
        title_cell.value = f"DANH SÁCH HỌC SINH - {class_obj.name}"
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal="center")
        
        ws['A2'] = f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        ws['A3'] = f"Giáo viên: {current_user.full_name}"
        ws['A4'] = f"Tổng số: {len(students)} học sinh"
        
        # Headers
        headers = ['STT', 'Mã HS', 'Họ và tên', 'Email', 'Số điện thoại', 'Trạng thái']
        apply_header_style(ws, 6, headers, header_font, header_fill, header_alignment, border)
        
        # Data
        for idx, student in enumerate(students, start=1):
            row = idx + 6
            ws.cell(row=row, column=1, value=idx)
            ws.cell(row=row, column=2, value=student.id)
            ws.cell(row=row, column=3, value=student.full_name)
            ws.cell(row=row, column=4, value=student.email)
            ws.cell(row=row, column=5, value=student.phone or "")
            ws.cell(row=row, column=6, value="Hoạt động" if student.is_active else "Không hoạt động")
            
            for col in range(1, 7):
                ws.cell(row=row, column=col).border = border
        
        auto_adjust_column_width(ws)
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"danhsach_{class_obj.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([f"DANH SÁCH HỌC SINH - {class_obj.name}"])
        writer.writerow([f"Ngày xuất: {datetime.now().strftime('%d/%m/%Y %H:%M')}"])
        writer.writerow([])
        
        writer.writerow(['STT', 'Mã HS', 'Họ và tên', 'Email', 'Số điện thoại', 'Trạng thái'])
        
        for idx, student in enumerate(students, start=1):
            writer.writerow([
                idx,
                student.id,
                student.full_name,
                student.email,
                student.phone or "",
                "Hoạt động" if student.is_active else "Không hoạt động"
            ])
        
        filename = f"danhsach_{class_obj.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
