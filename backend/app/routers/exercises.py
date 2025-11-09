import json
import logging
import os
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.schemas.student import (
    ExerciseCreate,
    ExerciseResponse,
    ExerciseUpdate,
)
from app.services.grading_queue_service import GradingQueueService
from app.services.notification_service import NotificationService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize grading queue service
grading_queue_service = GradingQueueService()


# Helper function to calculate queue priority
def _calculate_priority(exercise: Exercise) -> int:
    """
    Calculate priority for grading queue
    - Exam: 100 (highest priority)
    - Exercise: 50 (medium priority)
    - Homework: 10 (low priority)
    """
    exercise_type = exercise.type if hasattr(exercise, 'type') else None

    if exercise_type == "exam":
        return 100
    if exercise_type == "exercise":
        return 50
    # homework or default
    return 10


# Schemas for submission
class SubmissionCreate(BaseModel):
    content_text: str | None = None
    content_url: str | None = None
    answers: dict | None = None  # {question_id: answer_value}


class SubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    content_text: str | None = None
    content_url: str | None = None
    answers: dict | None = None
    score: float | None = None
    ai_score: float | None = None
    feedback: str | None = None
    ai_feedback: str | None = None
    rubrics_scores: dict | None = None
    status: str
    grading_status: str | None = None  # pending, grading, ai_graded, reviewed, failed
    teacher_reviewed: bool | None = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class GradeRequest(BaseModel):
    score: float
    feedback: str | None = None
    rubrics_scores: dict | None = None


class AIGradeRequest(BaseModel):
    submission_id: int
    ai_score: float | None = None
    ai_feedback: str | None = None
    rubrics_scores: dict | None = None
    graded_at: datetime | None
    ai_graded_at: datetime | None

    class Config:
        from_attributes = True


class ExerciseDetailResponse(BaseModel):
    id: int
    title: str
    description: str | None
    type: str
    skill_type: str | None
    max_score: int | None
    due_at: datetime | None
    duration: int | None
    content: dict | None
    created_at: datetime
    class_id: int | None
    class_name: str | None
    lesson_id: int | None
    lesson_title: str | None
    my_submission: SubmissionResponse | None


class ExerciseWithStatsResponse(BaseModel):
    id: int
    title: str
    description: str | None
    type: str
    skill_type: str | None
    max_score: float | None
    due_at: datetime | None
    duration: int | None
    content: dict | None
    created_at: datetime
    class_id: int | None
    lesson_id: int | None
    submission_count: int = 0

    class Config:
        from_attributes = True

# Helper function for auto-grading
async def _auto_grade_submission(submission: Submission, exercise: Exercise, db: Session):
    """
    Tự động chấm điểm using AI Grading Service:
    - Comprehensive test: Full AI grading (all 4 skills)
    - Trắc nghiệm (multiple_choice, true_false, fill_blank): so khớp chuỗi (không dùng AI)
    - Writing: ChatGPT AI (chấm tự động, teacher có thể confirm)
    - Speaking: Azure Speech + ChatGPT (chấm tự động, teacher có thể confirm)
    """
    from app.services.ai_grading_service import AIGradingService

    skill_type = exercise.skill_type
    content = exercise.content or {}

    # Check if comprehensive test
    is_comprehensive = (not skill_type and content.get('type') == 'comprehensive_test')

    if is_comprehensive:
        logger.info(f"[AUTO-GRADE] Comprehensive test detected for submission {submission.id}")

        try:
            # Initialize AI grading service
            grading_service = AIGradingService()

            # Get audio file path if exists
            audio_path = None
            if submission.content_url:
                audio_path = submission.content_url.replace('/media/', './media/')
                if not os.path.exists(audio_path):
                    audio_path = None


            # Run async grading - use await instead of event loop

            grading_results = await grading_service.grade_comprehensive_submission(
                content,
                submission.answers or {},
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
            submission.status = "pending_review"  # Teacher can review and confirm
            submission.ai_graded_at = datetime.utcnow()

            logger.info(f"[AUTO-GRADE] Comprehensive test graded: {grading_results['total_score']}/10")
            return

        except Exception as e:
            logger.info(f"[AUTO-GRADE] Comprehensive test error: {str(e)}")
            import traceback
            traceback.print_exc()
            submission.ai_feedback = f"Lỗi chấm bài: {str(e)}"
            submission.status = "pending_review"
            return

    # Helper to get a speaking reference text from exercise content
    def _extract_speaking_reference_text(content: dict | None) -> str:
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
        logger.info(f"[AUTO-GRADE] Speaking exercise detected for submission {submission.id}")
        # Import service
        from app.services.azure_speech_service import azure_speech_service

        # Get reference text from exercise content
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

                logger.info(f"[AUTO-GRADE] Speaking graded: {score_result['score']}/{exercise.max_score}")
                return

            except Exception as e:
                logger.info(f"[AUTO-GRADE] Speaking error: {str(e)}")
                submission.ai_feedback = f"Lỗi chấm speaking: {str(e)}"
                submission.status = "pending_review"
                return

    # Writing: Use ChatGPT AI
    if skill_type == 'writing' and submission.content_text:
        logger.info(f"[AUTO-GRADE] Writing exercise detected for submission {submission.id}")
        # Import service
        from app.services.openai_service import openai_service

        # Get writing prompt
        prompt = content.get('prompt', '')

        try:
            # Grade writing (synchronous to avoid event loop conflicts)
            grading_result = openai_service.grade_writing_sync(
                submission.content_text,
                prompt=prompt,
                max_score=float(exercise.max_score or 10)
            )

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

            logger.info(f"[AUTO-GRADE] Writing graded: {grading_result['score']}/{exercise.max_score}")
            return

        except Exception as e:
            logger.info(f"[AUTO-GRADE] Writing error: {str(e)}")
            submission.ai_feedback = f"Lỗi chấm writing: {str(e)}"
            submission.status = "pending_review"
            return

    # Multiple choice questions (for comprehensive tests, reading, listening)
    if not submission.answers:
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
            # So khớp chuỗi (cắt khoảng trắng, chuyển thường, gom khoảng trắng dư)
            def _norm(x):
                return " ".join(str(x if x is not None else "").strip().lower().split())
            is_correct = _norm(student_answer) == _norm(correct_answer)
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

        elif q_type == 'matching':
            # Matching questions - grade with AI for partial credit
            try:
                from app.services.ai_grading_service import AIGradingService
                grading_service = AIGradingService()

                # Get pairs from question
                pairs = q.get('pairs', [])

                matching_result = await grading_service.grade_matching(
                    student_pairs=student_answer,
                    correct_pairs=pairs,
                    max_points=q_points
                )

                earned_points = matching_result['points_earned']
                total_score += earned_points
                auto_graded_count += 1

                question_results[q_id] = {
                    'type': q_type,
                    'points': q_points,
                    'earned': earned_points,
                    'correct': matching_result['all_correct'],
                    'student_answer': student_answer,
                    'correct_answer': pairs,
                    'correct_count': matching_result['correct_count'],
                    'total_pairs': matching_result['total_pairs'],
                    'partial_credit': matching_result.get('partial_credit_given', False)
                }
            except Exception as e:
                logger.info(f"[AUTO-GRADE] Matching question AI error: {str(e)}")
                question_results[q_id] = {
                    'type': q_type,
                    'points': q_points,
                    'status': 'error',
                    'error': str(e)
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

        logger.info(f"[AUTO-GRADE] Submission {submission.id}: {auto_graded_count}/{total_questions} auto-graded, score={total_score}/{max_possible_score}, has_essay={has_short_answer}")

@router.post("/teacher-grading/submissions/{submission_id}/auto-grade", response_class=JSONResponse)
async def auto_grade_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chấm tự động server-side cho một submission:
    - Speaking: Azure Speech (nếu có content_url audio)
    - Writing: ChatGPT (nếu có content_text)
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
            from app.services.openai_service import openai_service
            content = exercise.content or {}
            prompt = content.get('prompt', '')
            grading_result = openai_service.grade_writing_sync(
                submission.content_text,
                prompt=prompt,
                max_score=float(exercise.max_score or 10)
            )
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
            await _auto_grade_submission(submission, exercise, db)

        db.commit()
        db.refresh(submission)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi chấm tự động: {str(e)}") from e

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
@router.get("/", response_model=list[ExerciseDetailResponse])
async def get_exercises(
    class_id: int | None = None,
    status: str | None = None,  # pending | submitted | graded
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
    logger.debug(f"[GET /exercises/] User {current_user.id} ({current_user.email}) requesting exercises")

    # Lấy danh sách lớp học sinh đã tham gia
    # Note: enrollment.role is lowercase string "student", not enum
    enrolled_class_ids = (
        db.query(Enrollment.class_id)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.role.in_(["student", "STUDENT", "user", "USER"]),  # Support both cases
            Enrollment.status == "active"
        )
        .all()
    )
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]

    logger.debug(f"[GET /exercises/] Enrolled classes: {enrolled_class_ids}")

    if not enrolled_class_ids:
        logger.debug("[GET /exercises/] No enrolled classes found!")
        return []

    # Query exercises từ các lớp đã tham gia với eager loading
    query = (
        db.query(Exercise)
        .options(
            joinedload(Exercise.classroom),
            selectinload(Exercise.submissions)
        )
        .filter(Exercise.class_id.in_(enrolled_class_ids))
    )

    # Filter by specific class
    if class_id:
        query = query.filter(Exercise.class_id == class_id)

    # Get exercises
    exercises = query.order_by(Exercise.due_at.desc().nulls_last(), Exercise.created_at.desc()).offset(skip).limit(limit).all()

    logger.debug(f"[GET /exercises/] Found {len(exercises)} exercises")

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
        logger.debug(f"[GET /exercises/] Found {len(subs)} submissions for user")
        for sub in subs:
            submissions[sub.exercise_id] = sub

    # Build response
    result = []
    for exercise in exercises:
        my_sub = submissions.get(exercise.id)

        # Filter by status if requested
        if status and (status == "pending" and my_sub is not None or status == "submitted" and (my_sub is None or my_sub.status != "submitted") or status == "graded" and (my_sub is None or my_sub.status != "graded")):
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

    logger.debug(f"[GET /exercises/] Returning {len(result)} exercises to frontend")
    return result


@router.get("/my-submissions", response_class=JSONResponse)
async def get_my_submissions(
    status: str | None = None,
    exercise_id: int | None = None,
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
    logger.debug(f"[GET /my-submissions] User {current_user.id} requesting submissions (status={status}, exercise_id={exercise_id})")

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

        logger.debug(f"[GET /my-submissions] Found {len(submissions)} submissions")

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

        logger.debug(f"[GET /my-submissions] Returning {len(result)} submissions")
        return JSONResponse(content=result)
    except Exception as e:
        logger.debug(f"[GET /my-submissions] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{exercise_id}", response_model=ExerciseDetailResponse)
async def get_exercise(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một bài tập
    """
    # Eager load relationships to avoid N+1 queries
    exercise = (
        db.query(Exercise)
        .options(
            joinedload(Exercise.classroom),
            selectinload(Exercise.submissions)
        )
        .filter(Exercise.id == exercise_id)
        .first()
    )

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
            Enrollment.role.in_(["student", "STUDENT", "user", "USER"]),
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
    audio_file: UploadFile | None = File(None),
    answers: str | None = Form(None),
    content_text: str | None = Form(None),
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
        Enrollment.role.in_(["student", "STUDENT", "user", "USER"]),
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
        except Exception:
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
            logger.info(f"[UPLOAD] Saved speaking audio to {audio_url}")

        except Exception as e:
            logger.error(f"[UPLOAD ERROR] Failed to save audio: {str(e)}")
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
        existing_submission.grading_status = "pending"
        existing_submission.teacher_reviewed = False
        existing_submission.score = None  # Clear old score
        existing_submission.ai_score = None
        existing_submission.ai_feedback = None

        db.commit()
        db.refresh(existing_submission)

        # Add to grading queue instead of immediate grading
        priority = _calculate_priority(exercise)
        grading_queue_service.add_to_queue(
            db=db,
            submission_id=existing_submission.id,
            exercise_id=exercise_id,
            student_id=current_user.id,
            class_id=exercise.class_id,
            priority=priority
        )

        # Tự động tạo thông báo cho phụ huynh khi học sinh nộp lại bài
        try:
            NotificationService.notify_parents_on_submission(db, existing_submission)
        except Exception as e:
            # Log error nhưng không làm fail request
            logger.error(f"Error creating notification on submission: {e}")

        return existing_submission

    # Check if late - fix timezone comparison
    status_value = "submitted"
    if exercise.due_at:
        now_utc = datetime.now(UTC)
        # Make sure due_at is timezone-aware
        due_at_aware = exercise.due_at.replace(tzinfo=UTC) if exercise.due_at.tzinfo is None else exercise.due_at
        if now_utc > due_at_aware:
            status_value = "late"

    # Create new submission
    submission = Submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        content_text=content_text,
        content_url=audio_url,
        answers=parsed_answers,
        status=status_value,
        grading_status="pending",
        teacher_reviewed=False
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Add to grading queue instead of immediate grading
    priority = _calculate_priority(exercise)
    grading_queue_service.add_to_queue(
        db=db,
        submission_id=submission.id,
        exercise_id=exercise_id,
        student_id=current_user.id,
        class_id=exercise.class_id,
        priority=priority
    )

    # Tự động tạo thông báo cho phụ huynh khi học sinh nộp bài
    try:
        NotificationService.notify_parents_on_submission(db, submission)
    except Exception as e:
        # Log error nhưng không làm fail request
        logger.error(f"Error creating notification on submission: {e}")

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
        Enrollment.role.in_(["student", "STUDENT", "user", "USER"]),
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
    Chỉ hiển thị điểm và feedback khi teacher đã review
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

    # Check if results should be hidden (not yet reviewed by teacher)
    grading_status = getattr(submission, 'grading_status', None)
    teacher_reviewed = getattr(submission, 'teacher_reviewed', False)

    # If student and not reviewed yet, hide scores and feedback
    if current_user.role == UserRole.STUDENT and not teacher_reviewed and grading_status in ['pending', 'grading', 'ai_graded']:
        # Return submission but hide results
        return SubmissionResponse(
                id=submission.id,
                exercise_id=submission.exercise_id,
                student_id=submission.student_id,
                content_text=submission.content_text,
                content_url=submission.content_url,
                answers=submission.answers,
                score=None,
                ai_score=None,
                feedback="Đang chờ giáo viên chấm điểm...",
                ai_feedback=None,
                rubrics_scores=None,
                status=submission.status,
                grading_status=grading_status or "grading",
                teacher_reviewed=False,
                submitted_at=submission.submitted_at
            )

    # Teacher or reviewed submission - show all results
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
            Enrollment.role.in_(["student", "STUDENT", "user", "USER"]),
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
    classroom: Classroom | None = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lớp học")
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền quản lý lớp học này")


def _get_exercise_class_id(db: Session, exercise: Exercise) -> int | None:
    if exercise.class_id:
        return exercise.class_id
    if exercise.lesson_id:
        from app.models.lesson import Lesson  # local import to avoid cycles
        lesson = db.query(Lesson).filter(Lesson.id == exercise.lesson_id).first()
        if lesson:
            return lesson.class_id
    return None


@router.get("/by-class/{class_id}", response_model=list[ExerciseWithStatsResponse])
async def list_exercises_by_class_teacher(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_can_manage_class(db, current_user, class_id)

    # Get exercises with submission count
    exercises = (
        db.query(Exercise)
        .filter(
            Exercise.class_id == class_id,
            Exercise.is_active,
            not Exercise.is_archived,
        )
        .all()
    )

    results = []
    for exercise in exercises:
        # Count submissions for this exercise
        submission_count = db.query(func.count(Submission.id)).filter(
            Submission.exercise_id == exercise.id
        ).scalar() or 0

        exercise_dict = {
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
            "lesson_id": exercise.lesson_id,
            "submission_count": submission_count
        }
        results.append(exercise_dict)

    return results


@router.get("/by-lesson/{lesson_id}", response_model=list[ExerciseResponse])
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
    return (
        db.query(Exercise)
        .filter(
            Exercise.lesson_id == lesson_id,
            Exercise.is_active,
            not Exercise.is_archived,
        )
        .all()
    )


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise_teacher(
    payload: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.class_id and not payload.lesson_id:
        raise HTTPException(status_code=400, detail="Cần cung cấp class_id hoặc lesson_id")

    class_id: int | None = payload.class_id
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

    # Nếu bài tập đã có bài nộp hoặc đã được công bố, chỉ đánh dấu ẩn để không làm mất dữ liệu
    has_submission = db.query(Submission.id).filter(Submission.exercise_id == exercise_id).first()
    if has_submission or getattr(ex, "is_published", False):
        ex.is_active = False
        ex.is_archived = True
        db.commit()
        return {"message": "Đã ẩn bài tập, giữ lại dữ liệu nộp"}

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

    # Tự động tạo thông báo cho phụ huynh
    try:
        teacher_name = current_user.full_name or current_user.username
        NotificationService.notify_parents_on_grading(db, submission, teacher_name)

        # Nếu điểm thấp, gửi thêm cảnh báo
        if submission.score and submission.score < 5.0:
            NotificationService.notify_parents_on_low_score(db, submission)
    except Exception as e:
        # Log error nhưng không làm fail request
        logger.error(f"Error creating notification: {e}")

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
    exercise_id: int | None = None,
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


# ==================== AI Generation Endpoint ====================
class AIGenerationRequest(BaseModel):
    test_type: str  # skill_exercise, test_15min, midterm, final
    skill: str | None = None  # listening, speaking, reading, writing
    grade: str  # 1-12
    semester: str  # 1 or 2
    class_id: int | None = None
    title: str | None = None
    # New parameters for better control
    difficulty: str | None = 'mixed'  # easy, medium, hard, mixed
    questions_per_skill: int | None = 10  # Number of questions per skill (default 10 for longer exams)
    additional_notes: str | None = None  # Extra instructions for AI


@router.post("/generate-ai")
async def generate_exercise_with_ai(
    request: AIGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate exercise using AI based on Vietnam's 2018 Foreign Language Curriculum
    For midterm/final exams, generates all 4 skills
    """
    from app.services.ai_exercise_generator import AIExerciseGenerator

    # Check if user is teacher
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới có thể sử dụng tính năng này")

    try:
        generator = AIExerciseGenerator()

        logger.info(f"[AI Generate API] Generating {request.test_type} for Grade {request.grade}, Semester {request.semester}")
        logger.info(f"[AI Generate API] Questions per skill: {request.questions_per_skill or 10}")

        # Generate exercise based on type
        if request.test_type in ['midterm', 'final']:
            # Generate full exam with all 4 skills
            exercise_data = await generator.generate_full_exam(
                test_type=request.test_type,
                grade=request.grade,
                semester=request.semester,
                difficulty=request.difficulty or 'mixed',
                questions_per_skill=request.questions_per_skill or 10,
                additional_notes=request.additional_notes or None
            )
            logger.info("[AI Generate API] ✅ Full exam generated successfully")
        else:
            # Generate single skill exercise
            if not request.skill:
                raise HTTPException(status_code=400, detail="Vui lòng chọn kỹ năng")

            exercise_data = await generator.generate_skill_exercise(
                skill=request.skill,
                test_type=request.test_type,
                grade=request.grade,
                semester=request.semester
            )
            logger.info(f"[AI Generate API] ✅ {request.skill.capitalize()} exercise generated successfully")

        return JSONResponse(content={
            "success": True,
            "message": "Đã sinh đề bằng AI thành công",
            "exercise": exercise_data
        })

    except HTTPException:
        raise
    except TimeoutError as e:
        logger.info(f"[AI Generate API] ❌ Timeout Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=504,
            detail="OpenAI timeout - Đề thi có thể quá dài. Vui lòng thử giảm số câu hỏi hoặc thử lại."
        ) from e
    except json.JSONDecodeError as e:
        logger.info(f"[AI Generate API] ❌ JSON Parse Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Lỗi parse JSON từ AI - Vui lòng thử lại."
        ) from e
    except Exception as e:
        error_msg = str(e)
        logger.info(f"[AI Generate API] ❌ Error: {error_msg}")
        import traceback
        traceback.print_exc()

        # Check for specific OpenAI errors
        if "429" in error_msg or "quota" in error_msg.lower() or "insufficient_quota" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="⚠️ Tài khoản OpenAI đã hết credit hoặc vượt giới hạn. Vui lòng liên hệ admin để nạp thêm credit tại https://platform.openai.com/account/billing"
            ) from e
        if "401" in error_msg or "authentication" in error_msg.lower():
            raise HTTPException(
                status_code=401,
                detail="OpenAI API key không hợp lệ. Vui lòng kiểm tra lại cấu hình."
            ) from e
        if "rate_limit" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Vượt giới hạn số request/phút của OpenAI. Vui lòng thử lại sau 1 phút."
            ) from e
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi OpenAI: {error_msg}"
        ) from e

