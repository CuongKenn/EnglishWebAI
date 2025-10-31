"""
Exam Assessments Router
API endpoints for managing exam assessments (midterm/final exams)
imported from Word documents
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import os
import shutil
from pathlib import Path
import asyncio

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.exam import (
    ExamAssessmentCreate,
    ExamAssessmentUpdate,
    ExamAssessmentResponse,
    ExamAssessmentListItem,
    ExamSubmissionCreate,
    ExamSubmissionUpdate,
    ExamSubmissionSubmit,
    ExamSubmissionGrade,
    ExamSubmissionResponse,
    ExamImportResponse
)
from app.services.docx_service import docx_service
from app.services.openai_service import openai_service
from app.services.ai_grading_service import AIGradingService
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/api/v1/exam-assessments", tags=["Exam Assessments"])


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


def _ensure_student_access(db: Session, current_user: User, class_id: int) -> bool:
    """Check if student is enrolled in class"""
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.TEACHER):
        return True
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.classroom_id == class_id,
        Enrollment.student_id == current_user.id
    ).first()
    
    return enrollment is not None


async def _auto_grade_exam_submission(submission: ExamSubmission, exam: ExamAssessment, db: Session):
    """
    Auto-grade exam submission using AI Grading Service
    - Multiple choice, True/False, Fill blank: Auto-graded with AI semantic checking
    - Writing: ChatGPT AI (auto-graded, teacher can review)
    - Speaking: Azure Speech + ChatGPT (auto-graded, teacher can review)
    """
    content = exam.content or {}
    sections = content.get('sections', [])
    student_answers = submission.answers or {}
    
    # Check if this is a comprehensive test
    is_comprehensive = content.get('type') == 'comprehensive_test'
    
    if is_comprehensive:
        print(f"[AUTO-GRADE-EXAM] Comprehensive test detected for submission {submission.id}")
        try:
            grading_service = AIGradingService()
            
            # Get audio file path if exists
            audio_path = None
            if hasattr(submission, 'content_url') and submission.content_url:
                audio_path = submission.content_url.replace('/media/', './media/')
                if not os.path.exists(audio_path):
                    audio_path = None
            
            # Run async grading - NOW USING AWAIT
            grading_results = await grading_service.grade_comprehensive_submission(
                content,
                student_answers,
                audio_path
            )
            
            # Store detailed results
            submission.rubrics_scores = grading_results
            submission.ai_score = grading_results.get("total_score", 0)
            submission.score = grading_results.get("total_score", 0)
            
            # Generate feedback summary
            feedback_parts = []
            feedback_parts.append(f"🎧 Listening: {grading_results['listening']['total_points']:.1f}/2.5đ")
            feedback_parts.append(f"📖 Reading: {grading_results['reading']['total_points']:.1f}/2.5đ")
            feedback_parts.append(f"✍️ Writing: {grading_results['writing']['points_earned']:.1f}/2.5đ")
            feedback_parts.append(f"🗣️ Speaking: {grading_results['speaking']['points_earned']:.1f}/2.5đ")
            
            submission.ai_feedback = "\n".join(feedback_parts)
            submission.feedback = f"AI chấm tự động: {grading_results['total_score']:.1f}/10đ"
            submission.status = "graded"
            submission.graded_at = datetime.utcnow()
            
            print(f"[AUTO-GRADE-EXAM] Comprehensive test graded: {grading_results['total_score']:.1f}/10đ")
            return
            
        except Exception as e:
            print(f"[AUTO-GRADE-EXAM] Error grading comprehensive test: {e}")
            import traceback
            traceback.print_exc()
            # Don't raise, fall through to regular grading
    
    # Regular grading for section-based exams
    total_score = 0.0
    max_possible_score = exam.total_points or 10.0
    auto_graded_count = 0
    total_questions = 0
    has_essay = False
    question_results = []
    
    grading_service = AIGradingService()
    
    try:
        for section in sections:
            tasks = section.get('tasks', [])
            for task in tasks:
                questions = task.get('questions', [])
                for q in questions:
                    total_questions += 1
                    q_id = str(q.get('id', ''))
                    q_type = q.get('type', 'multiple_choice')
                    q_points = float(q.get('points', 0.5))
                    student_answer = student_answers.get(q_id, '')
                    
                    # Check if essay/short answer
                    if q_type in ['essay', 'short_answer']:
                        has_essay = True
                        question_results.append({
                            'question_id': q_id,
                            'type': q_type,
                            'points_earned': None,
                            'max_points': q_points,
                            'status': 'needs_manual_review'
                        })
                        continue
                    
                    # Auto-grade objective questions
                    try:
                        grade_result = None
                        
                        if q_type == 'multiple_choice':
                            grade_result = await grading_service.grade_multiple_choice(q, student_answer)
                        elif q_type == 'true_false':
                            grade_result = await grading_service.grade_true_false(q, student_answer)
                        elif q_type == 'fill_blank':
                            grade_result = await grading_service.grade_fill_blank(q, student_answer)
                        elif q_type == 'matching':
                            # Parse student answer if it's a string
                            if isinstance(student_answer, str):
                                try:
                                    student_answer = json.loads(student_answer)
                                except:
                                    student_answer = {}
                            grade_result = await grading_service.grade_matching(q, student_answer)
                        
                        if grade_result:
                            points_earned = grade_result.get('points_earned', 0)
                            total_score += points_earned
                            auto_graded_count += 1
                            
                            question_results.append({
                                'question_id': q_id,
                                'type': q_type,
                                'student_answer': student_answer,
                                'points_earned': points_earned,
                                'max_points': q_points,
                                'is_correct': grade_result.get('is_correct', False),
                                'feedback': grade_result.get('feedback', ''),
                                'status': 'auto_graded'
                            })
                    
                    except Exception as e:
                        print(f"[AUTO-GRADE-EXAM] Error grading question {q_id}: {e}")
                        question_results.append({
                            'question_id': q_id,
                            'type': q_type,
                            'error': str(e),
                            'status': 'grading_failed'
                        })
    
    except Exception as e:
        print(f"[AUTO-GRADE-EXAM] Error during auto-grading: {e}")
        import traceback
        traceback.print_exc()
    
    # Update submission with results
    if auto_graded_count > 0:
        if not submission.rubrics_scores:
            submission.rubrics_scores = {}
        
        submission.rubrics_scores['auto_grade_results'] = question_results
        submission.rubrics_scores['auto_graded_count'] = auto_graded_count
        submission.rubrics_scores['total_questions'] = total_questions
        submission.rubrics_scores['has_essay'] = has_essay
        
        if has_essay:
            # Has essay questions -> save as pending review
            submission.ai_score = total_score
            submission.ai_feedback = f"Tự động chấm {auto_graded_count}/{total_questions} câu. Điểm tạm thời: {total_score:.1f}/{max_possible_score}. Chờ giáo viên chấm {total_questions - auto_graded_count} câu tự luận."
            submission.status = "pending_review"
        else:
            # All objective -> fully graded
            submission.score = total_score
            submission.ai_score = total_score
            submission.feedback = f"Tự động chấm: {total_score:.1f}/{max_possible_score} điểm"
            submission.ai_feedback = f"Hoàn thành {auto_graded_count}/{total_questions} câu."
            submission.status = "graded"
            submission.graded_at = datetime.utcnow()
        
        print(f"[AUTO-GRADE-EXAM] Submission {submission.id}: {auto_graded_count}/{total_questions} auto-graded, score={total_score:.1f}/{max_possible_score}, has_essay={has_essay}")


# ============= Exam Management Endpoints =============
@router.post("/upload", response_model=ExamImportResponse)
async def upload_exam_from_word(
    file: UploadFile = File(...),
    exam_title: str = Form(...),
    class_id: int = Form(...),
    exam_type: str = Form(...),
    is_published: bool = Form(False),
    start_time: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse a Word document to create an exam
    
    Steps:
    1. Upload Word file
    2. Extract text and images using docx_service
    3. Send to OpenAI for parsing
    4. Create ExamAssessment in database
    """
    # Check permissions
    _ensure_teacher_access(db, current_user, class_id)
    
    # Validate file type - accept both .doc and .docx
    if not (file.filename.endswith('.docx') or file.filename.endswith('.doc')):
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận file Word (.docx hoặc .doc)"
        )
    
    # Validate exam type
    if exam_type not in ['midterm', 'final', 'quiz', 'practice']:
        raise HTTPException(
            status_code=400,
            detail="exam_type phải là: midterm, final, quiz, hoặc practice"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Save original file
        upload_dir = Path("media/exam_uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Extract content from Word file
        print(f"[upload_exam] Extracting content from {file.filename}...")
        extracted_content = docx_service.extract_content(file_content, save_images=True)
        
        print(f"[upload_exam] Extracted {len(extracted_content['paragraphs'])} paragraphs, {len(extracted_content['images'])} images")
        
        # Create prompt for OpenAI
        prompt = docx_service.create_exam_prompt(extracted_content, exam_type)
        
        # Parse with OpenAI
        print("[upload_exam] Sending to OpenAI for parsing...")
        response = openai_service.generate_content(prompt)
        
        # Parse JSON response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        parsed_content = json.loads(response_text)
        
        print(f"[upload_exam] Parsed exam: {parsed_content.get('exam_title')}")
        
        # Map image paths to relative URLs
        if extracted_content['images']:
            for section in parsed_content.get('sections', []):
                for task in section.get('tasks', []):
                    if task.get('has_images') and task.get('image_positions'):
                        task['image_urls'] = []
                        for img_idx in task['image_positions']:
                            if img_idx < len(extracted_content['images']):
                                img_info = extracted_content['images'][img_idx]
                                # Convert to relative URL
                                relative_path = img_info['relative_path']
                                task['image_urls'].append(f"/media/{relative_path}")
        
        # Parse timestamps
        start_dt = None
        end_dt = None
        if start_time:
            try:
                start_dt = datetime.fromisoformat(start_time)
            except:
                pass
        if end_time:
            try:
                end_dt = datetime.fromisoformat(end_time)
            except:
                pass
        
        # Create exam assessment
        # Use user-provided title, fallback to AI-parsed title if not provided
        final_title = exam_title.strip() if exam_title and exam_title.strip() else parsed_content.get('exam_title', f'Đề thi {exam_type}')
        
        exam = ExamAssessment(
            class_id=class_id,
            teacher_id=current_user.id,
            exam_type=exam_type,
            title=final_title,
            description=f"Đề thi được import từ file {file.filename}",
            original_filename=file.filename,
            file_path=str(file_path),
            content=parsed_content,
            answer_key=parsed_content.get('answer_key'),
            total_points=parsed_content.get('total_points', 10.0),
            duration=parsed_content.get('duration', 60),
            start_time=start_dt,
            end_time=end_dt,
            ai_parsed=True,
            is_active=True,
            is_published=is_published
        )
        
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        print(f"[upload_exam] Created exam assessment ID: {exam.id}")
        
        return ExamImportResponse(
            success=True,
            message="Đã import đề thi thành công",
            exam_id=exam.id,
            exam=ExamAssessmentResponse.from_orm(exam)
        )
        
    except json.JSONDecodeError as e:
        print(f"[upload_exam] JSON parse error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi phân tích nội dung từ AI: {str(e)}"
        )
    except Exception as e:
        print(f"[upload_exam] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xử lý file: {str(e)}"
        )


@router.get("/classes/{class_id}", response_model=List[ExamAssessmentListItem])
async def get_class_exams(
    class_id: int,
    exam_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all exams for a class"""
    # Check access
    if current_user.role == UserRole.STUDENT:
        if not _ensure_student_access(db, current_user, class_id):
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    else:
        _ensure_teacher_access(db, current_user, class_id)
    
    query = db.query(ExamAssessment).filter(
        ExamAssessment.class_id == class_id,
        ExamAssessment.is_active == True
    )
    
    # Students only see published exams
    if current_user.role == UserRole.STUDENT:
        query = query.filter(ExamAssessment.is_published == True)
    
    if exam_type:
        query = query.filter(ExamAssessment.exam_type == exam_type)
    
    exams = query.order_by(ExamAssessment.created_at.desc()).all()
    
    return exams


@router.get("/{exam_id}", response_model=ExamAssessmentResponse)
async def get_exam_detail(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get exam detail"""
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    # Check access
    if current_user.role == UserRole.STUDENT:
        if not _ensure_student_access(db, current_user, exam.class_id):
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")
        if not exam.is_published:
            raise HTTPException(status_code=403, detail="Đề thi chưa được công bố")
    else:
        _ensure_teacher_access(db, current_user, exam.class_id)
    
    return exam


@router.put("/{exam_id}", response_model=ExamAssessmentResponse)
async def update_exam(
    exam_id: int,
    update_data: ExamAssessmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update exam"""
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    _ensure_teacher_access(db, current_user, exam.class_id)
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(exam, key, value)
    
    db.commit()
    db.refresh(exam)
    
    return exam


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete (deactivate) exam"""
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    _ensure_teacher_access(db, current_user, exam.class_id)
    
    exam.is_active = False
    db.commit()
    
    return None


# ============= Student Submission Endpoints =============
@router.post("/submissions/start", response_model=ExamSubmissionResponse)
async def start_exam_submission(
    exam_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start an exam (create submission)"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Chỉ học sinh mới có thể làm bài thi")
    
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    if not exam.is_published:
        raise HTTPException(status_code=403, detail="Đề thi chưa được công bố")
    
    # Check if student is enrolled
    if not _ensure_student_access(db, current_user, exam.class_id):
        raise HTTPException(status_code=403, detail="Bạn không thuộc lớp này")
    
    # Check if already started
    existing = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.student_id == current_user.id
    ).first()
    
    if existing:
        return existing
    
    # Create new submission
    submission = ExamSubmission(
        exam_id=exam_id,
        student_id=current_user.id,
        answers={},
        status="in_progress"
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return submission


@router.put("/submissions/{submission_id}", response_model=ExamSubmissionResponse)
async def update_exam_submission(
    submission_id: int,
    update_data: ExamSubmissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update exam submission (save answers)"""
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    if submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")
    
    if submission.status == "submitted":
        raise HTTPException(status_code=400, detail="Bài thi đã nộp, không thể chỉnh sửa")
    
    # Update answers
    submission.answers = update_data.answers
    submission.status = update_data.status or "in_progress"
    
    db.commit()
    db.refresh(submission)
    
    return submission


@router.post("/submissions/{submission_id}/submit", response_model=ExamSubmissionResponse)
async def submit_exam(
    submission_id: int,
    submit_data: ExamSubmissionSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit exam for grading"""
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    if submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền nộp bài")
    
    if submission.status == "submitted":
        raise HTTPException(status_code=400, detail="Bài thi đã được nộp")
    
    # Get exam details
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    # Update submission
    submission.answers = submit_data.answers
    submission.status = "submitted"
    submission.submitted_at = datetime.utcnow()
    
    # Auto-grade objective questions
    try:
        await _auto_grade_exam_submission(submission, exam, db)
        print(f"[SUBMIT-EXAM] Auto-grading completed for submission {submission.id}")
    except Exception as e:
        print(f"[SUBMIT-EXAM] Error auto-grading submission {submission.id}: {e}")
        import traceback
        traceback.print_exc()
        # Don't fail the submission if auto-grading fails
    
    db.commit()
    db.refresh(submission)
    
    # Notify parents about submission
    try:
        NotificationService.notify_parents_on_exam_submission(db, submission)
    except Exception as e:
        print(f"[SUBMIT-EXAM] Error creating notification: {e}")
    
    return submission


@router.get("/submissions/exam/{exam_id}", response_model=List[ExamSubmissionResponse])
async def get_exam_submissions(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for an exam (teacher only)"""
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == exam_id).first()
    
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    _ensure_teacher_access(db, current_user, exam.class_id)
    
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id
    ).order_by(ExamSubmission.submitted_at.desc()).all()
    
    return submissions


@router.get("/submissions/my/{exam_id}", response_model=ExamSubmissionResponse)
async def get_my_exam_submission(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's own submission for an exam"""
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Chưa có bài làm")
    
    return submission


@router.post("/submissions/{submission_id}/auto-grade", response_class=JSONResponse)
async def auto_grade_exam_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Auto-grade exam submission (teacher triggered)
    - Multiple choice, True/False, Fill blank: Auto-graded with AI
    - Writing: ChatGPT AI grading
    - Speaking: Azure Speech + ChatGPT grading
    """
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    
    # Check permissions
    _ensure_teacher_access(db, current_user, exam.class_id)
    
    try:
        await _auto_grade_exam_submission(submission, exam, db)
        db.commit()
        db.refresh(submission)
        
        return JSONResponse(content={
            "success": True,
            "message": "Đã chấm tự động thành công",
            "submission": {
                "id": submission.id,
                "score": submission.score,
                "ai_score": submission.ai_score,
                "feedback": submission.feedback,
                "ai_feedback": submission.ai_feedback,
                "status": submission.status,
                "rubrics_scores": submission.rubrics_scores
            }
        })
    except Exception as e:
        print(f"[AUTO-GRADE-EXAM] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi chấm tự động: {str(e)}")


@router.post("/submissions/{submission_id}/grade", response_model=ExamSubmissionResponse)
async def grade_exam_submission(
    submission_id: int,
    grade_data: ExamSubmissionGrade,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grade exam submission (teacher only)"""
    submission = db.query(ExamSubmission).filter(
        ExamSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài làm")
    
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
    _ensure_teacher_access(db, current_user, exam.class_id)
    
    # Update grade
    submission.score = grade_data.score
    submission.rubrics_scores = grade_data.rubrics_scores
    submission.feedback = grade_data.feedback
    submission.status = "graded"
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    # Notify parents about grading
    try:
        teacher_name = current_user.full_name or current_user.username
        NotificationService.notify_parents_on_exam_grading(db, submission, teacher_name)
        
        # If low score, send warning
        if submission.score and submission.score < 5.0:
            NotificationService.notify_parents_on_exam_low_score(db, submission)
    except Exception as e:
        print(f"[EXAM-GRADE] Error creating notification: {e}")
    
    return submission

