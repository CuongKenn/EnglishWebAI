from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.enrollment import Enrollment
from app.models.classroom import Classroom
from app.schemas.student import (
    ExerciseListResponse,
    ExerciseResponse,
    ExerciseCreate,
    ExerciseUpdate,
)
from pydantic import BaseModel

router = APIRouter()


# Schemas for submission
class SubmissionCreate(BaseModel):
    content_text: Optional[str] = None
    content_url: Optional[str] = None
    answers: Optional[dict] = None  # {question_id: answer_value}


class SubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: Optional[str]
    content_url: Optional[str]
    answers: Optional[dict]
    score: Optional[float]
    ai_score: Optional[float]
    feedback: Optional[str]
    ai_feedback: Optional[str]
    rubrics_scores: Optional[dict]
    status: str
    submitted_at: datetime


class GradeRequest(BaseModel):
    score: float
    feedback: Optional[str] = None
    rubrics_scores: Optional[dict] = None


class AIGradeRequest(BaseModel):
    submission_id: int
    ai_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    rubrics_scores: Optional[dict] = None
    graded_at: Optional[datetime]
    ai_graded_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExerciseDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    skill_type: Optional[str]
    max_score: Optional[int]
    due_at: Optional[datetime]
    duration: Optional[int]
    content: Optional[dict]
    created_at: datetime
    class_id: Optional[int]
    class_name: Optional[str]
    lesson_id: Optional[int]
    lesson_title: Optional[str]
    my_submission: Optional[SubmissionResponse]

    class Config:
        from_attributes = True

# Helper function for auto-grading
def _auto_grade_submission(submission: Submission, exercise: Exercise, db: Session):
    """
    Tự động chấm điểm:
    - Trắc nghiệm (multiple_choice, true_false, fill_blank): Chấm ngay
    - Tự luận (short_answer): Đợi teacher
    - Speaking: Azure Speech API (chấm tự động, teacher có thể confirm)
    - Writing: Gemini AI (chấm tự động, teacher có thể confirm)
    """
    skill_type = exercise.skill_type
    
    # Helper to get a speaking reference text from exercise content
    def _extract_speaking_reference_text(content: Optional[dict]) -> str:
        if not content or not isinstance(content, dict):
            return ''
        # Direct prompt on content
        ref = content.get('prompt') or content.get('reference_text')
        if ref:
            return ref
        # Try find first speaking-like question
        questions = content.get('questions') or []
        if isinstance(questions, list):
            for q in questions:
                qtype = (q or {}).get('type')
                if qtype in ('speaking', 'pronunciation', 'speech'):
                    return q.get('prompt') or q.get('text') or q.get('expected_text') or ''
        return ''

    # Speaking: Use Azure Speech API (works for speaking skill or mixed tests if we have audio + reference)
    if submission.content_url:
        print(f"[AUTO-GRADE] Speaking exercise detected for submission {submission.id}")
        # Import service
        from app.services.azure_speech_service import azure_speech_service
        
        # Get reference text from exercise content
        content = exercise.content
        reference_text = _extract_speaking_reference_text(content)
        
        if reference_text and submission.content_url:
            try:
                # Get audio file path (assuming it's stored locally)
                audio_path = submission.content_url.replace('/media/', './media/')
                
                # Assess pronunciation
                assessment = azure_speech_service.assess_pronunciation(audio_path, reference_text)
                
                # Calculate score
                score_result = azure_speech_service.calculate_speaking_score(
                    assessment, 
                    float(exercise.max_score or 10)
                )
                
                submission.ai_score = score_result['score']
                submission.ai_feedback = score_result['feedback']
                submission.rubrics_scores = {
                    'speaking_assessment': score_result['breakdown'],
                    'recognized_text': score_result.get('recognized_text', ''),
                    'detailed_feedback': score_result.get('detailed_feedback', '')
                }
                submission.status = "pending_review"  # Teacher can confirm
                submission.ai_graded_at = datetime.utcnow()
                
                print(f"[AUTO-GRADE] Speaking graded: {score_result['score']}/{exercise.max_score}")
                return
                
            except Exception as e:
                print(f"[AUTO-GRADE] Speaking error: {str(e)}")
                submission.ai_feedback = f"Lỗi chấm speaking: {str(e)}"
                submission.status = "pending_review"
                return
    
    # Writing: Use Gemini AI
    if skill_type == 'writing' and submission.content_text:
        print(f"[AUTO-GRADE] Writing exercise detected for submission {submission.id}")
        # Import service
        from app.services.gemini_service import gemini_service
        import asyncio
        
        # Get writing prompt
        content = exercise.content
        prompt = content.get('prompt', '') if content else ''
        
        try:
            # Grade writing
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            grading_result = loop.run_until_complete(
                gemini_service.grade_writing(
                    submission.content_text,
                    prompt=prompt,
                    max_score=float(exercise.max_score or 10)
                )
            )
            loop.close()
            
            submission.ai_score = grading_result['score']
            submission.ai_feedback = grading_result['feedback']
            submission.rubrics_scores = {
                'writing_assessment': grading_result['breakdown'],
                'word_count': grading_result['word_count'],
                'strengths': grading_result['strengths'],
                'improvements': grading_result['improvements'],
                'corrections': grading_result['corrections'],
                'suggestions': grading_result['suggestions']
            }
            submission.status = "pending_review"  # Teacher can confirm
            submission.ai_graded_at = datetime.utcnow()
            
            print(f"[AUTO-GRADE] Writing graded: {grading_result['score']}/{exercise.max_score}")
            return
            
        except Exception as e:
            print(f"[AUTO-GRADE] Writing error: {str(e)}")
            submission.ai_feedback = f"Lỗi chấm writing: {str(e)}"
            submission.status = "pending_review"
            return
    
    # Multiple choice questions (for comprehensive tests, reading, listening)
    if not submission.answers:
        return
    
    # Lấy nội dung bài tập
    content = exercise.content
    if not content or not isinstance(content, dict):
        return
    
    # Lấy danh sách câu hỏi
    questions = content.get('questions', [])
    if not questions:
        return
    
    total_score = 0.0
    max_possible_score = 0.0
    has_short_answer = False
    auto_graded_count = 0
    total_questions = len(questions)
    
    # Tạo dict để lưu kết quả từng câu
    question_results = {}
    
    for q in questions:
        q_id = str(q.get('id'))
        q_type = q.get('type', '')
        q_points = float(q.get('points', 1))
        correct_answer = q.get('correct_answer', '')
        
        max_possible_score += q_points
        
        # Nếu là câu tự luận, bỏ qua
        if q_type == 'short_answer':
            has_short_answer = True
            question_results[q_id] = {
                'type': 'short_answer',
                'points': q_points,
                'status': 'pending_review',
                'student_answer': submission.answers.get(q_id, '')
            }
            continue
        
        # Lấy câu trả lời của học sinh
        student_answer = submission.answers.get(q_id, '')
        
        # Chấm điểm cho các loại câu trắc nghiệm
        if q_type in ['multiple_choice', 'true_false']:
            # So sánh chính xác (case-sensitive)
            is_correct = (str(student_answer).strip() == str(correct_answer).strip())
            earned_points = q_points if is_correct else 0.0
            total_score += earned_points
            auto_graded_count += 1
            
            question_results[q_id] = {
                'type': q_type,
                'points': q_points,
                'earned': earned_points,
                'correct': is_correct,
                'student_answer': student_answer,
                'correct_answer': correct_answer
            }
        
        elif q_type == 'fill_blank':
            # So sánh không phân biệt hoa thường và khoảng trắng
            student_ans_normalized = str(student_answer).strip().lower()
            correct_ans_normalized = str(correct_answer).strip().lower()
            is_correct = (student_ans_normalized == correct_ans_normalized)
            earned_points = q_points if is_correct else 0.0
            total_score += earned_points
            auto_graded_count += 1
            
            question_results[q_id] = {
                'type': q_type,
                'points': q_points,
                'earned': earned_points,
                'correct': is_correct,
                'student_answer': student_answer,
                'correct_answer': correct_answer
            }
    
    # Cập nhật submission
    if auto_graded_count > 0:
        # Lưu kết quả chi tiết
        if not submission.rubrics_scores:
            submission.rubrics_scores = {}
        submission.rubrics_scores['auto_grade_results'] = question_results
        submission.rubrics_scores['auto_graded_count'] = auto_graded_count
        submission.rubrics_scores['total_questions'] = total_questions
        submission.rubrics_scores['has_short_answer'] = has_short_answer
        
        if has_short_answer:
            # Có câu tự luận -> chỉ lưu điểm tự động, chờ giáo viên chấm thêm
            submission.ai_score = total_score
            submission.ai_feedback = f"Tự động chấm {auto_graded_count}/{total_questions} câu trắc nghiệm. Điểm tạm thời: {total_score}/{max_possible_score}. Chờ giáo viên chấm {total_questions - auto_graded_count} câu tự luận."
            submission.status = "pending_review"  # Đợi giáo viên review
            submission.ai_graded_at = datetime.utcnow()
        else:
            # Toàn trắc nghiệm -> chấm luôn
            submission.score = total_score
            submission.ai_score = total_score
            submission.feedback = f"Tự động chấm: {total_score}/{max_possible_score} điểm"
            submission.ai_feedback = f"Hoàn thành {auto_graded_count}/{total_questions} câu đúng."
            submission.status = "graded"  # Đã chấm xong
            submission.graded_at = datetime.utcnow()
            submission.ai_graded_at = datetime.utcnow()
        
        print(f"[AUTO-GRADE] Submission {submission.id}: {auto_graded_count}/{total_questions} auto-graded, score={total_score}/{max_possible_score}, has_essay={has_short_answer}")

@router.post("/teacher-grading/submissions/{submission_id}/auto-grade", response_class=JSONResponse)
async def auto_grade_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chấm tự động server-side cho một submission:
    - Speaking: Azure Speech (nếu có content_url audio)
    - Writing: Gemini (nếu có content_text)
    - Trắc nghiệm: Dùng logic chấm tự động sẵn có
    Sau khi chấm, đặt status = pending_review để giáo viên xem và xác nhận.
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài nộp")

    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")

    # Permission: must be teacher of the class
    class_id = _get_exercise_class_id(db, exercise)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))

    try:
        # Prefer specialized grading when possible
        ran_specialized = False
        if submission.content_url and (exercise.skill_type == 'speaking' or exercise.skill_type is None):
            # Speaking auto-grade
            from app.services.azure_speech_service import azure_speech_service
            content = exercise.content or {}
            reference_text = content.get('prompt', '')
            if reference_text and submission.content_url.startswith("/media/"):
                audio_path = submission.content_url.replace('/media/', './media/')
                assessment = azure_speech_service.assess_pronunciation(audio_path, reference_text)
                score_result = azure_speech_service.calculate_speaking_score(
                    assessment,
                    float(exercise.max_score or 10)
                )
                submission.ai_score = score_result['score']
                submission.ai_feedback = score_result['feedback']
                submission.rubrics_scores = {
                    'speaking_assessment': score_result['breakdown'],
                    'recognized_text': score_result.get('recognized_text', ''),
                    'detailed_feedback': score_result.get('detailed_feedback', '')
                }
                submission.status = "pending_review"
                submission.ai_graded_at = datetime.utcnow()
                ran_specialized = True

        if (not ran_specialized) and submission.content_text and (exercise.skill_type == 'writing' or exercise.skill_type is None):
            # Writing auto-grade
            from app.services.gemini_service import gemini_service
            import asyncio
            content = exercise.content or {}
            prompt = content.get('prompt', '')
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            grading_result = loop.run_until_complete(
                gemini_service.grade_writing(
                    submission.content_text,
                    prompt=prompt,
                    max_score=float(exercise.max_score or 10)
                )
            )
            loop.close()
            submission.ai_score = grading_result['score']
            submission.ai_feedback = grading_result['feedback']
            submission.rubrics_scores = {
                'writing_assessment': grading_result['breakdown'],
                'word_count': grading_result['word_count'],
                'strengths': grading_result['strengths'],
                'improvements': grading_result['improvements'],
                'corrections': grading_result['corrections'],
                'suggestions': grading_result['suggestions']
            }
            submission.status = "pending_review"
            submission.ai_graded_at = datetime.utcnow()
            ran_specialized = True

        if not ran_specialized:
            # Fallback to generic auto-grade (MC/TF/FillBlank, etc.)
            _auto_grade_submission(submission, exercise, db)

        db.commit()
        db.refresh(submission)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi chấm tự động: {str(e)}")

    # Build response similar to listing
    result = {
        "id": submission.id,
        "exercise_id": submission.exercise_id,
        "student_id": submission.student_id,
        "content_text": submission.content_text,
        "content_url": submission.content_url,
        "answers": submission.answers,
        "score": submission.score,
        "ai_score": submission.ai_score,
        "feedback": submission.feedback,
        "ai_feedback": submission.ai_feedback,
        "rubrics_scores": submission.rubrics_scores,
        "status": submission.status,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
    }
    return JSONResponse(content=result)
@router.get("/", response_model=List[ExerciseDetailResponse])
async def get_exercises(
    class_id: Optional[int] = None,
    status: Optional[str] = None,  # pending | submitted | graded
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách bài tập của học sinh
    - Lọc theo lớp học (nếu có)
    - Lọc theo trạng thái (chưa làm, đã nộp, đã chấm)
    """
    print(f"[GET /exercises/] User {current_user.id} ({current_user.email}) requesting exercises")
    
    # Lấy danh sách lớp học sinh đã tham gia
    enrolled_class_ids = (
        db.query(Enrollment.class_id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
        .all()
    )
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    print(f"[GET /exercises/] Enrolled classes: {enrolled_class_ids}")
    
    if not enrolled_class_ids:
        print(f"[GET /exercises/] No enrolled classes found!")
        return []
    
    # Query exercises từ các lớp đã tham gia
    query = db.query(Exercise).filter(Exercise.class_id.in_(enrolled_class_ids))
    
    # Filter by specific class
    if class_id:
        query = query.filter(Exercise.class_id == class_id)
    
    # Get exercises
    exercises = query.order_by(Exercise.due_at.desc().nulls_last(), Exercise.created_at.desc()).offset(skip).limit(limit).all()
    
    print(f"[GET /exercises/] Found {len(exercises)} exercises")
    
    # Get class names
    class_map = {}
    classrooms = db.query(Classroom).filter(Classroom.id.in_(enrolled_class_ids)).all()
    for c in classrooms:
        class_map[c.id] = c.name
    
    # Get submissions for current user
    exercise_ids = [e.id for e in exercises]
    submissions = {}
    if exercise_ids:
        subs = (
            db.query(Submission)
            .filter(
                Submission.exercise_id.in_(exercise_ids),
                Submission.student_id == current_user.id
            )
            .all()
        )
        print(f"[GET /exercises/] Found {len(subs)} submissions for user")
        for sub in subs:
            submissions[sub.exercise_id] = sub
    
    # Build response
    result = []
    for exercise in exercises:
        my_sub = submissions.get(exercise.id)
        
        # Filter by status if requested
        if status:
            if status == "pending" and my_sub is not None:
                continue
            elif status == "submitted" and (my_sub is None or my_sub.status != "submitted"):
                continue
            elif status == "graded" and (my_sub is None or my_sub.status != "graded"):
                continue
        
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description,
            "type": exercise.type,
            "skill_type": exercise.skill_type,
            "max_score": exercise.max_score,
            "due_at": exercise.due_at,
            "duration": exercise.duration,
            "content": exercise.content,
            "created_at": exercise.created_at,
            "class_id": exercise.class_id,
            "class_name": class_map.get(exercise.class_id),
            "lesson_id": exercise.lesson_id,
            "lesson_title": None,  # TODO: get from lesson if needed
            "my_submission": my_sub
        })
    
    print(f"[GET /exercises/] Returning {len(result)} exercises to frontend")
    return result


@router.get("/my-submissions", response_class=JSONResponse)
async def get_my_submissions(
    status: Optional[str] = None,
    exercise_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tất cả bài nộp của học sinh
    Query params:
    - status: Lọc theo trạng thái (draft, submitted, graded, late)
    - exercise_id: Lọc theo bài tập cụ thể
    - skip, limit: Phân trang
    """
    print(f"[GET /my-submissions] User {current_user.id} requesting submissions (status={status}, exercise_id={exercise_id})")
    
    try:
        query = db.query(Submission).filter(
            Submission.student_id == current_user.id
        )
        
        # Apply filters
        if status:
            query = query.filter(Submission.status == status)
        if exercise_id:
            query = query.filter(Submission.exercise_id == exercise_id)
        
        submissions = query.order_by(Submission.submitted_at.desc()).offset(skip).limit(limit).all()
        
        print(f"[GET /my-submissions] Found {len(submissions)} submissions")
        
        # Get exercise info for each submission
        exercise_ids = [sub.exercise_id for sub in submissions]
        exercises_map = {}
        if exercise_ids:
            exercises = db.query(Exercise).filter(Exercise.id.in_(exercise_ids)).all()
            for ex in exercises:
                exercises_map[ex.id] = ex
        
        # Convert to list of dicts to avoid serialization issues
        result = []
        for sub in submissions:
            exercise = exercises_map.get(sub.exercise_id)
            result.append({
                "id": sub.id,
                "exercise_id": sub.exercise_id,
                "student_id": sub.student_id,
                "content_text": sub.content_text,
                "content_url": sub.content_url,
                "answers": sub.answers,
                "score": sub.score,
                "ai_score": sub.ai_score,
                "feedback": sub.feedback,
                "ai_feedback": sub.ai_feedback,
                "rubrics_scores": sub.rubrics_scores,
                "status": sub.status,
                "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
                "ai_graded_at": sub.ai_graded_at.isoformat() if sub.ai_graded_at else None,
                "exercise": {
                    "id": exercise.id,
                    "title": exercise.title,
                    "type": exercise.type,
                    "skill_type": exercise.skill_type,
                    "max_score": exercise.max_score,
                    "due_at": exercise.due_at.isoformat() if exercise.due_at else None,
                } if exercise else None
            })
        
        print(f"[GET /my-submissions] Returning {len(result)} submissions")
        return JSONResponse(content=result)
    except Exception as e:
        print(f"[GET /my-submissions] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{exercise_id}", response_model=ExerciseDetailResponse)
async def get_exercise(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một bài tập
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    
    # Check if student has access (enrolled in class)
    if current_user.role == UserRole.USER:
        enrollment = db.query(Enrollment).filter(
            Enrollment.class_id == exercise.class_id,
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        ).first()
        
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chưa tham gia lớp học này"
            )
    
    # Get class name
    class_name = None
    if exercise.class_id:
        classroom = db.query(Classroom).filter(Classroom.id == exercise.class_id).first()
        if classroom:
            class_name = classroom.name
    
    # Get student's submission
    my_submission = None
    if current_user.role == UserRole.USER:
        my_submission = db.query(Submission).filter(
            Submission.exercise_id == exercise_id,
            Submission.student_id == current_user.id
        ).order_by(Submission.submitted_at.desc()).first()
    
    return {
        "id": exercise.id,
        "title": exercise.title,
        "description": exercise.description,
        "type": exercise.type,
        "skill_type": exercise.skill_type,
        "max_score": exercise.max_score,
        "due_at": exercise.due_at,
        "duration": exercise.duration,
        "content": exercise.content,
        "created_at": exercise.created_at,
        "class_id": exercise.class_id,
        "class_name": class_name,
        "lesson_id": exercise.lesson_id,
        "lesson_title": None,
        "my_submission": my_submission
    }

@router.post("/{exercise_id}/submit", response_model=SubmissionResponse)
async def submit_exercise(
    exercise_id: int,
    audio_file: Optional[UploadFile] = File(None),
    answers: Optional[str] = Form(None),
    content_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Nộp bài tập - Hỗ trợ cả JSON và multipart/form-data
    """
    import json
    import os
    
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    
    # Check if student has access
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == exercise.class_id,
        Enrollment.user_id == current_user.id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa tham gia lớp học này"
        )
    
    # Parse answers if it's a JSON string
    parsed_answers = None
    if answers:
        try:
            parsed_answers = json.loads(answers) if isinstance(answers, str) else answers
        except:
            parsed_answers = None
    
    # Handle audio file upload for speaking exercises
    audio_url = None
    if audio_file:
        try:
            # Create upload directory if not exists
            upload_dir = "./media/speaking_submissions"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            # Keep original extension if available, default to .wav
            orig_name = audio_file.filename or "audio.wav"
            ext = ''.join(orig_name.split('.')[-1:]) or 'wav'
            filename = f"student_{current_user.id}_ex_{exercise_id}_{timestamp}.{ext}"
            file_path = os.path.join(upload_dir, filename)
            
            # Save file
            with open(file_path, "wb") as f:
                content = await audio_file.read()
                f.write(content)
            
            audio_url = f"/media/speaking_submissions/{filename}"
            print(f"[UPLOAD] Saved speaking audio to {audio_url}")
            
        except Exception as e:
            print(f"[UPLOAD ERROR] Failed to save audio: {str(e)}")
            audio_url = None
    
    # Check if already submitted
    existing_submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).first()
    
    if existing_submission:
        # Update existing submission
        existing_submission.content_text = content_text
        existing_submission.content_url = audio_url or existing_submission.content_url
        existing_submission.answers = parsed_answers
        existing_submission.submitted_at = datetime.utcnow()
        existing_submission.status = "submitted"
        
        # Auto-grade if possible (speaking/writing/objective)
        _auto_grade_submission(existing_submission, exercise, db)
        
        db.commit()
        db.refresh(existing_submission)
        return existing_submission
    
    # Check if late
    status_value = "submitted"
    if exercise.due_at and datetime.utcnow() > exercise.due_at:
        status_value = "late"
    
    # Create new submission
    submission = Submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content_text=content_text,
        content_url=audio_url,
        answers=parsed_answers,
        status=status_value
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Auto-grade if possible
    _auto_grade_submission(submission, exercise, db)
    db.commit()
    db.refresh(submission)
    
    return submission


@router.post("/{exercise_id}/save-draft", response_model=SubmissionResponse)
async def save_draft(
    exercise_id: int,
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lưu nháp bài tập (chưa nộp chính thức)
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài tập"
        )
    
    # Check if student has access
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == exercise.class_id,
        Enrollment.user_id == current_user.id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa tham gia lớp học này"
        )
    
    # Check if already have a draft
    existing_draft = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id,
        Submission.status == "draft"
    ).first()
    
    if existing_draft:
        # Update existing draft
        existing_draft.content_text = submission_data.content_text
        existing_draft.content_url = submission_data.content_url
        existing_draft.answers = submission_data.answers
        db.commit()
        db.refresh(existing_draft)
        return existing_draft
    
    # Create new draft
    draft = Submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content_text=submission_data.content_text,
        content_url=submission_data.content_url,
        answers=submission_data.answers,
        status="draft"
    )
    
    db.add(draft)
    db.commit()
    db.refresh(draft)
    
    return draft

@router.get("/{exercise_id}/my-submission", response_model=SubmissionResponse)
async def get_my_submission(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy bài nộp của học sinh cho bài tập này
    """
    submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chưa có bài nộp"
        )
    
    return submission


@router.get("/my-submissions-test")
async def test_my_submissions():
    """Test endpoint"""
    return {"message": "test works", "submissions": []}


@router.delete("/{exercise_id}/submission")
async def delete_my_submission(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xóa bài nộp của học sinh (chỉ khi chưa được chấm điểm)
    """
    submission = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bài nộp"
        )
    
    if submission.status == "graded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa bài đã được chấm điểm"
        )
    
    db.delete(submission)
    db.commit()
    
    return {"message": "Đã xóa bài nộp thành công"}


@router.get("/statistics/summary")
async def get_exercise_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thống kê tổng quan về bài tập của học sinh
    """
    # Get enrolled classes
    enrolled_class_ids = (
        db.query(Enrollment.class_id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
        .all()
    )
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    if not enrolled_class_ids:
        return {
            "total_exercises": 0,
            "completed": 0,
            "pending": 0,
            "graded": 0,
            "average_score": 0,
            "late_submissions": 0
        }
    
    # Total exercises
    total_exercises = db.query(func.count(Exercise.id)).filter(
        Exercise.class_id.in_(enrolled_class_ids)
    ).scalar() or 0
    
    # Get all submissions
    submissions = db.query(Submission).filter(
        Submission.student_id == current_user.id
    ).all()
    
    completed = len(submissions)
    pending = total_exercises - completed
    graded = len([s for s in submissions if s.status == "graded"])
    late_submissions = len([s for s in submissions if s.status == "late"])
    
    # Calculate average score
    graded_submissions = [s for s in submissions if s.score is not None]
    average_score = 0
    if graded_submissions:
        average_score = sum(s.score for s in graded_submissions) / len(graded_submissions)
    
    return {
        "total_exercises": total_exercises,
        "completed": completed,
        "pending": pending,
        "graded": graded,
        "average_score": round(average_score, 2),
        "late_submissions": late_submissions
    }


# ===================== Teacher/Admin: CRUD Exercises =====================

def _ensure_can_manage_class(db: Session, current_user: User, class_id: int) -> Classroom:
    classroom: Optional[Classroom] = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lớp học")
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền quản lý lớp học này")


def _get_exercise_class_id(db: Session, exercise: Exercise) -> Optional[int]:
    if exercise.class_id:
        return exercise.class_id
    if exercise.lesson_id:
        from app.models.lesson import Lesson  # local import to avoid cycles
        lesson = db.query(Lesson).filter(Lesson.id == exercise.lesson_id).first()
        if lesson:
            return lesson.class_id
    return None


@router.get("/by-class/{class_id}", response_model=List[ExerciseResponse])
async def list_exercises_by_class_teacher(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_can_manage_class(db, current_user, class_id)
    rows = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    return rows


@router.get("/by-lesson/{lesson_id}", response_model=List[ExerciseResponse])
async def list_exercises_by_lesson_teacher(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.lesson import Lesson
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
    _ensure_can_manage_class(db, current_user, int(lesson.class_id))
    rows = db.query(Exercise).filter(Exercise.lesson_id == lesson_id).all()
    return rows


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise_teacher(
    payload: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.class_id and not payload.lesson_id:
        raise HTTPException(status_code=400, detail="Cần cung cấp class_id hoặc lesson_id")

    class_id: Optional[int] = payload.class_id
    if payload.lesson_id and not class_id:
        from app.models.lesson import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
        class_id = int(lesson.class_id)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Không xác định được lớp học cho bài tập")

    _ensure_can_manage_class(db, current_user, int(class_id))
    ex = Exercise(
        class_id=class_id,
        lesson_id=payload.lesson_id,
        title=payload.title,
        description=payload.description,
        type=payload.type or "assignment",
        skill_type=payload.skill_type,
        max_score=payload.max_score,
        duration=payload.duration,
        content=payload.content,
        due_at=payload.due_at,
        enable_ai_grading=payload.enable_ai_grading,
        rubrics=payload.rubrics,
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex
    return ex


@router.put("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise_teacher(
    exercise_id: int,
    payload: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    class_id = _get_exercise_class_id(db, ex)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))

    if payload.title is not None:
        ex.title = payload.title
    if payload.description is not None:
        ex.description = payload.description
    if payload.max_score is not None:
        ex.max_score = payload.max_score
    db.commit()
    db.refresh(ex)
    return ex


@router.delete("/{exercise_id}")
async def delete_exercise_teacher(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    class_id = _get_exercise_class_id(db, ex)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))
    db.delete(ex)
    db.commit()
    return {"message": "Đã xóa bài tập"}


# ===================== Teacher: View Submissions =====================

@router.get("/{exercise_id}/submissions", response_class=JSONResponse)
async def get_exercise_submissions(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Teacher xem tất cả submissions của một bài tập
    """
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    
    class_id = _get_exercise_class_id(db, ex)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))
    
    # Get all submissions
    submissions = db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).order_by(Submission.submitted_at.desc()).all()
    
    # Get student info
    student_ids = [sub.student_id for sub in submissions]
    students_map = {}
    if student_ids:
        students = db.query(User).filter(User.id.in_(student_ids)).all()
        for student in students:
            students_map[student.id] = {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            }
    
    # Build response
    result = []
    for sub in submissions:
        student = students_map.get(sub.student_id, {})
        result.append({
            "id": sub.id,
            "exercise_id": sub.exercise_id,
            "student_id": sub.student_id,
            "student_name": student.get("full_name", "Unknown"),
            "student_email": student.get("email", "Unknown"),
            "content_text": sub.content_text,
            "content_url": sub.content_url,
            "answers": sub.answers,
            "score": sub.score,
            "ai_score": sub.ai_score,
            "feedback": sub.feedback,
            "ai_feedback": sub.ai_feedback,
            "rubrics_scores": sub.rubrics_scores,
            "status": sub.status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
        })
    
    return JSONResponse(content=result)


@router.post("/{exercise_id}/submissions/{submission_id}/grade", response_class=JSONResponse)
async def grade_submission(
    exercise_id: int,
    submission_id: int,
    grade_data: GradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Teacher chấm điểm một submission
    """
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    
    class_id = _get_exercise_class_id(db, ex)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài nộp")
    
    if submission.exercise_id != exercise_id:
        raise HTTPException(status_code=400, detail="Submission không thuộc exercise này")
    
    # Update score and feedback
    submission.score = grade_data.score
    submission.feedback = grade_data.feedback
    if grade_data.rubrics_scores:
        submission.rubrics_scores = grade_data.rubrics_scores
    submission.status = "graded"
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    return JSONResponse(content={
        "message": "Đã chấm điểm thành công",
        "submission_id": submission.id,
        "score": submission.score,
        "feedback": submission.feedback
    })


# --- Teacher Grading Endpoints (Frontend compatibility) ---
@router.get("/teacher-grading/classes/{class_id}/submissions", response_class=JSONResponse)
async def get_class_submissions_for_grading(
    class_id: int,
    exercise_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Teacher xem tất cả submissions của lớp (có thể filter theo exercise)
    """
    _ensure_can_manage_class(db, current_user, class_id)
    
    # Build query
    query = db.query(Submission).join(Exercise).filter(Exercise.class_id == class_id)
    
    # Filter by exercise if specified
    if exercise_id:
        query = query.filter(Submission.exercise_id == exercise_id)
    
    submissions = query.order_by(Submission.submitted_at.desc()).all()
    
    # Get student info
    student_ids = [sub.student_id for sub in submissions]
    students_map = {}
    if student_ids:
        students = db.query(User).filter(User.id.in_(student_ids)).all()
        for student in students:
            students_map[student.id] = {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            }
    
    # Build response
    result = []
    for sub in submissions:
        student = students_map.get(sub.student_id, {})
        result.append({
            "id": sub.id,
            "exercise_id": sub.exercise_id,
            "student_id": sub.student_id,
            "student_name": student.get("full_name", "Unknown"),
            "student_email": student.get("email", "Unknown"),
            "content_text": sub.content_text,
            "content_url": sub.content_url,
            "answers": sub.answers,
            "score": sub.score,
            "ai_score": sub.ai_score,
            "feedback": sub.feedback,
            "ai_feedback": sub.ai_feedback,
            "rubrics_scores": sub.rubrics_scores,
            "status": sub.status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "graded_at": sub.graded_at.isoformat() if sub.graded_at else None,
        })
    
    return JSONResponse(content=result)


@router.post("/teacher-grading/submissions/{submission_id}/ai-grade", response_class=JSONResponse)
async def ai_grade_submission(
    submission_id: int,
    ai_data: AIGradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI chấm điểm submission (frontend gọi sau khi AI đã chấm)
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài nộp")
    
    # Check permission
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập")
    
    class_id = _get_exercise_class_id(db, exercise)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Bài tập không gắn lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))
    
    # Update AI grading
    submission.ai_score = ai_data.ai_score
    submission.ai_feedback = ai_data.ai_feedback
    if ai_data.rubrics_scores:
        submission.rubrics_scores = ai_data.rubrics_scores
    submission.status = "pending_review"  # AI chấm xong, teacher cần review
    submission.ai_graded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(submission)
    
    return JSONResponse(content={
        "message": "AI đã chấm điểm thành công",
        "submission_id": submission.id,
        "ai_score": submission.ai_score
    })

