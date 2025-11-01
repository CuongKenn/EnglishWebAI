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


async def _auto_grade_exam_submission(submission: ExamSubmission, db: Session):
    """
    Auto-grade exam submission using AI
    - Grades objective questions (multiple choice, true/false, fill blank, matching)
    - Grades speaking with Azure Speech + ChatGPT
    - For writing, uses ChatGPT
    """
    exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
    if not exam:
        return
    
    content = exam.content or {}
    sections = content.get('sections', [])
    student_answers = submission.answers or {}
    
    total_score = 0.0
    total_possible = exam.total_points or 10.0
    graded_results = {}
    auto_graded_count = 0
    total_questions = 0
    has_speaking = False
    has_writing = False
    
    # Initialize AI grading service for speaking/writing
    ai_grading_service = AIGradingService()
    
    # Grade each section's questions
    for section in sections:
        section_name = section.get('section_name', '')
        
        for task in section.get('tasks', []):
            for question in task.get('questions', []):
                total_questions += 1
                q_id = str(question.get('question_id', ''))
                q_type = question.get('question_type', '')
                q_points = float(question.get('points', 0))
                correct_answer = question.get('correct_answer')
                student_answer = student_answers.get(q_id, '')
                
                result = {
                    'question_id': q_id,
                    'type': q_type,
                    'points': q_points,
                    'student_answer': student_answer,
                    'correct_answer': correct_answer,
                    'correct': False,
                    'earned': 0.0
                }
                
                # Auto-grade based on question type
                if q_type == 'multiple_choice':
                    is_correct = str(student_answer).strip().upper() == str(correct_answer).strip().upper()
                    result['correct'] = is_correct
                    result['earned'] = q_points if is_correct else 0.0
                    total_score += result['earned']
                    auto_graded_count += 1
                    
                elif q_type == 'true_false':
                    is_correct = str(student_answer).strip().lower() == str(correct_answer).strip().lower()
                    result['correct'] = is_correct
                    result['earned'] = q_points if is_correct else 0.0
                    total_score += result['earned']
                    auto_graded_count += 1
                    
                elif q_type == 'fill_blank':
                    # Normalized string comparison (trim, lowercase, collapse spaces)
                    def _norm(x):
                        return " ".join(str(x if x is not None else "").strip().lower().split())
                    is_correct = _norm(student_answer) == _norm(correct_answer)
                    result['correct'] = is_correct
                    result['earned'] = q_points if is_correct else 0.0
                    total_score += result['earned']
                    auto_graded_count += 1
                    
                elif q_type == 'matching':
                    # For matching, student_answer should be a dict
                    if isinstance(student_answer, dict) and isinstance(correct_answer, dict):
                        correct_pairs = sum(1 for k, v in correct_answer.items() if student_answer.get(k) == v)
                        total_pairs = len(correct_answer)
                        score_percent = (correct_pairs / total_pairs) if total_pairs > 0 else 0
                        result['correct'] = (correct_pairs == total_pairs)
                        result['earned'] = q_points * score_percent
                        result['correct_pairs'] = correct_pairs
                        result['total_pairs'] = total_pairs
                        total_score += result['earned']
                        auto_graded_count += 1
                    else:
                        result['earned'] = 0.0
                        result['status'] = 'invalid_format'
                        
                elif q_type in ['short_answer', 'essay']:
                    # Grade writing with ChatGPT
                    result['status'] = 'pending_review'
                    has_writing = True
                    
                    if student_answer and isinstance(student_answer, str) and student_answer.strip():
                        try:
                            question_text = question.get('question_text', '')
                            rubric = question.get('rubric', {})
                            
                            writing_result = await ai_grading_service.grade_writing(
                                question={'rubric': rubric, 'points': q_points},
                                student_text=student_answer,  # FIXED: changed from student_answer to student_text
                                prompt=question_text
                            )
                            
                            earned_points = writing_result.get('points_earned', 0)
                            result['earned'] = round(earned_points, 2)
                            result['ai_feedback'] = writing_result.get('feedback', {})
                            result['status'] = 'ai_graded'
                            total_score += result['earned']
                            auto_graded_count += 1
                            
                            print(f"[AUTO-GRADE-EXAM] Writing Q{q_id} graded: {result['earned']}/{q_points}")
                        except Exception as e:
                            print(f"[AUTO-GRADE-EXAM] Error grading writing Q{q_id}: {e}")
                            result['status'] = 'grading_error'
                            result['error'] = str(e)
                    
                elif q_type == 'speaking':
                    # Grade speaking with Azure Speech + ChatGPT
                    result['status'] = 'pending_review'
                    has_speaking = True
                    
                    # Check if student uploaded audio file
                    audio_path = None
                    if isinstance(student_answer, dict):
                        audio_path = student_answer.get('audio_file')
                    elif isinstance(student_answer, str):
                        audio_path = student_answer
                    
                    if audio_path:
                        try:
                            # Convert to absolute path - handle various formats
                            if audio_path.startswith('/media/'):
                                audio_path = audio_path.replace('/media/', 'media/')
                            elif audio_path.startswith('media/'):
                                pass  # Already correct
                            elif not audio_path.startswith('/'):
                                # Relative path, prepend media/
                                audio_path = f'media/{audio_path}'
                            
                            print(f"[AUTO-GRADE-EXAM] Checking audio path: {audio_path}")
                            
                            if os.path.exists(audio_path):
                                reference_text = question.get('reference_text', '') or question.get('question_text', '')
                                question_text = question.get('question_text', '')
                                
                                # Step 1: Azure pronunciation assessment
                                print(f"[AUTO-GRADE-EXAM] Grading speaking Q{q_id} with Azure...")
                                pronunciation_result = await ai_grading_service.grade_speaking_pronunciation(
                                    audio_path,
                                    reference_text
                                )
                                
                                # Step 2: ChatGPT content grading
                                recognized_text = pronunciation_result.get("recognized_text", "")
                                
                                if recognized_text and pronunciation_result.get("success"):
                                    print(f"[AUTO-GRADE-EXAM] Recognized text: {recognized_text}")
                                    print(f"[AUTO-GRADE-EXAM] Grading speaking content Q{q_id} with ChatGPT...")
                                    rubric = question.get('rubric', {})
                                    
                                    content_result = await ai_grading_service.grade_speaking_content(
                                        recognized_text,
                                        question_text,
                                        {'points': q_points, **rubric}
                                    )
                                    
                                    # Combine scores: 50% pronunciation, 50% content
                                    pronunciation_score = pronunciation_result.get("pronunciation_score", 0) / 100 * (q_points / 2)
                                    content_score = content_result.get("content_score", 0)
                                    total_speaking_score = pronunciation_score + content_score
                                    
                                    result['earned'] = round(min(total_speaking_score, q_points), 2)
                                    result['pronunciation'] = pronunciation_result
                                    result['content'] = content_result
                                    
                                    # Detailed feedback structure
                                    result['ai_feedback'] = {
                                        # Azure pronunciation metrics
                                        'pronunciation_score': pronunciation_result.get('pronunciation_score', 0),
                                        'fluency_score': pronunciation_result.get('fluency_score', 0),
                                        'accuracy_score': pronunciation_result.get('accuracy_score', 0),
                                        'completeness_score': pronunciation_result.get('completeness_score', 0),
                                        'transcript': recognized_text,
                                        
                                        # ChatGPT detailed feedback
                                        'content_feedback': content_result.get('content_feedback', ''),
                                        'grammar_feedback': content_result.get('grammar_feedback', ''),
                                        'vocabulary_feedback': content_result.get('vocabulary_feedback', ''),
                                        'pronunciation_note': content_result.get('pronunciation_note', ''),
                                        
                                        # Strengths and improvements
                                        'strengths': content_result.get('strengths', []),
                                        'improvements': content_result.get('improvements', []),
                                        'suggestions': content_result.get('suggestions', []),
                                        
                                        # Overall
                                        'overall_comment': content_result.get('overall_comment', ''),
                                        'content_score': content_result.get('content_score', 0)
                                    }
                                    result['status'] = 'ai_graded'
                                    total_score += result['earned']
                                    auto_graded_count += 1
                                    
                                    print(f"[AUTO-GRADE-EXAM] Speaking Q{q_id} graded: {result['earned']}/{q_points}")
                                else:
                                    result['status'] = 'recognition_failed'
                                    result['error'] = pronunciation_result.get('error', 'Không thể nhận diện giọng nói')
                                    print(f"[AUTO-GRADE-EXAM] Speaking Q{q_id} recognition failed: {result['error']}")
                            else:
                                result['status'] = 'audio_not_found'
                                result['error'] = f'File audio không tồn tại: {audio_path}'
                                print(f"[AUTO-GRADE-EXAM] Audio file not found: {audio_path}")
                        except Exception as e:
                            print(f"[AUTO-GRADE-EXAM] Error grading speaking Q{q_id}: {e}")
                            import traceback
                            traceback.print_exc()
                            result['status'] = 'grading_error'
                            result['error'] = str(e)
                    
                graded_results[q_id] = result
    
    # Update submission with auto-grade results
    submission.ai_score = round(total_score, 2)
    submission.rubrics_scores = {
        'auto_grade_results': graded_results,
        'auto_graded_count': auto_graded_count,
        'total_questions': total_questions,
        'has_speaking': has_speaking,
        'has_writing': has_writing,
        'total_auto_score': round(total_score, 2),
        'max_possible_score': total_possible
    }
    
    # If all questions are auto-graded and no speaking/writing, set status to pending_review
    if auto_graded_count == total_questions:
        submission.status = "pending_review"
    else:
        submission.status = "pending_review"  # Still needs teacher review
    
    print(f"[_auto_grade_exam_submission] Exam submission {submission.id}: {auto_graded_count}/{total_questions} auto-graded, score={total_score}/{total_possible}")



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
    if current_user.role == UserRole.USER:
        if not _ensure_student_access(db, current_user, class_id):
            raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    else:
        _ensure_teacher_access(db, current_user, class_id)
    
    query = db.query(ExamAssessment).filter(
        ExamAssessment.class_id == class_id,
        ExamAssessment.is_active == True
    )
    
    # Students only see published exams
    if current_user.role == UserRole.USER:
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
    if current_user.role == UserRole.USER:
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
    if current_user.role != UserRole.USER:
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
    
    # Auto-grade objective questions immediately
    try:
        await _auto_grade_exam_submission(submission, db)
    except Exception as e:
        print(f"[submit_exam] Auto-grade error: {e}")
        import traceback
        traceback.print_exc()
        # Continue even if auto-grade fails
    
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
        await _auto_grade_exam_submission(submission, db)
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


@router.get("/submissions/class/{class_id}")
async def get_class_exam_submissions(
    class_id: int,
    exam_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all exam submissions for a class (teacher only)
    Can filter by exam_id and status
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # Build query
    query = db.query(ExamSubmission).join(
        ExamAssessment, ExamSubmission.exam_id == ExamAssessment.id
    ).filter(ExamAssessment.class_id == class_id)
    
    if exam_id:
        query = query.filter(ExamSubmission.exam_id == exam_id)
    
    if status:
        query = query.filter(ExamSubmission.status == status)
    
    submissions = query.order_by(ExamSubmission.submitted_at.desc()).all()
    
    # Build response with student info
    result = []
    for submission in submissions:
        student = db.query(User).filter(User.id == submission.student_id).first()
        exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
        
        result.append({
            "id": submission.id,
            "exam_id": submission.exam_id,
            "exam_title": exam.title if exam else "Unknown",
            "exam_type": exam.exam_type if exam else "unknown",
            "student_id": submission.student_id,
            "student_name": student.full_name if student else "Unknown",
            "student_email": student.email if student else "",
            "answers": submission.answers,
            "score": submission.score,
            "ai_score": submission.ai_score,
            "rubrics_scores": submission.rubrics_scores,
            "feedback": submission.feedback,
            "ai_feedback": submission.ai_feedback,
            "error_analysis": submission.error_analysis,
            "status": submission.status,
            "started_at": submission.started_at.isoformat() if submission.started_at else None,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
        })
    
    return result
    
    db.commit()
    db.refresh(submission)
    
    return submission

