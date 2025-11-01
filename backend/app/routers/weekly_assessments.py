"""
Weekly Assessments & Error Analysis Router
API endpoints for managing weekly skill assessments and error analysis reports
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from io import BytesIO
import json
import csv

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.weekly_assessment import WeeklyAssessment, WeeklySubmission
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.services.openai_service import openai_service
from app.services.ai_grading_service import AIGradingService

router = APIRouter(prefix="/api/v1/weekly-assessments", tags=["Weekly Assessments"])


# Import schemas from schemas module
from app.schemas.weekly_assessment import (
    WeeklyAssessmentCreate,
    WeeklyAssessmentGenerate,
    WeeklyAssessmentResponse,
    WeeklySubmissionCreate,
    WeeklySubmissionUpdate,
    WeeklySubmissionSubmit,
    WeeklySubmissionGrade,
    WeeklySubmissionResponse,
    ErrorAnalysisExportRequest
)


# ============= Helper Functions =============
def _ensure_teacher_access(db: Session, current_user: User, class_id: int) -> Classroom:
    """Ensure user is teacher or admin for the class"""
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")
    
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    
    raise HTTPException(status_code=403, detail="Không có quyền truy cập")


# ============= Weekly Assessment Endpoints =============
@router.get("/classes/{class_id}", response_model=List[WeeklyAssessmentResponse])
async def get_weekly_assessments(
    class_id: int,
    week_number: Optional[int] = None,
    skill_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all weekly assessments for a class
    Filter by week number or skill type if provided
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    query = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.class_id == class_id,
        WeeklyAssessment.is_active == True
    )
    
    if week_number:
        query = query.filter(WeeklyAssessment.week_number == week_number)
    
    if skill_type:
        query = query.filter(WeeklyAssessment.skill_type == skill_type)
    
    assessments = query.order_by(
        WeeklyAssessment.week_number.desc(),
        WeeklyAssessment.skill_type
    ).all()
    
    return assessments


@router.post("/", response_model=WeeklyAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_weekly_assessment(
    assessment_data: WeeklyAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a weekly assessment manually
    """
    _ensure_teacher_access(db, current_user, assessment_data.class_id)
    
    # Check if assessment already exists for this week and skill
    existing = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.class_id == assessment_data.class_id,
        WeeklyAssessment.week_number == assessment_data.week_number,
        WeeklyAssessment.skill_type == assessment_data.skill_type,
        WeeklyAssessment.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Đã có phiếu đánh giá {assessment_data.skill_type} cho tuần {assessment_data.week_number}"
        )
    
    assessment = WeeklyAssessment(
        class_id=assessment_data.class_id,
        teacher_id=current_user.id,
        week_number=assessment_data.week_number,
        skill_type=assessment_data.skill_type,
        title=assessment_data.title,
        description=assessment_data.description,
        content=assessment_data.content,
        rubrics=assessment_data.rubrics,
        max_score=assessment_data.max_score,
        duration=assessment_data.duration,
        ai_generated=False
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment


@router.post("/generate", response_model=WeeklyAssessmentResponse, status_code=status.HTTP_201_CREATED)
async def generate_weekly_assessment(
    generate_data: WeeklyAssessmentGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a weekly assessment using AI
    """
    _ensure_teacher_access(db, current_user, generate_data.class_id)
    
    # Check if already exists
    existing = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.class_id == generate_data.class_id,
        WeeklyAssessment.week_number == generate_data.week_number,
        WeeklyAssessment.skill_type == generate_data.skill_type,
        WeeklyAssessment.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Đã có phiếu đánh giá {generate_data.skill_type} cho tuần {generate_data.week_number}"
        )
    
    # Generate content using AI
    try:
        unit_name = generate_data.unit or f"Tuần {generate_data.week_number}"
        
        ai_result = await openai_service.generate_worksheet(
            grade=generate_data.grade_level,
            unit=unit_name,
            worksheet_type="mixed",
            skill_focus=generate_data.skill_type,
            difficulty_level=generate_data.difficulty_level,
            num_questions=10,
            duration=45
        )
        
        # Create assessment from AI result
        assessment = WeeklyAssessment(
            class_id=generate_data.class_id,
            teacher_id=current_user.id,
            week_number=generate_data.week_number,
            skill_type=generate_data.skill_type,
            title=ai_result.get("title", f"Đánh giá {generate_data.skill_type.title()} - Tuần {generate_data.week_number}"),
            description=ai_result.get("instructions", f"Phiếu đánh giá kỹ năng {generate_data.skill_type} tuần {generate_data.week_number}"),
            content=ai_result.get("content"),
            rubrics=ai_result.get("rubrics"),
            max_score=float(ai_result.get("total_points", 10)),
            duration=45,
            ai_generated=True
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        return assessment
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Không thể tạo phiếu đánh giá: {str(e)}"
        )


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weekly_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete (deactivate) a weekly assessment
    """
    assessment = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.id == assessment_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    
    _ensure_teacher_access(db, current_user, assessment.class_id)
    
    assessment.is_active = False
    db.commit()
    
    return None


# ============= Error Analysis Export Endpoints =============
@router.post("/export/error-analysis")
async def export_error_analysis(
    export_request: ErrorAnalysisExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export error analysis with AI feedback and suggestions
    Supports CSV, JSON, and Excel formats
    """
    _ensure_teacher_access(db, current_user, export_request.class_id)
    
    # Get all exercises in the class
    query = db.query(Submission, User.full_name, User.username, Exercise.title, Exercise.skill_type).join(
        Exercise, Exercise.id == Submission.exercise_id
    ).join(
        User, User.id == Submission.student_id
    ).filter(
        Exercise.class_id == export_request.class_id,
        Submission.status == "graded"
    )
    
    # Apply filters
    if export_request.student_id:
        query = query.filter(Submission.student_id == export_request.student_id)
    
    if export_request.skill_type:
        query = query.filter(Exercise.skill_type == export_request.skill_type)
    
    results = query.order_by(Submission.submitted_at.desc()).all()
    
    # Prepare data
    error_analysis_data = []
    for sub, full_name, username, ex_title, ex_skill in results:
        student_name = full_name or username
        
        # Parse error analysis
        errors = []
        if sub.error_analysis:
            if isinstance(sub.error_analysis, list):
                errors = sub.error_analysis
            elif isinstance(sub.error_analysis, dict):
                errors = sub.error_analysis.get('errors', [])
        
        # Parse AI feedback
        ai_feedback = sub.ai_feedback or "Chưa có phản hồi AI"
        teacher_feedback = sub.feedback or ""
        
        # Aggregate rubrics scores
        rubrics_summary = ""
        if sub.rubrics_scores:
            rubrics_list = []
            if isinstance(sub.rubrics_scores, list):
                for rubric in sub.rubrics_scores:
                    if isinstance(rubric, dict):
                        skill = rubric.get('skill', '')
                        score = rubric.get('score', 0)
                        max_score = rubric.get('max_score', 10)
                        rubrics_list.append(f"{skill}: {score}/{max_score}")
            rubrics_summary = "; ".join(rubrics_list)
        
        # Build error descriptions
        error_descriptions = []
        suggestions = []
        
        for error in errors:
            if isinstance(error, dict):
                error_type = error.get('error_type', 'Unknown')
                description = error.get('description', '')
                suggestion = error.get('suggestion', '')
                
                error_descriptions.append(f"{error_type}: {description}")
                if suggestion:
                    suggestions.append(suggestion)
        
        error_analysis_data.append({
            "student_name": student_name,
            "exercise_title": ex_title,
            "skill_type": ex_skill,
            "score": sub.score or 0,
            "ai_score": sub.ai_score or 0,
            "rubrics_scores": rubrics_summary,
            "errors": "; ".join(error_descriptions) if error_descriptions else "Không có lỗi",
            "suggestions": "; ".join(suggestions) if suggestions else "Không có gợi ý",
            "ai_feedback": ai_feedback,
            "teacher_feedback": teacher_feedback,
            "submitted_at": sub.submitted_at.strftime("%Y-%m-%d %H:%M") if sub.submitted_at else ""
        })
    
    # Export based on format
    if export_request.format == "json":
        return {
            "class_id": export_request.class_id,
            "exported_at": datetime.utcnow().isoformat(),
            "total_submissions": len(error_analysis_data),
            "error_analysis": error_analysis_data
        }
    
    elif export_request.format == "csv":
        # Create CSV in memory
        output = BytesIO()
        
        # Write UTF-8 BOM for Excel compatibility
        output.write('\ufeff'.encode('utf-8'))
        
        if error_analysis_data:
            fieldnames = error_analysis_data[0].keys()
            
            # Create CSV writer with UTF-8 encoding
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(error_analysis_data)
        else:
            # Empty CSV with headers
            writer = csv.DictWriter(output, fieldnames=[
                "student_name", "exercise_title", "skill_type", "score", 
                "ai_score", "rubrics_scores", "errors", "suggestions", 
                "ai_feedback", "teacher_feedback", "submitted_at"
            ])
            writer.writeheader()
        
        output.seek(0)
        
        from urllib.parse import quote
        filename = f"error_analysis_class_{export_request.class_id}.csv"
        filename_encoded = quote(filename)
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"; filename*=UTF-8\'\'{filename_encoded}',
            'Content-Type': 'text/csv; charset=utf-8'
        }
        
        return StreamingResponse(
            output,
            media_type='text/csv',
            headers=headers
        )
    
    elif export_request.format == "excel":
        # TODO: Implement Excel export with openpyxl
        return {
            "message": "Excel export sẽ được triển khai sau",
            "data": error_analysis_data
        }
    
    else:
        raise HTTPException(status_code=400, detail="Format không hợp lệ. Chọn: json, csv, hoặc excel")


@router.get("/classes/{class_id}/summary")
async def get_class_assessment_summary(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get summary of weekly assessments for a class
    Shows which weeks and skills have assessments
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    assessments = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.class_id == class_id,
        WeeklyAssessment.is_active == True
    ).all()
    
    # Group by week
    weeks_data = {}
    for assessment in assessments:
        week = assessment.week_number
        if week not in weeks_data:
            weeks_data[week] = {
                "week_number": week,
                "assessments": {}
            }
        
        weeks_data[week]["assessments"][assessment.skill_type] = {
            "id": assessment.id,
            "title": assessment.title,
            "ai_generated": assessment.ai_generated,
            "created_at": assessment.created_at.isoformat()
        }
    
    # Convert to sorted list
    summary = sorted(weeks_data.values(), key=lambda x: x["week_number"], reverse=True)
    
    return {
        "class_id": class_id,
        "total_assessments": len(assessments),
        "weeks": summary
    }


# ============= Student Submission Endpoints =============
@router.post("/submissions/start", response_model=WeeklySubmissionResponse)
async def start_weekly_submission(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a weekly assessment (create submission)"""
    if current_user.role != UserRole.USER:
        raise HTTPException(status_code=403, detail="Chỉ học sinh mới có thể làm bài")
    
    assessment = db.query(WeeklyAssessment).filter(WeeklyAssessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    
    # Check if student is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == assessment.class_id,
        Enrollment.user_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=403, detail="Bạn không thuộc lớp này")
    
    # Check if already started
    existing = db.query(WeeklySubmission).filter(
        WeeklySubmission.assessment_id == assessment_id,
        WeeklySubmission.student_id == current_user.id
    ).first()
    
    if existing:
        return existing
    
    # Create new submission
    submission = WeeklySubmission(
        assessment_id=assessment_id,
        student_id=current_user.id,
        answers={},
        status="in_progress"
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return submission


@router.put("/submissions/{submission_id}", response_model=WeeklySubmissionResponse)
async def update_weekly_submission(
    submission_id: int,
    update_data: WeeklySubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update weekly submission (save answers)"""
    submission = db.query(WeeklySubmission).filter(
        WeeklySubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    if submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")
    
    if submission.status == "submitted":
        raise HTTPException(status_code=400, detail="Bài đã nộp, không thể chỉnh sửa")
    
    # Update answers
    submission.answers = update_data.answers
    submission.status = update_data.status or "in_progress"
    
    db.commit()
    db.refresh(submission)
    
    return submission


@router.post("/submissions/{submission_id}/submit", response_model=WeeklySubmissionResponse)
async def submit_weekly_assessment(
    submission_id: int,
    submit_data: WeeklySubmissionSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit weekly assessment for grading"""
    submission = db.query(WeeklySubmission).filter(
        WeeklySubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    if submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền nộp bài")
    
    if submission.status == "submitted":
        raise HTTPException(status_code=400, detail="Bài đã được nộp")
    
    # Get assessment details
    assessment = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.id == submission.assessment_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    
    # Update submission
    submission.answers = submit_data.answers
    submission.status = "submitted"
    submission.submitted_at = datetime.utcnow()
    
    # Auto-grade if possible
    try:
        await _auto_grade_weekly_submission(submission, assessment, db)
    except Exception as e:
        print(f"[SUBMIT_WEEKLY] Auto-grade error: {e}")
    
    db.commit()
    db.refresh(submission)
    
    return submission


@router.get("/submissions/my/{assessment_id}", response_model=WeeklySubmissionResponse)
async def get_my_weekly_submission(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's own submission for a weekly assessment"""
    submission = db.query(WeeklySubmission).filter(
        WeeklySubmission.assessment_id == assessment_id,
        WeeklySubmission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Chưa có bài làm")
    
    return submission


@router.get("/submissions/assessment/{assessment_id}", response_model=List[WeeklySubmissionResponse])
async def get_assessment_submissions(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for an assessment (teacher only)"""
    assessment = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.id == assessment_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu đánh giá")
    
    _ensure_teacher_access(db, current_user, assessment.class_id)
    
    submissions = db.query(WeeklySubmission).filter(
        WeeklySubmission.assessment_id == assessment_id
    ).order_by(WeeklySubmission.submitted_at.desc()).all()
    
    return submissions


@router.post("/submissions/{submission_id}/grade", response_model=WeeklySubmissionResponse)
async def grade_weekly_submission(
    submission_id: int,
    grade_data: WeeklySubmissionGrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grade weekly submission (teacher only)"""
    submission = db.query(WeeklySubmission).filter(
        WeeklySubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    assessment = db.query(WeeklyAssessment).filter(
        WeeklyAssessment.id == submission.assessment_id
    ).first()
    
    _ensure_teacher_access(db, current_user, assessment.class_id)
    
    # Update grade
    submission.score = grade_data.score
    submission.rubrics_scores = grade_data.rubrics_scores
    submission.feedback = grade_data.feedback
    submission.status = "graded"
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    return submission


async def _auto_grade_weekly_submission(submission: WeeklySubmission, assessment: WeeklyAssessment, db: Session):
    """Auto-grade weekly submission using AI"""
    if not assessment.content:
        return
    
    ai_grading = AIGradingService()
    questions = assessment.content.get('questions', [])
    student_answers = submission.answers or {}
    
    total_score = 0.0
    max_score = assessment.max_score or 10.0
    graded_results = {}
    
    for question in questions:
        q_id = str(question.get('id', ''))
        q_type = question.get('type', '')
        q_points = float(question.get('points', 1.0))
        correct_answer = question.get('correct_answer')
        student_answer = student_answers.get(q_id, '')
        
        result = {'question_id': q_id, 'type': q_type, 'points': q_points}
        
        try:
            if q_type == 'multiple_choice':
                grade_result = await ai_grading.grade_multiple_choice(question, student_answer)
            elif q_type == 'fill_blank':
                grade_result = await ai_grading.grade_fill_blank(question, student_answer)
            elif q_type == 'true_false':
                grade_result = await ai_grading.grade_true_false(question, student_answer)
            elif q_type == 'matching':
                if isinstance(student_answer, str):
                    try:
                        student_answer = json.loads(student_answer) if student_answer else {}
                    except:
                        student_answer = {}
                grade_result = await ai_grading.grade_matching(question, student_answer)
            else:
                grade_result = {'is_correct': False, 'points_earned': 0, 'feedback': 'Unknown question type'}
            
            result.update(grade_result)
            total_score += grade_result.get('points_earned', 0)
            
        except Exception as e:
            print(f"[AUTO_GRADE_WEEKLY] Error grading Q{q_id}: {e}")
            result['error'] = str(e)
        
        graded_results[q_id] = result
    
    # Update submission with results
    submission.ai_score = round(total_score, 2)
    submission.rubrics_scores = {
        'auto_grade_results': graded_results,
        'total_auto_score': round(total_score, 2),
        'max_possible_score': max_score
    }
    submission.status = "graded"  # Mark as graded if all auto-graded

