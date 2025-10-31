"""
Teacher Grading & Feedback Router
Handles AI-assisted grading, rubrics, feedback management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from pydantic import BaseModel

router = APIRouter()


# ============= Schemas =============
class RubricScore(BaseModel):
    skill: str  # reading, writing, listening, speaking
    score: float
    max_score: float
    feedback: str


class ErrorItem(BaseModel):
    error_type: str
    description: str
    suggestion: str


class AIGradeRequest(BaseModel):
    submission_id: int
    ai_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    rubrics_scores: Optional[List[RubricScore]] = None
    error_analysis: Optional[List[ErrorItem]] = None


class FeedbackUpdateRequest(BaseModel):
    feedback: str
    score: Optional[float] = None
    rubrics_scores: Optional[List[RubricScore]] = None


class SubmissionWithStudent(BaseModel):
    id: int
    exercise_id: int
    student_id: int
    student_name: str
    exercise_title: Optional[str] = None
    exercise_skill_type: Optional[str] = None
    content_text: Optional[str]
    content_url: Optional[str]
    answers: Optional[dict]
    score: Optional[float]
    ai_score: Optional[float]
    feedback: Optional[str]
    ai_feedback: Optional[str]
    rubrics_scores: Optional[dict]
    error_analysis: Optional[dict]
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime]
    ai_graded_at: Optional[datetime]

    class Config:
        from_attributes = True


class StudentProgressSummary(BaseModel):
    student_id: int
    student_name: str
    total_submissions: int
    graded_submissions: int
    average_score: float
    skill_scores: dict  # {reading: avg, writing: avg, listening: avg, speaking: avg}
    recent_trend: str  # improving, declining, stable


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


# ============= Grading Endpoints =============
@router.get("/classes/{class_id}/submissions", response_model=List[SubmissionWithStudent])
async def get_class_submissions(
    class_id: int,
    exercise_id: Optional[int] = None,
    status: Optional[str] = None,
    student_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all submissions for a class (teacher/admin only)
    Filter by exercise, status, or student
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # Get all exercises in this class
    query = db.query(Submission, User.full_name, User.username, Exercise.title, Exercise.skill_type).join(
        Exercise, Exercise.id == Submission.exercise_id
    ).join(
        User, User.id == Submission.student_id
    ).filter(Exercise.class_id == class_id)
    
    if exercise_id:
        query = query.filter(Submission.exercise_id == exercise_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    if student_id:
        query = query.filter(Submission.student_id == student_id)
    
    query = query.order_by(Submission.submitted_at.desc())
    
    results = query.all()
    
    submissions = []
    for sub, full_name, username, ex_title, ex_skill in results:
        submissions.append({
            "id": sub.id,
            "exercise_id": sub.exercise_id,
            "student_id": sub.student_id,
            "student_name": full_name or username,
            "exercise_title": ex_title,
            "exercise_skill_type": ex_skill,
            "content_text": sub.content_text,
            "content_url": sub.content_url,
            "answers": sub.answers,
            "score": sub.score,
            "ai_score": sub.ai_score,
            "feedback": sub.feedback,
            "ai_feedback": sub.ai_feedback,
            "rubrics_scores": sub.rubrics_scores,
            "error_analysis": sub.error_analysis,
            "status": sub.status,
            "submitted_at": sub.submitted_at,
            "graded_at": sub.graded_at,
            "ai_graded_at": sub.ai_graded_at
        })
    
    return submissions


@router.post("/submissions/{submission_id}/ai-grade")
async def save_ai_grading(
    submission_id: int,
    grade_data: AIGradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save AI grading results for a submission
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Bài nộp không tồn tại")
    
    # Check teacher access
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    if exercise.class_id:
        _ensure_teacher_access(db, current_user, exercise.class_id)
    
    # Update AI grading data
    submission.ai_score = grade_data.ai_score
    submission.ai_feedback = grade_data.ai_feedback
    submission.ai_graded_at = datetime.utcnow()
    
    if grade_data.rubrics_scores:
        submission.rubrics_scores = [r.dict() for r in grade_data.rubrics_scores]
    
    if grade_data.error_analysis:
        submission.error_analysis = [e.dict() for e in grade_data.error_analysis]
    
    submission.status = "pending_review"  # Waiting for teacher review
    
    db.commit()
    db.refresh(submission)
    
    return {"message": "AI grading saved successfully", "submission": submission}


@router.put("/submissions/{submission_id}/feedback")
async def update_teacher_feedback(
    submission_id: int,
    feedback_data: FeedbackUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Teacher updates/modifies feedback before sending to student
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Bài nộp không tồn tại")
    
    # Check teacher access
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    if exercise.class_id:
        _ensure_teacher_access(db, current_user, exercise.class_id)
    
    # Update teacher's feedback
    submission.feedback = feedback_data.feedback
    
    if feedback_data.score is not None:
        submission.score = feedback_data.score
    elif submission.ai_score is not None:
        # If teacher doesn't provide score, use AI score
        submission.score = submission.ai_score
    
    if feedback_data.rubrics_scores:
        submission.rubrics_scores = [r.dict() for r in feedback_data.rubrics_scores]
    
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
        print(f"Error creating notification: {e}")
    
    return {"message": "Feedback updated successfully", "submission": submission}


# ============= Analytics Endpoints =============
@router.get("/classes/{class_id}/analytics/students", response_model=List[StudentProgressSummary])
async def get_student_analytics(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics for all students in a class
    Including progress, average scores, skill breakdown
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # Get all students in the class
    enrollments = db.query(Enrollment, User).join(
        User, User.id == Enrollment.user_id
    ).filter(
        Enrollment.class_id == class_id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).all()
    
    student_summaries = []
    
    for enrollment, user in enrollments:
        # Get all submissions for this student in this class
        submissions = db.query(Submission).join(
            Exercise, Exercise.id == Submission.exercise_id
        ).filter(
            Exercise.class_id == class_id,
            Submission.student_id == user.id
        ).all()
        
        total_submissions = len(submissions)
        graded_submissions = len([s for s in submissions if s.status == "graded"])
        
        # Calculate average score
        scores = [s.score for s in submissions if s.score is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Calculate skill scores
        skill_scores = {
            "reading": [],
            "writing": [],
            "listening": [],
            "speaking": []
        }
        
        for sub in submissions:
            if sub.rubrics_scores:
                for rubric in sub.rubrics_scores:
                    if isinstance(rubric, dict) and 'skill' in rubric and 'score' in rubric and 'max_score' in rubric:
                        skill = rubric['skill']
                        if skill in skill_scores and rubric['max_score'] > 0:
                            percentage = (rubric['score'] / rubric['max_score']) * 100
                            skill_scores[skill].append(percentage)
        
        # Calculate average for each skill
        skill_averages = {}
        for skill, scores_list in skill_scores.items():
            skill_averages[skill] = round(sum(scores_list) / len(scores_list), 2) if scores_list else 0
        
        # Determine trend (simple: compare first half vs second half)
        trend = "stable"
        if len(scores) >= 4:
            mid = len(scores) // 2
            first_half_avg = sum(scores[:mid]) / mid
            second_half_avg = sum(scores[mid:]) / (len(scores) - mid)
            if second_half_avg > first_half_avg * 1.1:
                trend = "improving"
            elif second_half_avg < first_half_avg * 0.9:
                trend = "declining"
        
        student_summaries.append({
            "student_id": user.id,
            "student_name": user.full_name or user.username,
            "total_submissions": total_submissions,
            "graded_submissions": graded_submissions,
            "average_score": round(average_score, 2),
            "skill_scores": skill_averages,
            "recent_trend": trend
        })
    
    return student_summaries


@router.get("/classes/{class_id}/analytics/students-need-support")
async def get_students_need_support(
    class_id: int,
    threshold: float = 60.0,  # Students scoring below this need support
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Identify students who need additional support
    Based on scores and specific skill weaknesses
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    analytics = await get_student_analytics(class_id, current_user, db)
    
    students_need_support = []
    
    for student in analytics:
        needs_support = False
        weak_skills = []
        
        # Check overall average
        if student["average_score"] < threshold:
            needs_support = True
        
        # Check individual skills
        for skill, score in student["skill_scores"].items():
            if score > 0 and score < threshold:
                weak_skills.append(skill)
                needs_support = True
        
        if needs_support:
            students_need_support.append({
                **student,
                "weak_skills": weak_skills,
                "support_priority": "high" if student["average_score"] < threshold * 0.7 else "medium"
            })
    
    # Sort by priority and average score
    students_need_support.sort(key=lambda x: (x["support_priority"] == "high", -x["average_score"]), reverse=True)
    
    return {
        "total_students": len(analytics),
        "students_need_support": len(students_need_support),
        "students": students_need_support
    }


@router.get("/classes/{class_id}/analytics/overview")
async def get_class_analytics_overview(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get overall class analytics
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # Get all exercises and submissions for the class
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    exercise_ids = [e.id for e in exercises]
    
    submissions = db.query(Submission).filter(
        Submission.exercise_id.in_(exercise_ids)
    ).all() if exercise_ids else []
    
    total_exercises = len(exercises)
    total_submissions = len(submissions)
    graded_submissions = len([s for s in submissions if s.status == "graded"])
    pending_grading = len([s for s in submissions if s.status in ("submitted", "pending_review")])
    
    # Calculate class average
    scores = [s.score for s in submissions if s.score is not None]
    class_average = round(sum(scores) / len(scores), 2) if scores else 0
    
    # Get student count
    student_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.class_id == class_id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).scalar() or 0
    
    return {
        "class_id": class_id,
        "student_count": student_count,
        "total_exercises": total_exercises,
        "total_submissions": total_submissions,
        "graded_submissions": graded_submissions,
        "pending_grading": pending_grading,
        "class_average": class_average,
        "submission_rate": round((total_submissions / (total_exercises * student_count) * 100), 2) if (total_exercises * student_count) > 0 else 0
    }


# ============= Rubrics & Worksheet Generation =============
@router.post("/classes/{class_id}/generate-worksheet")
async def generate_worksheet(
    class_id: int,
    week: int,
    skill: str,  # reading, writing, listening, speaking
    grade_level: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI worksheet for specific skill and week
    This is a placeholder - actual AI generation will be implemented later
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # This will be integrated with AI service later
    # For now, return a template structure
    
    worksheet_template = {
        "class_id": class_id,
        "week": week,
        "skill": skill,
        "grade_level": grade_level,
        "title": f"Phiếu học tập {skill.title()} - Tuần {week}",
        "description": f"Phiếu đánh giá kỹ năng {skill} cho lớp {grade_level}",
        "rubrics": {
            "criteria": [
                {
                    "name": "Độ chính xác",
                    "weight": 0.3,
                    "max_score": 10
                },
                {
                    "name": "Độ lưu loát",
                    "weight": 0.3,
                    "max_score": 10
                },
                {
                    "name": "Từ vựng",
                    "weight": 0.2,
                    "max_score": 10
                },
                {
                    "name": "Ngữ pháp",
                    "weight": 0.2,
                    "max_score": 10
                }
            ],
            "total_score": 40
        },
        "content": {
            "instructions": "Hướng dẫn sẽ được tạo bởi AI dựa trên chương trình học",
            "questions": []
        }
    }
    
    return {
        "message": "Worksheet template generated (AI integration pending)",
        "worksheet": worksheet_template
    }


# ============= Export Reports =============
@router.get("/classes/{class_id}/export/progress-report")
async def export_progress_report(
    class_id: int,
    format: str = "json",  # json | pdf | excel (pdf and excel will be implemented later)
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export progress report for the class
    """
    _ensure_teacher_access(db, current_user, class_id)
    
    # Get class analytics
    overview = await get_class_analytics_overview(class_id, current_user, db)
    student_analytics = await get_student_analytics(class_id, current_user, db)
    students_need_support = await get_students_need_support(class_id, 60.0, current_user, db)
    
    report = {
        "class_id": class_id,
        "generated_at": datetime.utcnow().isoformat(),
        "overview": overview,
        "student_analytics": student_analytics,
        "students_need_support": students_need_support,
        "export_format": format
    }
    
    if format == "json":
        return report
    elif format == "pdf":
        # TODO: Implement PDF generation
        return {"message": "PDF export coming soon", "data": report}
    elif format == "excel":
        # TODO: Implement Excel generation
        return {"message": "Excel export coming soon", "data": report}
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use json, pdf, or excel")

