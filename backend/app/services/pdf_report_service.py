"""
PDF Report Service
Generate professional PDF reports for student progress, suitable for parent-teacher meetings
"""
from typing import List, Dict, Optional
from datetime import datetime
import io
import os

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, 
        Spacer, PageBreak, Image, KeepTogether
    )
    from reportlab.pdfgen import canvas
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("Warning: reportlab not installed. PDF export will not be available.")

try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-GUI backend
    import matplotlib.pyplot as plt
    from matplotlib.patches import Rectangle
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("Warning: matplotlib not installed. Charts in PDF will not be available.")


class PDFReportService:
    """Service for generating PDF reports"""
    
    @staticmethod
    def check_dependencies():
        """Check if required dependencies are available"""
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError("reportlab is not installed. Install with: pip install reportlab")
        if not MATPLOTLIB_AVAILABLE:
            raise RuntimeError("matplotlib is not installed. Install with: pip install matplotlib")
    
    @staticmethod
    def create_skill_chart(skill_data: Dict[str, float], filename: str) -> str:
        """
        Create a bar chart for skill scores
        
        Args:
            skill_data: Dict mapping skill names to scores (0-100)
            filename: Output filename
            
        Returns:
            Path to saved chart image
        """
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        skills = list(skill_data.keys())
        scores = list(skill_data.values())
        
        # Create figure
        fig, ax = plt.subplots(figsize=(8, 5))
        
        # Create bars with colors
        colors_list = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000']
        bars = ax.bar(skills, scores, color=colors_list[:len(skills)])
        
        # Customize chart
        ax.set_ylabel('Điểm (%)', fontsize=12, fontweight='bold')
        ax.set_title('Kết quả theo kỹ năng', fontsize=14, fontweight='bold', pad=20)
        ax.set_ylim(0, 100)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}%',
                   ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        # Add grid
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        ax.set_axisbelow(True)
        
        # Capitalize skill names
        ax.set_xticklabels([s.capitalize() for s in skills], fontsize=11)
        
        plt.tight_layout()
        plt.savefig(filename, dpi=150, bbox_inches='tight')
        plt.close()
        
        return filename
    
    @staticmethod
    def create_progress_timeline_chart(timeline_data: List[Dict], filename: str) -> str:
        """
        Create a line chart for progress over time
        
        Args:
            timeline_data: List of dicts with 'date' and 'score' keys
            filename: Output filename
            
        Returns:
            Path to saved chart image
        """
        if not MATPLOTLIB_AVAILABLE or not timeline_data:
            return None
        
        dates = [d['period_label'] for d in timeline_data]
        scores = [d['average_score'] for d in timeline_data]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 5))
        
        # Plot line
        ax.plot(dates, scores, marker='o', linewidth=2, markersize=8, 
                color='#4472C4', markerfacecolor='#ED7D31')
        
        # Customize chart
        ax.set_ylabel('Điểm trung bình (%)', fontsize=12, fontweight='bold')
        ax.set_xlabel('Thời gian', fontsize=12, fontweight='bold')
        ax.set_title('Tiến bộ theo thời gian', fontsize=14, fontweight='bold', pad=20)
        ax.set_ylim(0, 100)
        
        # Add value labels
        for i, (date, score) in enumerate(zip(dates, scores)):
            ax.text(i, score + 2, f'{score:.1f}', ha='center', fontsize=9)
        
        # Add grid
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.set_axisbelow(True)
        
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig(filename, dpi=150, bbox_inches='tight')
        plt.close()
        
        return filename
    
    @staticmethod
    def generate_student_report(
        student_name: str,
        student_email: str,
        class_name: str,
        teacher_name: str,
        report_date: datetime,
        overall_score: float,
        skill_scores: Dict[str, float],
        progress_timeline: List[Dict],
        recent_activities: List[Dict],
        attendance_data: Optional[Dict] = None,
        teacher_comments: Optional[str] = None,
        recommendations: Optional[List[str]] = None
    ) -> io.BytesIO:
        """
        Generate a comprehensive student progress report PDF
        
        Args:
            student_name: Student's full name
            student_email: Student's email
            class_name: Class name
            teacher_name: Teacher's name
            report_date: Date of report generation
            overall_score: Overall average score (0-100)
            skill_scores: Dict of skill scores (reading, writing, listening, speaking)
            progress_timeline: List of progress snapshots over time
            recent_activities: List of recent submissions/activities
            attendance_data: Optional attendance statistics
            teacher_comments: Optional teacher's comments
            recommendations: Optional list of recommendations
            
        Returns:
            BytesIO buffer containing the PDF
        """
        PDFReportService.check_dependencies()
        
        # Create buffer
        buffer = io.BytesIO()
        
        # Create document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Build content
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leading=14
        )
        
        # ========== HEADER ==========
        story.append(Paragraph("BÁO CÁO TIẾN BỘ HỌC TẬP", title_style))
        story.append(Paragraph("STUDENT PROGRESS REPORT", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Student Info Table
        student_info_data = [
            ['Học sinh:', student_name, 'Lớp:', class_name],
            ['Email:', student_email, 'Giáo viên:', teacher_name],
            ['Ngày báo cáo:', report_date.strftime('%d/%m/%Y'), 'Điểm TB:', f'{overall_score:.1f}%']
        ]
        
        student_info_table = Table(student_info_data, colWidths=[2.5*cm, 6*cm, 2.5*cm, 6*cm])
        student_info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(student_info_table)
        story.append(Spacer(1, 0.4*inch))
        
        # ========== OVERALL PERFORMANCE ==========
        story.append(Paragraph("TỔNG QUAN THÀNH TÍCH", heading_style))
        
        # Performance level
        if overall_score >= 90:
            level = "Xuất sắc (Excellent)"
            level_color = colors.HexColor('#16a34a')
        elif overall_score >= 80:
            level = "Giỏi (Very Good)"
            level_color = colors.HexColor('#2563eb')
        elif overall_score >= 70:
            level = "Khá (Good)"
            level_color = colors.HexColor('#ea580c')
        elif overall_score >= 60:
            level = "Trung bình (Average)"
            level_color = colors.HexColor('#ca8a04')
        else:
            level = "Cần cải thiện (Need Improvement)"
            level_color = colors.HexColor('#dc2626')
        
        level_para = Paragraph(
            f'<font color="{level_color.hexval()}" size="12"><b>Xếp loại: {level}</b></font>',
            normal_style
        )
        story.append(level_para)
        story.append(Spacer(1, 0.2*inch))
        
        # ========== SKILL SCORES ==========
        story.append(Paragraph("KẾT QUẢ THEO KỸ NĂNG", heading_style))
        
        # Skill scores table
        skill_data = [
            ['Kỹ năng', 'Điểm số', 'Đánh giá'],
        ]
        
        skill_names_vn = {
            'reading': 'Đọc (Reading)',
            'writing': 'Viết (Writing)',
            'listening': 'Nghe (Listening)',
            'speaking': 'Nói (Speaking)'
        }
        
        for skill, score in skill_scores.items():
            skill_name = skill_names_vn.get(skill, skill.capitalize())
            if score >= 80:
                evaluation = 'Tốt'
            elif score >= 60:
                evaluation = 'Khá'
            else:
                evaluation = 'Cần cố gắng'
            skill_data.append([skill_name, f'{score:.1f}%', evaluation])
        
        skill_table = Table(skill_data, colWidths=[5*cm, 3*cm, 4*cm])
        skill_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        
        story.append(skill_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Add skill chart if available
        if MATPLOTLIB_AVAILABLE:
            try:
                chart_file = f"/tmp/skill_chart_{datetime.now().timestamp()}.png"
                PDFReportService.create_skill_chart(skill_scores, chart_file)
                
                if os.path.exists(chart_file):
                    img = Image(chart_file, width=5*inch, height=3*inch)
                    story.append(img)
                    story.append(Spacer(1, 0.3*inch))
                    os.remove(chart_file)  # Clean up
            except Exception as e:
                print(f"Error creating skill chart: {e}")
        
        # ========== PROGRESS TIMELINE ==========
        if progress_timeline:
            story.append(Paragraph("TIẾN BỘ THEO THỜI GIAN", heading_style))
            
            # Add timeline chart if available
            if MATPLOTLIB_AVAILABLE:
                try:
                    timeline_file = f"/tmp/timeline_{datetime.now().timestamp()}.png"
                    PDFReportService.create_progress_timeline_chart(progress_timeline, timeline_file)
                    
                    if os.path.exists(timeline_file):
                        img = Image(timeline_file, width=6*inch, height=3*inch)
                        story.append(img)
                        story.append(Spacer(1, 0.3*inch))
                        os.remove(timeline_file)  # Clean up
                except Exception as e:
                    print(f"Error creating timeline chart: {e}")
        
        # ========== RECENT ACTIVITIES ==========
        if recent_activities:
            story.append(Paragraph("HOẠT ĐỘNG GẦN ĐÂY", heading_style))
            
            activity_data = [['Bài tập', 'Ngày nộp', 'Điểm']]
            for activity in recent_activities[:5]:  # Show last 5
                activity_data.append([
                    activity.get('title', 'N/A')[:40],
                    activity.get('date', 'N/A'),
                    f"{activity.get('score', 0):.1f}%" if activity.get('score') else 'Chưa chấm'
                ])
            
            activity_table = Table(activity_data, colWidths=[8*cm, 4*cm, 3*cm])
            activity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ]))
            
            story.append(activity_table)
            story.append(Spacer(1, 0.3*inch))
        
        # ========== ATTENDANCE ==========
        if attendance_data:
            story.append(Paragraph("CHUYÊN CẦN", heading_style))
            
            attendance_info = [
                ['Có mặt:', f"{attendance_data.get('present', 0)} buổi"],
                ['Vắng:', f"{attendance_data.get('absent', 0)} buổi"],
                ['Muộn:', f"{attendance_data.get('late', 0)} buổi"],
                ['Tỷ lệ:', f"{attendance_data.get('rate', 0):.1f}%"]
            ]
            
            attendance_table = Table(attendance_info, colWidths=[4*cm, 6*cm])
            attendance_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            
            story.append(attendance_table)
            story.append(Spacer(1, 0.3*inch))
        
        # ========== TEACHER COMMENTS ==========
        if teacher_comments:
            story.append(Paragraph("NHẬN XÉT CỦA GIÁO VIÊN", heading_style))
            story.append(Paragraph(teacher_comments, normal_style))
            story.append(Spacer(1, 0.3*inch))
        
        # ========== RECOMMENDATIONS ==========
        if recommendations:
            story.append(Paragraph("KHUYẾN NGHỊ", heading_style))
            for i, rec in enumerate(recommendations, 1):
                story.append(Paragraph(f"{i}. {rec}", normal_style))
            story.append(Spacer(1, 0.3*inch))
        
        # ========== FOOTER ==========
        story.append(Spacer(1, 0.5*inch))
        footer_text = f'<para align="center"><i>Báo cáo được tạo tự động bởi EnglishWebAI<br/>' \
                     f'Ngày: {datetime.now().strftime("%d/%m/%Y %H:%M")}</i></para>'
        story.append(Paragraph(footer_text, styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Get buffer value
        buffer.seek(0)
        return buffer

