"""
Error Analysis Export Router
API endpoints for exporting detailed error analysis reports in Excel format
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List, Dict, Any
import io
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.weekly_assessment import WeeklyAssessment, WeeklySubmission
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.weekly_assessment import ErrorAnalysisExportRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/error-analysis", tags=["Error Analysis Export"])

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Color
    from openpyxl.utils import get_column_letter
    from openpyxl.chart import BarChart, PieChart, Reference
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False
    logger.warning("openpyxl not installed. Excel export will not be available.")


def create_beautiful_excel_workbook(title: str):
    """Create a beautifully styled Excel workbook"""
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]  # Excel limit is 31 chars
    
    # Define beautiful styles
    # Header style (gradient blue-purple)
    header_font = Font(bold=True, size=12, color="FFFFFF", name="Calibri")
    header_fill = PatternFill(start_color="5B9BD5", end_color="5B9BD5", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    # Title style
    title_font = Font(bold=True, size=16, color="2F5496", name="Calibri")
    title_alignment = Alignment(horizontal="center", vertical="center")
    
    # Subtitle style
    subtitle_font = Font(bold=False, size=10, color="5B9BD5", name="Calibri")
    
    # Data styles
    data_font = Font(size=10, name="Calibri")
    data_alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    
    # Score styles (good/warning/bad)
    good_fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid")  # Light green
    warning_fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")  # Light yellow
    bad_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")  # Light red
    
    # Border
    thin_border = Border(
        left=Side(style='thin', color="D0D0D0"),
        right=Side(style='thin', color="D0D0D0"),
        top=Side(style='thin', color="D0D0D0"),
        bottom=Side(style='thin', color="D0D0D0")
    )
    
    return (wb, ws, header_font, header_fill, header_alignment, title_font, 
            title_alignment, subtitle_font, data_font, data_alignment, 
            good_fill, warning_fill, bad_fill, thin_border)


def apply_beautiful_header(ws, row: int, columns: List[str], styles):
    """Apply beautiful header styling to a row"""
    header_font, header_fill, header_alignment, thin_border = styles
    
    for col_idx, col_name in enumerate(columns, start=1):
        cell = ws.cell(row=row, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border


def auto_adjust_column_width(ws, min_width=10, max_width=80):
    """Auto-adjust column widths based on content"""
    for column in ws.columns:
        max_length = 0
        column_letter = get_column_letter(column[0].column)
        
        for cell in column:
            try:
                if cell.value:
                    # Handle multi-line text
                    lines = str(cell.value).split('\n')
                    max_line_length = max(len(line) for line in lines) if lines else 0
                    if max_line_length > max_length:
                        max_length = max_line_length
            except:
                pass
        
        adjusted_width = min(max(max_length + 2, min_width), max_width)
        ws.column_dimensions[column_letter].width = adjusted_width


def get_error_category(error_type: str) -> str:
    """Categorize errors into Vietnamese categories"""
    categories = {
        'grammar': 'Ngữ pháp',
        'vocabulary': 'Từ vựng',
        'spelling': 'Chính tả',
        'pronunciation': 'Phát âm',
        'content': 'Nội dung',
        'structure': 'Cấu trúc',
        'comprehension': 'Đọc hiểu',
        'listening': 'Nghe hiểu',
        'fluency': 'Độ trôi chảy',
        'accuracy': 'Độ chính xác'
    }
    return categories.get(error_type.lower(), 'Khác')


@router.post("/export")
async def export_error_analysis(
    request: ErrorAnalysisExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export detailed error analysis report with beautiful Excel formatting
    Supports both weekly and exam assessments
    """
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Excel export not available. Please install openpyxl.")
    
    # Check permissions
    classroom = db.query(Classroom).filter(Classroom.id == request.class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")
    
    if current_user.role == UserRole.TEACHER and classroom.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    # Collect submissions based on assessment type
    submissions_data = []
    
    if request.assessment_type == "weekly":
        query = db.query(WeeklySubmission, User, WeeklyAssessment).join(
            User, User.id == WeeklySubmission.student_id
        ).join(
            WeeklyAssessment, WeeklyAssessment.id == WeeklySubmission.assessment_id
        ).filter(
            WeeklyAssessment.class_id == request.class_id,
            WeeklySubmission.status.in_(["submitted", "graded"])
        )
        
        if request.assessment_id:
            query = query.filter(WeeklySubmission.assessment_id == request.assessment_id)
        if request.student_id:
            query = query.filter(WeeklySubmission.student_id == request.student_id)
        if request.skill_type:
            query = query.filter(WeeklyAssessment.skill_type == request.skill_type)
        if request.week_number:
            query = query.filter(WeeklyAssessment.week_number == request.week_number)
        
        results = query.order_by(WeeklySubmission.submitted_at.desc()).all()
        
        for submission, student, assessment in results:
            submissions_data.append({
                'assessment_type': 'weekly',
                'assessment_title': assessment.title,
                'assessment_skill': assessment.skill_type,
                'assessment_week': assessment.week_number,
                'student_name': student.full_name or student.username,
                'student_email': student.email,
                'submission': submission
            })
    
    elif request.assessment_type == "exam":
        query = db.query(ExamSubmission, User, ExamAssessment).join(
            User, User.id == ExamSubmission.student_id
        ).join(
            ExamAssessment, ExamAssessment.id == ExamSubmission.exam_id
        ).filter(
            ExamAssessment.class_id == request.class_id,
            ExamSubmission.status.in_(["submitted", "graded", "pending_review"])
        )
        
        if request.assessment_id:
            query = query.filter(ExamSubmission.exam_id == request.assessment_id)
        if request.student_id:
            query = query.filter(ExamSubmission.student_id == request.student_id)
        if request.exam_type:
            query = query.filter(ExamAssessment.exam_type == request.exam_type)
        
        results = query.order_by(ExamSubmission.submitted_at.desc()).all()
        
        for submission, student, exam in results:
            submissions_data.append({
                'assessment_type': 'exam',
                'assessment_title': exam.title,
                'assessment_skill': exam.exam_type,
                'student_name': student.full_name or student.username,
                'student_email': student.email,
                'submission': submission
            })
    
    if not submissions_data:
        raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu")
    
    # Create beautiful Excel workbook
    styles = create_beautiful_excel_workbook("Phân tích lỗi")
    wb, ws = styles[0], styles[1]
    header_styles = (styles[2], styles[3], styles[4], styles[13])
    title_font, title_alignment, subtitle_font = styles[5], styles[6], styles[7]
    data_font, data_alignment = styles[8], styles[9]
    good_fill, warning_fill, bad_fill, thin_border = styles[10], styles[11], styles[12], styles[13]
    
    current_row = 1
    
    # ====== TITLE SECTION ======
    ws.merge_cells(f'A{current_row}:J{current_row}')
    title_cell = ws[f'A{current_row}']
    title_cell.value = f"📊 BÁO CÁO PHÂN TÍCH LỖI CHI TIẾT"
    title_cell.font = title_font
    title_cell.alignment = title_alignment
    ws.row_dimensions[current_row].height = 30
    current_row += 1
    
    # Subtitle
    ws.merge_cells(f'A{current_row}:J{current_row}')
    subtitle_cell = ws[f'A{current_row}']
    subtitle_cell.value = f"Lớp: {classroom.name} | Loại: {request.assessment_type.upper()}"
    subtitle_cell.font = subtitle_font
    subtitle_cell.alignment = title_alignment
    current_row += 2
    
    # Metadata
    ws[f'A{current_row}'] = "📅 Ngày xuất:"
    ws[f'B{current_row}'] = datetime.now().strftime('%d/%m/%Y %H:%M')
    ws[f'A{current_row}'].font = Font(bold=True, size=10)
    current_row += 1
    
    ws[f'A{current_row}'] = "👨‍🏫 Giáo viên:"
    ws[f'B{current_row}'] = current_user.full_name or current_user.username
    ws[f'A{current_row}'].font = Font(bold=True, size=10)
    current_row += 1
    
    ws[f'A{current_row}'] = "📝 Tổng số bài:"
    ws[f'B{current_row}'] = len(submissions_data)
    ws[f'A{current_row}'].font = Font(bold=True, size=10)
    current_row += 2
    
    # ====== SUMMARY STATISTICS ======
    ws.merge_cells(f'A{current_row}:J{current_row}')
    summary_cell = ws[f'A{current_row}']
    summary_cell.value = "📈 THỐNG KÊ TỔNG QUAN"
    summary_cell.font = Font(bold=True, size=12, color="2F5496")
    summary_cell.alignment = Alignment(horizontal="center")
    current_row += 1
    
    # Calculate statistics
    total_score = sum(s['submission'].score or 0 for s in submissions_data if s['submission'].score is not None)
    graded_count = sum(1 for s in submissions_data if s['submission'].score is not None)
    avg_score = (total_score / graded_count) if graded_count > 0 else 0
    max_score = max((s['submission'].score or 0 for s in submissions_data), default=0)
    min_score = min((s['submission'].score or 0 for s in submissions_data if s['submission'].score is not None), default=0)
    
    stats_headers = ['Chỉ số', 'Giá trị', 'Đánh giá']
    apply_beautiful_header(ws, current_row, stats_headers, header_styles)
    current_row += 1
    
    stats_data = [
        ('Điểm trung bình', f'{avg_score:.2f}/10', 'Tốt' if avg_score >= 7 else 'Trung bình' if avg_score >= 5 else 'Cần cải thiện'),
        ('Điểm cao nhất', f'{max_score:.2f}/10', ''),
        ('Điểm thấp nhất', f'{min_score:.2f}/10', ''),
        ('Số bài đã chấm', f'{graded_count}/{len(submissions_data)}', '')
    ]
    
    for stat_name, stat_value, assessment in stats_data:
        ws[f'A{current_row}'] = stat_name
        ws[f'B{current_row}'] = stat_value
        ws[f'C{current_row}'] = assessment
        
        # Apply coloring based on score
        if 'trung bình' in stat_name.lower():
            if avg_score >= 7:
                ws[f'C{current_row}'].fill = good_fill
            elif avg_score >= 5:
                ws[f'C{current_row}'].fill = warning_fill
            else:
                ws[f'C{current_row}'].fill = bad_fill
        
        for col in ['A', 'B', 'C']:
            ws[f'{col}{current_row}'].border = thin_border
            ws[f'{col}{current_row}'].font = data_font
        
        current_row += 1
    
    current_row += 2
    
    # ====== DETAILED ERROR ANALYSIS ======
    ws.merge_cells(f'A{current_row}:J{current_row}')
    detail_cell = ws[f'A{current_row}']
    detail_cell.value = "🔍 PHÂN TÍCH LỖI CHI TIẾT"
    detail_cell.font = Font(bold=True, size=12, color="2F5496")
    detail_cell.alignment = Alignment(horizontal="center")
    current_row += 1
    
    # Headers
    headers = ['STT', 'Học sinh', 'Bài kiểm tra', 'Điểm', 'AI Score', 'Lỗi chính', 'Phản hồi AI', 'Phản hồi GV', 'Gợi ý cải thiện', 'Ngày nộp']
    apply_beautiful_header(ws, current_row, headers, header_styles)
    current_row += 1
    
    # Data rows
    for idx, data in enumerate(submissions_data, start=1):
        submission = data['submission']
        
        # Extract error information
        errors = []
        suggestions = []
        
        if submission.error_analysis:
            if isinstance(submission.error_analysis, list):
                errors = submission.error_analysis
            elif isinstance(submission.error_analysis, dict):
                errors = submission.error_analysis.get('errors', [])
                suggestions = submission.error_analysis.get('suggestions', [])
        
        # Parse rubrics_scores for additional error info
        if submission.rubrics_scores and isinstance(submission.rubrics_scores, dict):
            auto_results = submission.rubrics_scores.get('auto_grade_results', {})
            for q_id, result in auto_results.items():
                if isinstance(result, dict) and not result.get('correct', True):
                    error_feedback = result.get('feedback', '')
                    if error_feedback and 'Sai' in error_feedback:
                        errors.append({
                            'error_type': 'wrong_answer',
                            'question_id': q_id,
                            'description': error_feedback
                        })
        
        # Compile error summary
        error_summary = []
        for error in errors[:5]:  # Top 5 errors
            if isinstance(error, dict):
                error_type = get_error_category(error.get('error_type', 'unknown'))
                description = error.get('description', '')
                error_summary.append(f"• {error_type}: {description[:100]}")
        
        error_text = '\n'.join(error_summary) if error_summary else "Không có lỗi đáng kể"
        
        # AI feedback
        ai_feedback_text = ""
        if submission.ai_feedback:
            if isinstance(submission.ai_feedback, str):
                ai_feedback_text = submission.ai_feedback[:200]
            elif isinstance(submission.ai_feedback, dict):
                ai_feedback_text = submission.ai_feedback.get('overall_comment', '')[:200]
        
        # Suggestions
        suggestion_text = '\n'.join(f"• {s}" for s in suggestions[:3]) if suggestions else "Không có gợi ý"
        
        # Score coloring
        score = submission.score or 0
        score_fill = good_fill if score >= 7 else (warning_fill if score >= 5 else bad_fill)
        
        # Write row
        row_data = [
            idx,
            data['student_name'],
            f"{data['assessment_title']}\n({data['assessment_skill']})",
            score,
            submission.ai_score or 0,
            error_text,
            ai_feedback_text or "Chưa có",
            submission.feedback or "Chưa có",
            suggestion_text,
            submission.submitted_at.strftime('%d/%m/%Y %H:%M') if submission.submitted_at else 'N/A'
        ]
        
        for col_idx, value in enumerate(row_data, start=1):
            cell = ws.cell(row=current_row, column=col_idx, value=value)
            cell.border = thin_border
            cell.font = data_font
            cell.alignment = data_alignment
            
            # Apply score coloring
            if col_idx == 4:  # Score column
                cell.fill = score_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")
        
        ws.row_dimensions[current_row].height = max(40, len(error_summary) * 15)
        current_row += 1
    
    current_row += 2
    
    # ====== RECOMMENDATIONS SECTION ======
    ws.merge_cells(f'A{current_row}:J{current_row}')
    rec_cell = ws[f'A{current_row}']
    rec_cell.value = "💡 KHUYẾN NGHỊ CẢI THIỆN"
    rec_cell.font = Font(bold=True, size=12, color="2F5496")
    rec_cell.alignment = Alignment(horizontal="center")
    current_row += 1
    
    # Analyze common errors
    error_frequency = {}
    for data in submissions_data:
        submission = data['submission']
        if submission.error_analysis:
            errors = submission.error_analysis if isinstance(submission.error_analysis, list) else submission.error_analysis.get('errors', [])
            for error in errors:
                if isinstance(error, dict):
                    error_type = get_error_category(error.get('error_type', 'unknown'))
                    error_frequency[error_type] = error_frequency.get(error_type, 0) + 1
    
    # Top 5 common errors
    top_errors = sorted(error_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
    
    if top_errors:
        ws[f'A{current_row}'] = "📌 Lỗi phổ biến nhất:"
        ws[f'A{current_row}'].font = Font(bold=True, size=10)
        current_row += 1
        
        for error_type, count in top_errors:
            ws[f'A{current_row}'] = f"  • {error_type}: {count} lần"
            current_row += 1
    
    current_row += 1
    ws[f'A{current_row}'] = "✅ Gợi ý cho giáo viên:"
    ws[f'A{current_row}'].font = Font(bold=True, size=10)
    current_row += 1
    
    recommendations = [
        "• Tập trung ôn luyện các dạng lỗi phổ biến nhất",
        "• Tổ chức buổi học bổ trợ cho học sinh có điểm dưới 5",
        "• Khuyến khích học sinh luyện tập thường xuyên",
        "• Cung cấp feedback cá nhân hóa cho từng học sinh"
    ]
    
    for rec in recommendations:
        ws[f'A{current_row}'] = rec
        current_row += 1
    
    # Auto-adjust columns
    auto_adjust_column_width(ws)
    
    # Set specific column widths
    ws.column_dimensions['A'].width = 8   # STT
    ws.column_dimensions['B'].width = 25  # Student name
    ws.column_dimensions['C'].width = 30  # Assessment
    ws.column_dimensions['D'].width = 10  # Score
    ws.column_dimensions['E'].width = 10  # AI Score
    ws.column_dimensions['F'].width = 40  # Errors
    ws.column_dimensions['G'].width = 40  # AI Feedback
    ws.column_dimensions['H'].width = 40  # Teacher Feedback
    ws.column_dimensions['I'].width = 40  # Suggestions
    ws.column_dimensions['J'].width = 18  # Date
    
    # Save to BytesIO
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    # Generate filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"Phan_Tich_Loi_{request.assessment_type}_{classroom.name}_{timestamp}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    )

