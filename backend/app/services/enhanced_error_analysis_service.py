"""
Enhanced Error Analysis Service
Provides detailed error analysis for 4-skill assessments with beautiful Excel export
"""
import pandas as pd
import numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.drawing.image import Image
from openpyxl.chart import BarChart, Reference
from io import BytesIO
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import math

from sqlalchemy.orm import Session
from app.models.enhanced_weekly_assessment import EnhancedWeeklyAssessment, EnhancedWeeklySubmission
from app.models.user import User
from app.models.classroom import Classroom
from app.services.openai_service import openai_service


class EnhancedErrorAnalysisService:
    """Enhanced error analysis service with beautiful Excel export"""
    
    def __init__(self):
        self.skill_colors = {
            'listening': 'FF6B6B',
            'reading': '4ECDC4', 
            'writing': 'FFE66D',
            'speaking': '95E1D3'
        }
        
        self.grade_colors = {
            'excellent': '2ECC71',  # Green
            'good': '3498DB',       # Blue
            'satisfactory': 'F39C12',  # Orange
            'needs_improvement': 'E74C3C'  # Red
        }

    async def generate_detailed_error_analysis(
        self,
        db: Session,
        class_id: int,
        assessment_type: Optional[str] = None,
        week_number: Optional[int] = None,
        semester_period: Optional[str] = None,
        student_id: Optional[int] = None,
        skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive error analysis"""
        
        # Build query
        query = db.query(
            EnhancedWeeklySubmission, 
            EnhancedWeeklyAssessment,
            User.full_name,
            User.username,
            User.email
        ).join(
            EnhancedWeeklyAssessment,
            EnhancedWeeklyAssessment.id == EnhancedWeeklySubmission.assessment_id
        ).join(
            User,
            User.id == EnhancedWeeklySubmission.student_id
        ).filter(
            EnhancedWeeklyAssessment.class_id == class_id,
            EnhancedWeeklySubmission.status == 'graded'
        )
        
        # Apply filters
        if assessment_type:
            query = query.filter(EnhancedWeeklyAssessment.assessment_type == assessment_type)
        if week_number:
            query = query.filter(EnhancedWeeklyAssessment.week_number == week_number)
        if semester_period:
            query = query.filter(EnhancedWeeklyAssessment.semester_period == semester_period)
        if student_id:
            query = query.filter(EnhancedWeeklySubmission.student_id == student_id)
            
        results = query.all()
        
        if not results:
            return {
                "message": "Không tìm thấy dữ liệu phù hợp",
                "total_submissions": 0
            }
        
        # Analyze data
        analysis = await self._analyze_submission_data(results, skills)
        return analysis

    async def _analyze_submission_data(
        self,
        results: List,
        skills_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Analyze submission data for error patterns"""
        
        skills_to_analyze = skills_filter or ['listening', 'reading', 'writing', 'speaking']
        
        analysis = {
            'overview': {
                'total_submissions': len(results),
                'analysis_date': datetime.now().isoformat(),
                'skills_analyzed': skills_to_analyze
            },
            'class_performance': {},
            'skill_analysis': {},
            'student_performance': {},
            'error_patterns': {},
            'recommendations': {}
        }
        
        # Class overall performance
        total_scores = []
        skill_scores = {skill: [] for skill in skills_to_analyze}
        
        for submission, assessment, student_name, username, email in results:
            # Overall score
            if submission.total_score is not None:
                total_scores.append(submission.total_score)
            
            # Skill scores
            for skill in skills_to_analyze:
                score = getattr(submission, f'{skill}_score', None)
                if score is not None:
                    skill_scores[skill].append(score)
        
        # Calculate class statistics
        if total_scores:
            analysis['class_performance'] = {
                'average_score': round(np.mean(total_scores), 2),
                'median_score': round(np.median(total_scores), 2),
                'highest_score': round(max(total_scores), 2),
                'lowest_score': round(min(total_scores), 2),
                'standard_deviation': round(np.std(total_scores), 2),
                'score_distribution': self._calculate_score_distribution(total_scores)
            }
        
        # Analyze each skill
        for skill in skills_to_analyze:
            if skill_scores[skill]:
                skill_analysis = await self._analyze_skill_performance(
                    skill, skill_scores[skill], results
                )
                analysis['skill_analysis'][skill] = skill_analysis
        
        # Individual student analysis
        student_data = {}
        for submission, assessment, student_name, username, email in results:
            if student_name not in student_data:
                student_data[student_name] = {
                    'username': username,
                    'email': email,
                    'submissions': [],
                    'total_assessments': 0,
                    'skills_performance': {skill: [] for skill in skills_to_analyze}
                }
            
            student_info = {
                'assessment_title': assessment.title,
                'assessment_type': assessment.assessment_type,
                'week_number': assessment.week_number,
                'total_score': submission.total_score,
                'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None
            }
            
            # Add skill scores
            for skill in skills_to_analyze:
                score = getattr(submission, f'{skill}_score', None)
                if score is not None:
                    student_info[f'{skill}_score'] = score
                    student_data[student_name]['skills_performance'][skill].append(score)
            
            student_data[student_name]['submissions'].append(student_info)
            student_data[student_name]['total_assessments'] += 1
        
        # Calculate student averages and trends
        for student_name, data in student_data.items():
            data['average_total_score'] = self._calculate_average([s['total_score'] for s in data['submissions'] if s['total_score'] is not None])
            
            for skill in skills_to_analyze:
                scores = data['skills_performance'][skill]
                if scores:
                    data['skills_performance'][skill] = {
                        'scores': scores,
                        'average': round(np.mean(scores), 2),
                        'trend': self._calculate_trend(scores),
                        'improvement_needed': np.mean(scores) < 70  # Threshold for improvement
                    }
        
        analysis['student_performance'] = student_data
        
        # Generate AI-powered recommendations
        analysis['recommendations'] = await self._generate_ai_recommendations(analysis)
        
        return analysis

    async def _analyze_skill_performance(
        self,
        skill: str,
        scores: List[float],
        results: List
    ) -> Dict[str, Any]:
        """Analyze specific skill performance"""
        
        if not scores:
            return {}
        
        skill_analysis = {
            'average_score': round(np.mean(scores), 2),
            'median_score': round(np.median(scores), 2),
            'highest_score': round(max(scores), 2),
            'lowest_score': round(min(scores), 2),
            'standard_deviation': round(np.std(scores), 2),
            'score_distribution': self._calculate_score_distribution(scores),
            'common_errors': [],
            'improvement_areas': []
        }
        
        # Analyze error patterns from submissions
        error_patterns = {}
        for submission, assessment, student_name, username, email in results:
            error_analysis = getattr(submission, f'{skill}_error_analysis', None)
            if error_analysis and isinstance(error_analysis, dict):
                for error_type, details in error_analysis.items():
                    if error_type not in error_patterns:
                        error_patterns[error_type] = []
                    error_patterns[error_type].append(details)
        
        # Summarize common errors
        for error_type, occurrences in error_patterns.items():
            if len(occurrences) >= 2:  # At least 2 students made this error
                skill_analysis['common_errors'].append({
                    'error_type': error_type,
                    'frequency': len(occurrences),
                    'percentage': round((len(occurrences) / len(scores)) * 100, 1)
                })
        
        # Sort errors by frequency
        skill_analysis['common_errors'].sort(key=lambda x: x['frequency'], reverse=True)
        
        return skill_analysis

    def _calculate_score_distribution(self, scores: List[float]) -> Dict[str, int]:
        """Calculate score distribution by grade ranges"""
        distribution = {
            'excellent': 0,      # 90-100
            'good': 0,          # 80-89
            'satisfactory': 0,   # 70-79
            'needs_improvement': 0  # 0-69
        }
        
        for score in scores:
            if score >= 90:
                distribution['excellent'] += 1
            elif score >= 80:
                distribution['good'] += 1
            elif score >= 70:
                distribution['satisfactory'] += 1
            else:
                distribution['needs_improvement'] += 1
        
        return distribution

    def _calculate_average(self, values: List[Optional[float]]) -> Optional[float]:
        """Calculate average of non-null values"""
        filtered_values = [v for v in values if v is not None]
        return round(np.mean(filtered_values), 2) if filtered_values else None

    def _calculate_trend(self, scores: List[float]) -> str:
        """Calculate performance trend"""
        if len(scores) < 2:
            return "insufficient_data"
        
        # Simple linear regression to determine trend
        x = list(range(len(scores)))
        slope = np.polyfit(x, scores, 1)[0]
        
        if slope > 2:
            return "improving"
        elif slope < -2:
            return "declining"
        else:
            return "stable"

    async def _generate_ai_recommendations(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered recommendations"""
        
        # Prepare data for AI analysis
        summary = {
            'class_average': analysis['class_performance'].get('average_score', 0),
            'skill_performance': {},
            'common_issues': []
        }
        
        for skill, skill_data in analysis['skill_analysis'].items():
            summary['skill_performance'][skill] = {
                'average': skill_data.get('average_score', 0),
                'common_errors': skill_data.get('common_errors', [])[:3]  # Top 3 errors
            }
        
        try:
            # Generate recommendations using OpenAI
            prompt = f"""
            Analyze this English class assessment data and provide specific recommendations:
            
            Class Performance Summary:
            {json.dumps(summary, indent=2)}
            
            Please provide:
            1. Overall class strengths and weaknesses
            2. Specific skill-based recommendations for improvement
            3. Targeted teaching strategies for common error patterns
            4. Individual student support suggestions
            5. Assessment design improvements
            
            Format your response as structured recommendations in Vietnamese.
            """
            
            response = await openai_service.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model="gpt-5-nano"
            )
            
            return {
                'ai_generated': True,
                'recommendations_text': response,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'ai_generated': False,
                'error': str(e),
                'fallback_recommendations': self._generate_fallback_recommendations(analysis)
            }

    def _generate_fallback_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate basic recommendations when AI is unavailable"""
        recommendations = []
        
        class_avg = analysis['class_performance'].get('average_score', 0)
        
        if class_avg < 70:
            recommendations.append("Lớp học cần tăng cường luyện tập tổng thể các kỹ năng")
        elif class_avg > 85:
            recommendations.append("Lớp học có kết quả tốt, có thể tăng độ khó của bài kiểm tra")
        
        for skill, skill_data in analysis['skill_analysis'].items():
            skill_avg = skill_data.get('average_score', 0)
            if skill_avg < 75:
                recommendations.append(f"Cần tăng cường luyện tập kỹ năng {skill}")
        
        return recommendations

    async def export_to_excel(
        self,
        analysis: Dict[str, Any],
        class_info: Dict[str, Any]
    ) -> BytesIO:
        """Export error analysis to beautiful Excel file"""
        
        wb = Workbook()
        
        # Remove default sheet
        wb.remove(wb.active)
        
        # Create sheets
        self._create_overview_sheet(wb, analysis, class_info)
        self._create_class_performance_sheet(wb, analysis)
        self._create_skill_analysis_sheet(wb, analysis)
        self._create_student_details_sheet(wb, analysis)
        self._create_recommendations_sheet(wb, analysis)
        
        # Save to BytesIO
        excel_buffer = BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)
        
        return excel_buffer

    def _create_overview_sheet(self, wb: Workbook, analysis: Dict[str, Any], class_info: Dict[str, Any]):
        """Create overview sheet with summary information"""
        ws = wb.create_sheet("Tổng quan", 0)
        
        # Title
        ws['A1'] = "BÁO CÁO PHÂN TÍCH LỖI CHI TIẾT"
        ws['A1'].font = Font(name='Arial', size=16, bold=True, color='2C3E50')
        ws.merge_cells('A1:F1')
        ws['A1'].alignment = Alignment(horizontal='center')
        
        # Class information
        row = 3
        ws[f'A{row}'] = "Thông tin lớp học:"
        ws[f'A{row}'].font = Font(bold=True, size=12)
        
        class_data = [
            ("Tên lớp:", class_info.get('class_name', 'N/A')),
            ("Giáo viên:", class_info.get('teacher_name', 'N/A')),
            ("Tổng số học sinh:", len(analysis.get('student_performance', {}))),
            ("Ngày phân tích:", datetime.now().strftime("%d/%m/%Y %H:%M")),
            ("Kỹ năng được phân tích:", ", ".join(analysis['overview'].get('skills_analyzed', [])))
        ]
        
        for label, value in class_data:
            row += 1
            ws[f'A{row}'] = label
            ws[f'B{row}'] = value
            ws[f'A{row}'].font = Font(bold=True)
        
        # Performance summary
        row += 2
        ws[f'A{row}'] = "Tóm tắt kết quả:"
        ws[f'A{row}'].font = Font(bold=True, size=12)
        
        class_perf = analysis.get('class_performance', {})
        summary_data = [
            ("Điểm trung bình lớp:", f"{class_perf.get('average_score', 0)}/100"),
            ("Điểm cao nhất:", f"{class_perf.get('highest_score', 0)}/100"),
            ("Điểm thấp nhất:", f"{class_perf.get('lowest_score', 0)}/100"),
            ("Độ lệch chuẩn:", class_perf.get('standard_deviation', 0))
        ]
        
        for label, value in summary_data:
            row += 1
            ws[f'A{row}'] = label
            ws[f'B{row}'] = value
            ws[f'A{row}'].font = Font(bold=True)

    def _create_class_performance_sheet(self, wb: Workbook, analysis: Dict[str, Any]):
        """Create class performance analysis sheet"""
        ws = wb.create_sheet("Kết quả lớp học")
        
        # Title
        ws['A1'] = "PHÂN TÍCH KỀT QUẢ LỚP HỌC"
        ws['A1'].font = Font(name='Arial', size=14, bold=True)
        ws.merge_cells('A1:E1')
        ws['A1'].alignment = Alignment(horizontal='center')
        
        # Score distribution table
        row = 3
        ws[f'A{row}'] = "Phân bố điểm số:"
        ws[f'A{row}'].font = Font(bold=True, size=12)
        
        # Headers
        headers = ["Mức độ", "Khoảng điểm", "Số học sinh", "Tỷ lệ (%)"]
        row += 1
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=row, column=col, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color='3498DB', end_color='3498DB', fill_type='solid')
            cell.alignment = Alignment(horizontal='center')
        
        # Distribution data
        distribution = analysis['class_performance'].get('score_distribution', {})
        total_students = sum(distribution.values())
        
        dist_data = [
            ("Xuất sắc", "90-100", distribution.get('excellent', 0)),
            ("Tốt", "80-89", distribution.get('good', 0)),
            ("Khá", "70-79", distribution.get('satisfactory', 0)),
            ("Cần cải thiện", "0-69", distribution.get('needs_improvement', 0))
        ]
        
        for level, range_str, count in dist_data:
            row += 1
            percentage = round((count / total_students * 100), 1) if total_students > 0 else 0
            
            ws.cell(row=row, column=1, value=level)
            ws.cell(row=row, column=2, value=range_str)
            ws.cell(row=row, column=3, value=count)
            ws.cell(row=row, column=4, value=f"{percentage}%")
            
            # Color code based on performance level
            color = self.grade_colors.get(list(distribution.keys())[dist_data.index((level, range_str, count))], 'FFFFFF')
            for col in range(1, 5):
                ws.cell(row=row, column=col).fill = PatternFill(start_color=color, end_color=color, fill_type='solid')

    def _create_skill_analysis_sheet(self, wb: Workbook, analysis: Dict[str, Any]):
        """Create detailed skill analysis sheet"""
        ws = wb.create_sheet("Phân tích kỹ năng")
        
        # Title
        ws['A1'] = "PHÂN TÍCH CHI TIẾT THEO KỸ NĂNG"
        ws['A1'].font = Font(name='Arial', size=14, bold=True)
        ws.merge_cells('A1:G1')
        ws['A1'].alignment = Alignment(horizontal='center')
        
        row = 3
        for skill, skill_data in analysis.get('skill_analysis', {}).items():
            # Skill header
            skill_name = {
                'listening': 'Nghe',
                'reading': 'Đọc',
                'writing': 'Viết',
                'speaking': 'Nói'
            }.get(skill, skill.title())
            
            ws[f'A{row}'] = f"Kỹ năng {skill_name}:"
            ws[f'A{row}'].font = Font(bold=True, size=12)
            ws[f'A{row}'].fill = PatternFill(start_color=self.skill_colors[skill], end_color=self.skill_colors[skill], fill_type='solid')
            
            # Statistics
            row += 1
            stats = [
                ("Điểm trung bình:", skill_data.get('average_score', 0)),
                ("Điểm cao nhất:", skill_data.get('highest_score', 0)),
                ("Điểm thấp nhất:", skill_data.get('lowest_score', 0))
            ]
            
            for i, (label, value) in enumerate(stats):
                ws.cell(row=row, column=i*2+1, value=label).font = Font(bold=True)
                ws.cell(row=row, column=i*2+2, value=value)
            
            # Common errors
            row += 2
            ws[f'A{row}'] = "Lỗi phổ biến:"
            ws[f'A{row}'].font = Font(bold=True)
            
            row += 1
            error_headers = ["Loại lỗi", "Tần suất", "Tỷ lệ (%)"]
            for col, header in enumerate(error_headers, 1):
                cell = ws.cell(row=row, column=col, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color='E8F6F3', end_color='E8F6F3', fill_type='solid')
            
            for error in skill_data.get('common_errors', [])[:5]:  # Top 5 errors
                row += 1
                ws.cell(row=row, column=1, value=error['error_type'])
                ws.cell(row=row, column=2, value=error['frequency'])
                ws.cell(row=row, column=3, value=f"{error['percentage']}%")
            
            row += 2

    def _create_student_details_sheet(self, wb: Workbook, analysis: Dict[str, Any]):
        """Create detailed student performance sheet"""
        ws = wb.create_sheet("Chi tiết học sinh")
        
        # Title
        ws['A1'] = "CHI TIẾT KẾT QUẢ TỪNG HỌC SINH"
        ws['A1'].font = Font(name='Arial', size=14, bold=True)
        
        # Headers
        headers = ["Tên học sinh", "Email", "Số bài làm", "Điểm TB", "Nghe", "Đọc", "Viết", "Nói", "Xu hướng"]
        row = 3
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=row, column=col, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color='2980B9', end_color='2980B9', fill_type='solid')
            cell.font = Font(color='FFFFFF', bold=True)
            cell.alignment = Alignment(horizontal='center')
        
        # Student data
        for student_name, student_data in analysis.get('student_performance', {}).items():
            row += 1
            
            # Basic info
            ws.cell(row=row, column=1, value=student_name)
            ws.cell(row=row, column=2, value=student_data.get('email', ''))
            ws.cell(row=row, column=3, value=student_data.get('total_assessments', 0))
            ws.cell(row=row, column=4, value=student_data.get('average_total_score', 0))
            
            # Skill averages
            skills = ['listening', 'reading', 'writing', 'speaking']
            for i, skill in enumerate(skills):
                skill_perf = student_data.get('skills_performance', {}).get(skill, {})
                avg_score = skill_perf.get('average', 0) if isinstance(skill_perf, dict) else 0
                ws.cell(row=row, column=5+i, value=avg_score)
            
            # Trend
            # Calculate overall trend from all skills
            all_trends = []
            for skill in skills:
                skill_perf = student_data.get('skills_performance', {}).get(skill, {})
                if isinstance(skill_perf, dict):
                    trend = skill_perf.get('trend', 'stable')
                    all_trends.append(trend)
            
            if all_trends:
                if 'improving' in all_trends:
                    overall_trend = 'Tiến bộ'
                    trend_color = '2ECC71'
                elif 'declining' in all_trends:
                    overall_trend = 'Giảm sút'
                    trend_color = 'E74C3C'
                else:
                    overall_trend = 'Ổn định'
                    trend_color = 'F39C12'
            else:
                overall_trend = 'Chưa đủ dữ liệu'
                trend_color = '95A5A6'
            
            trend_cell = ws.cell(row=row, column=9, value=overall_trend)
            trend_cell.fill = PatternFill(start_color=trend_color, end_color=trend_color, fill_type='solid')
            trend_cell.font = Font(color='FFFFFF', bold=True)
            trend_cell.alignment = Alignment(horizontal='center')

    def _create_recommendations_sheet(self, wb: Workbook, analysis: Dict[str, Any]):
        """Create recommendations sheet"""
        ws = wb.create_sheet("Khuyến nghị")
        
        # Title
        ws['A1'] = "KHUYẾN NGHỊ CẢI THIỆN"
        ws['A1'].font = Font(name='Arial', size=14, bold=True)
        ws.merge_cells('A1:D1')
        ws['A1'].alignment = Alignment(horizontal='center')
        
        recommendations = analysis.get('recommendations', {})
        
        if recommendations.get('ai_generated'):
            row = 3
            ws[f'A{row}'] = "Khuyến nghị từ AI:"
            ws[f'A{row}'].font = Font(bold=True, size=12, color='2980B9')
            
            row += 1
            # Split AI recommendations into paragraphs
            ai_text = recommendations.get('recommendations_text', '')
            paragraphs = ai_text.split('\n\n') if ai_text else []
            
            for paragraph in paragraphs:
                if paragraph.strip():
                    ws[f'A{row}'] = paragraph.strip()
                    ws.merge_cells(f'A{row}:D{row}')
                    ws[f'A{row}'].alignment = Alignment(wrap_text=True, vertical='top')
                    ws.row_dimensions[row].height = 30
                    row += 2
        
        elif recommendations.get('fallback_recommendations'):
            row = 3
            ws[f'A{row}'] = "Khuyến nghị cơ bản:"
            ws[f'A{row}'].font = Font(bold=True, size=12)
            
            for rec in recommendations['fallback_recommendations']:
                row += 1
                ws[f'A{row}'] = f"• {rec}"
                ws.merge_cells(f'A{row}:D{row}')
                ws[f'A{row}'].alignment = Alignment(wrap_text=True)