"""
Enhanced Weekly Assessments Router
Support for 4-skill integrated assessments and comprehensive error analysis
"""
import json
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.classroom import Classroom
from app.models.enhanced_weekly_assessment import EnhancedWeeklyAssessment, EnhancedWeeklySubmission
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.enhanced_weekly_assessment import (
    AssessmentTypeEnum,
    EnhancedErrorAnalysisExportRequest,
    EnhancedWeeklyAssessmentCreate,
    EnhancedWeeklyAssessmentGenerate,
    EnhancedWeeklyAssessmentResponse,
    EnhancedWeeklySubmissionCreate,
    EnhancedWeeklySubmissionGrade,
    EnhancedWeeklySubmissionResponse,
)
from app.services.enhanced_error_analysis_service import EnhancedErrorAnalysisService
from app.services.openai_service import openai_service

router = APIRouter(prefix="/api/v1/enhanced-weekly-assessments", tags=["Enhanced Weekly Assessments"])
error_analysis_service = EnhancedErrorAnalysisService()


# ============= Helper Functions =============
def _ensure_can_manage_class(db: Session, current_user: User, class_id: int) -> Classroom:
    """Ensure user can manage the specified class"""
    classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")

    if current_user.role != UserRole.ADMIN and classroom.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập lớp học này")

    return classroom


def _ensure_student_in_class(db: Session, student_id: int, class_id: int):
    """Ensure student is enrolled in the class"""
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.class_id == class_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=403, detail="Học sinh không thuộc lớp học này")


# ============= Assessment Management =============
@router.get("/", response_model=list[EnhancedWeeklyAssessmentResponse])
async def get_assessments(
    class_id: int,
    assessment_type: AssessmentTypeEnum | None = None,
    week_number: int | None = None,
    semester_period: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get enhanced weekly assessments with filters"""
    _ensure_can_manage_class(db, current_user, class_id)

    query = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.class_id == class_id,
        EnhancedWeeklyAssessment.is_active
    )

    if assessment_type:
        query = query.filter(EnhancedWeeklyAssessment.assessment_type == assessment_type)
    if week_number:
        query = query.filter(EnhancedWeeklyAssessment.week_number == week_number)
    if semester_period:
        query = query.filter(EnhancedWeeklyAssessment.semester_period == semester_period)

    assessments = query.order_by(
        EnhancedWeeklyAssessment.week_number.desc(),
        EnhancedWeeklyAssessment.created_at.desc()
    ).all()

    return [_build_assessment_response(assessment) for assessment in assessments]


@router.post("/", response_model=EnhancedWeeklyAssessmentResponse)
async def create_assessment(
    assessment_data: EnhancedWeeklyAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create new enhanced weekly assessment"""
    _ensure_can_manage_class(db, current_user, assessment_data.class_id)

    # Check for duplicate assessment
    existing = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.class_id == assessment_data.class_id,
        EnhancedWeeklyAssessment.assessment_type == assessment_data.assessment_type,
        EnhancedWeeklyAssessment.week_number == assessment_data.week_number,
        EnhancedWeeklyAssessment.semester_period == assessment_data.semester_period,
        EnhancedWeeklyAssessment.is_active
    ).first()

    if existing:
        if assessment_data.assessment_type in ['weekly_single', 'weekly_integrated']:
            raise HTTPException(
                status_code=400,
                detail=f"Đã có phiếu đánh giá tuần {assessment_data.week_number} loại {assessment_data.assessment_type}"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Đã có đề thi {assessment_data.assessment_type} trong kỳ {assessment_data.semester_period}"
        )

    # Create assessment
    assessment = EnhancedWeeklyAssessment(
        class_id=assessment_data.class_id,
        teacher_id=current_user.id,
        assessment_type=assessment_data.assessment_type,
        week_number=assessment_data.week_number,
        semester_period=assessment_data.semester_period,
        title=assessment_data.title,
        description=assessment_data.description,
        skills_enabled=assessment_data.skills_enabled,
        total_duration=assessment_data.total_duration,
        start_time=assessment_data.start_time,
        end_time=assessment_data.end_time,
        auto_grade_enabled=assessment_data.auto_grade_enabled
    )

    # Set skill-specific content and scores
    if assessment_data.listening_content:
        assessment.listening_content = assessment_data.listening_content.dict()
        assessment.listening_max_score = assessment_data.listening_content.max_score
        assessment.listening_duration = assessment_data.listening_content.duration

    if assessment_data.reading_content:
        assessment.reading_content = assessment_data.reading_content.dict()
        assessment.reading_max_score = assessment_data.reading_content.max_score
        assessment.reading_duration = assessment_data.reading_content.duration

    if assessment_data.writing_content:
        assessment.writing_content = assessment_data.writing_content.dict()
        assessment.writing_max_score = assessment_data.writing_content.max_score
        assessment.writing_duration = assessment_data.writing_content.duration

    if assessment_data.speaking_content:
        assessment.speaking_content = assessment_data.speaking_content.dict()
        assessment.speaking_max_score = assessment_data.speaking_content.max_score
        assessment.speaking_duration = assessment_data.speaking_content.duration

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return _build_assessment_response(assessment)


@router.post("/generate", response_model=EnhancedWeeklyAssessmentResponse)
async def generate_assessment_with_ai(
    generate_data: EnhancedWeeklyAssessmentGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate enhanced weekly assessment using AI"""
    _ensure_can_manage_class(db, current_user, generate_data.class_id)

    # Check for existing assessment
    existing = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.class_id == generate_data.class_id,
        EnhancedWeeklyAssessment.assessment_type == generate_data.assessment_type,
        EnhancedWeeklyAssessment.week_number == generate_data.week_number,
        EnhancedWeeklyAssessment.semester_period == generate_data.semester_period,
        EnhancedWeeklyAssessment.is_active
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Đã có phiếu đánh giá {generate_data.assessment_type} cho tuần {generate_data.week_number}"
        )

    # Generate content using AI
    try:
        ai_content = await _generate_ai_assessment_content(generate_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi tạo nội dung bằng AI: {str(e)}"
        ) from e

    # Create assessment
    assessment = EnhancedWeeklyAssessment(
        class_id=generate_data.class_id,
        teacher_id=current_user.id,
        assessment_type=generate_data.assessment_type,
        week_number=generate_data.week_number,
        semester_period=generate_data.semester_period,
        title=ai_content.get("title", f"Đánh giá {generate_data.assessment_type} - Tuần {generate_data.week_number}"),
        description=ai_content.get("description", f"Đánh giá kỹ năng {generate_data.assessment_type}"),
        skills_enabled=generate_data.skills_enabled,
        ai_generated=True,
        auto_grade_enabled=True
    )

    # Set AI-generated content for enabled skills
    for skill in ['listening', 'reading', 'writing', 'speaking']:
        if generate_data.skills_enabled.get(skill, False):
            content = ai_content.get(f'{skill}_content')
            if content:
                setattr(assessment, f'{skill}_content', content)
                setattr(assessment, f'{skill}_max_score', content.get('max_score', 25.0))
                setattr(assessment, f'{skill}_duration', content.get('duration', 30))

    # Calculate total scores and duration
    total_max_score = sum([
        getattr(assessment, f'{skill}_max_score', 0) or 0
        for skill in ['listening', 'reading', 'writing', 'speaking']
        if generate_data.skills_enabled.get(skill, False)
    ])
    assessment.total_max_score = total_max_score

    total_duration = sum([
        getattr(assessment, f'{skill}_duration', 0) or 0
        for skill in ['listening', 'reading', 'writing', 'speaking']
        if generate_data.skills_enabled.get(skill, False)
    ])
    assessment.total_duration = total_duration

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return _build_assessment_response(assessment)


@router.get("/{assessment_id}", response_model=EnhancedWeeklyAssessmentResponse)
async def get_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get specific enhanced weekly assessment"""
    assessment = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.id == assessment_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Phiếu đánh giá không tồn tại")

    _ensure_can_manage_class(db, current_user, assessment.class_id)

    return _build_assessment_response(assessment)


# ============= Submission Management =============
@router.get("/{assessment_id}/submissions", response_model=list[EnhancedWeeklySubmissionResponse])
async def get_submissions(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all submissions for an assessment"""
    assessment = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.id == assessment_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Phiếu đánh giá không tồn tại")

    _ensure_can_manage_class(db, current_user, assessment.class_id)

    submissions = db.query(EnhancedWeeklySubmission).filter(
        EnhancedWeeklySubmission.assessment_id == assessment_id
    ).all()

    return [_build_submission_response(submission, assessment) for submission in submissions]


@router.post("/{assessment_id}/submit", response_model=EnhancedWeeklySubmissionResponse)
async def submit_assessment(
    assessment_id: int,
    submission_data: EnhancedWeeklySubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit or update student assessment"""
    assessment = db.query(EnhancedWeeklyAssessment).filter(
        EnhancedWeeklyAssessment.id == assessment_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Phiếu đánh giá không tồn tại")

    _ensure_student_in_class(db, current_user.id, assessment.class_id)

    # Check if submission already exists
    existing_submission = db.query(EnhancedWeeklySubmission).filter(
        EnhancedWeeklySubmission.assessment_id == assessment_id,
        EnhancedWeeklySubmission.student_id == current_user.id
    ).first()

    if existing_submission:
        # Update existing submission
        submission = existing_submission
        submission.status = "submitted"
        submission.submitted_at = datetime.now()
    else:
        # Create new submission
        submission = EnhancedWeeklySubmission(
            assessment_id=assessment_id,
            student_id=current_user.id,
            status="submitted",
            started_at=datetime.now(),
            submitted_at=datetime.now()
        )

    # Update answers for each skill
    if submission_data.listening_answers:
        submission.listening_answers = submission_data.listening_answers.dict()
        submission.listening_time_spent = submission_data.listening_answers.time_spent

    if submission_data.reading_answers:
        submission.reading_answers = submission_data.reading_answers.dict()
        submission.reading_time_spent = submission_data.reading_answers.time_spent

    if submission_data.writing_answers:
        submission.writing_answers = submission_data.writing_answers.dict()
        submission.writing_time_spent = submission_data.writing_answers.time_spent

    if submission_data.speaking_answers:
        submission.speaking_answers = submission_data.speaking_answers.dict()
        submission.speaking_time_spent = submission_data.speaking_answers.time_spent

    # Calculate total time spent
    time_fields = [submission.listening_time_spent, submission.reading_time_spent,
                   submission.writing_time_spent, submission.speaking_time_spent]
    submission.total_time_spent = sum(filter(None, time_fields))

    if not existing_submission:
        db.add(submission)

    db.commit()
    db.refresh(submission)

    # Auto-grade if enabled
    if assessment.auto_grade_enabled:
        await _auto_grade_submission(submission, assessment, db)

    return _build_submission_response(submission, assessment)


@router.post("/submissions/{submission_id}/grade", response_model=EnhancedWeeklySubmissionResponse)
async def grade_submission(
    submission_id: int,
    grading_data: EnhancedWeeklySubmissionGrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Grade enhanced weekly submission"""
    submission = db.query(EnhancedWeeklySubmission).filter(
        EnhancedWeeklySubmission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Bài làm không tồn tại")

    assessment = submission.assessment
    _ensure_can_manage_class(db, current_user, assessment.class_id)

    # Update grading for each skill
    if grading_data.listening_grading:
        lg = grading_data.listening_grading
        submission.listening_score = lg.score
        submission.listening_ai_score = lg.ai_score
        submission.listening_rubric_scores = lg.rubric_scores
        submission.listening_feedback = lg.feedback
        submission.listening_ai_feedback = lg.ai_feedback
        submission.listening_error_analysis = lg.error_analysis

    if grading_data.reading_grading:
        rg = grading_data.reading_grading
        submission.reading_score = rg.score
        submission.reading_ai_score = rg.ai_score
        submission.reading_rubric_scores = rg.rubric_scores
        submission.reading_feedback = rg.feedback
        submission.reading_ai_feedback = rg.ai_feedback
        submission.reading_error_analysis = rg.error_analysis

    if grading_data.writing_grading:
        wg = grading_data.writing_grading
        submission.writing_score = wg.score
        submission.writing_ai_score = wg.ai_score
        submission.writing_rubric_scores = wg.rubric_scores
        submission.writing_feedback = wg.feedback
        submission.writing_ai_feedback = wg.ai_feedback
        submission.writing_error_analysis = wg.error_analysis

    if grading_data.speaking_grading:
        sg = grading_data.speaking_grading
        submission.speaking_score = sg.score
        submission.speaking_ai_score = sg.ai_score
        submission.speaking_rubric_scores = sg.rubric_scores
        submission.speaking_feedback = sg.feedback
        submission.speaking_ai_feedback = sg.ai_feedback
        submission.speaking_error_analysis = sg.error_analysis

    # Calculate total score
    scores = [submission.listening_score, submission.reading_score,
              submission.writing_score, submission.speaking_score]
    valid_scores = [s for s in scores if s is not None]
    submission.total_score = sum(valid_scores) if valid_scores else None

    # Set overall feedback and status
    submission.overall_feedback = grading_data.overall_feedback
    submission.status = "graded"
    submission.graded_at = datetime.now()

    db.commit()
    db.refresh(submission)

    return _build_submission_response(submission, assessment)


# ============= Error Analysis & Export =============
@router.post("/export/error-analysis")
async def export_error_analysis(
    export_request: EnhancedErrorAnalysisExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export comprehensive error analysis to Excel"""
    _ensure_can_manage_class(db, current_user, export_request.class_id)

    # Get class information
    classroom = db.query(Classroom).filter(Classroom.id == export_request.class_id).first()
    teacher = db.query(User).filter(User.id == classroom.teacher_id).first()

    class_info = {
        'class_name': classroom.name,
        'teacher_name': teacher.full_name if teacher else 'N/A',
        'class_id': export_request.class_id
    }

    # Generate analysis
    analysis = await error_analysis_service.generate_detailed_error_analysis(
        db=db,
        class_id=export_request.class_id,
        assessment_type=export_request.assessment_type,
        week_number=export_request.week_number,
        semester_period=export_request.semester_period,
        student_id=export_request.student_id,
        skills=export_request.skills
    )

    if analysis.get('total_submissions', 0) == 0:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dữ liệu phù hợp để xuất báo cáo"
        )

    # Export to Excel
    excel_file = await error_analysis_service.export_to_excel(analysis, class_info)

    # Prepare filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Phan_tich_loi_{classroom.name}_{timestamp}.xlsx"

    return StreamingResponse(
        BytesIO(excel_file.getvalue()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============= Helper Functions =============
async def _generate_ai_assessment_content(generate_data: EnhancedWeeklyAssessmentGenerate) -> dict:
    """Generate assessment content using AI"""
    enabled_skills = [skill for skill, enabled in generate_data.skills_enabled.items() if enabled]

    prompt = f"""
    Tạo nội dung đánh giá tiếng Anh {generate_data.assessment_type} cho học sinh lớp {generate_data.grade_level}.

    Thông tin:
    - Tuần: {generate_data.week_number}
    - Kỳ: {generate_data.semester_period}
    - Chủ đề: {generate_data.unit_topic or 'Chung'}
    - Độ khó: {generate_data.difficulty_level}
    - Kỹ năng cần tạo: {', '.join(enabled_skills)}

    Yêu cầu cụ thể:
    {generate_data.listening_requirements or ''}
    {generate_data.reading_requirements or ''}
    {generate_data.writing_requirements or ''}
    {generate_data.speaking_requirements or ''}

    Trả về JSON với cấu trúc:
    {{
        "title": "Tiêu đề đánh giá",
        "description": "Mô tả chi tiết",
        "listening_content": {{"questions": [...], "max_score": 25, "duration": 30}},
        "reading_content": {{"questions": [...], "max_score": 25, "duration": 45}},
        "writing_content": {{"questions": [...], "max_score": 25, "duration": 60}},
        "speaking_content": {{"questions": [...], "max_score": 25, "duration": 20}}
    }}

    Tạo nội dung phù hợp, đa dạng và chất lượng cao.
    """

    try:
        response = await openai_service.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-5-nano"
        )

        # Parse AI response as JSON
        return json.loads(response)

    except Exception:
        # Fallback content if AI fails
        return _generate_fallback_content(generate_data)


def _generate_fallback_content(generate_data: EnhancedWeeklyAssessmentGenerate) -> dict:
    """Generate basic fallback content when AI is unavailable"""
    content = {
        "title": f"Đánh giá {generate_data.assessment_type} - Tuần {generate_data.week_number}",
        "description": f"Đánh giá kỹ năng tiếng Anh tuần {generate_data.week_number}"
    }

    # Basic content for each enabled skill
    for skill in ['listening', 'reading', 'writing', 'speaking']:
        if generate_data.skills_enabled.get(skill, False):
            content[f'{skill}_content'] = {
                "questions": [
                    {
                        "id": 1,
                        "type": "multiple_choice",
                        "question": f"Câu hỏi {skill} mẫu 1",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "A"
                    }
                ],
                "max_score": 25.0,
                "duration": 30
            }

    return content


async def _auto_grade_submission(submission: EnhancedWeeklySubmission, assessment: EnhancedWeeklyAssessment, db: Session):
    """Auto-grade submission using AI"""
    # This would implement AI-based auto-grading
    # For now, we'll skip this implementation


def _build_assessment_response(assessment: EnhancedWeeklyAssessment) -> EnhancedWeeklyAssessmentResponse:
    """Build assessment response object"""
    # Build skill results
    skills_data = {}

    for skill in ['listening', 'reading', 'writing', 'speaking']:
        content = getattr(assessment, f'{skill}_content', None)
        if content and assessment.skills_enabled.get(skill, False):
            skills_data[skill] = {
                'content': content,
                'max_score': getattr(assessment, f'{skill}_max_score', 25.0),
                'duration': getattr(assessment, f'{skill}_duration', 30)
            }

    return EnhancedWeeklyAssessmentResponse(
        id=assessment.id,
        class_id=assessment.class_id,
        teacher_id=assessment.teacher_id,
        assessment_type=assessment.assessment_type,
        week_number=assessment.week_number,
        semester_period=assessment.semester_period,
        title=assessment.title,
        description=assessment.description,
        listening=skills_data.get('listening'),
        reading=skills_data.get('reading'),
        writing=skills_data.get('writing'),
        speaking=skills_data.get('speaking'),
        skills_enabled=assessment.skills_enabled,
        total_max_score=assessment.total_max_score,
        total_duration=assessment.total_duration,
        is_active=assessment.is_active,
        ai_generated=assessment.ai_generated,
        start_time=assessment.start_time,
        end_time=assessment.end_time,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at
    )


def _build_submission_response(submission: EnhancedWeeklySubmission, assessment: EnhancedWeeklyAssessment) -> EnhancedWeeklySubmissionResponse:
    """Build submission response object"""
    # Build skill results
    skills_data = {}

    for skill in ['listening', 'reading', 'writing', 'speaking']:
        if assessment.skills_enabled.get(skill, False):
            skills_data[skill] = {
                'answers': getattr(submission, f'{skill}_answers', None),
                'score': getattr(submission, f'{skill}_score', None),
                'ai_score': getattr(submission, f'{skill}_ai_score', None),
                'max_score': getattr(assessment, f'{skill}_max_score', 25.0),
                'rubric_scores': getattr(submission, f'{skill}_rubric_scores', {}),
                'feedback': getattr(submission, f'{skill}_feedback', None),
                'ai_feedback': getattr(submission, f'{skill}_ai_feedback', None),
                'error_analysis': getattr(submission, f'{skill}_error_analysis', {}),
                'time_spent': getattr(submission, f'{skill}_time_spent', None),
                'duration': getattr(assessment, f'{skill}_duration', 30)
            }

    return EnhancedWeeklySubmissionResponse(
        id=submission.id,
        assessment_id=submission.assessment_id,
        student_id=submission.student_id,
        listening=skills_data.get('listening'),
        reading=skills_data.get('reading'),
        writing=skills_data.get('writing'),
        speaking=skills_data.get('speaking'),
        total_score=submission.total_score,
        total_ai_score=submission.total_ai_score,
        total_max_score=assessment.total_max_score,
        overall_feedback=submission.overall_feedback,
        overall_ai_feedback=submission.overall_ai_feedback,
        status=submission.status,
        submission_progress=submission.submission_progress,
        total_time_spent=submission.total_time_spent,
        started_at=submission.started_at,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at
    )
