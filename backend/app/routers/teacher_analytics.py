"""
Teacher Analytics Router
Provides statistics, reports and analytics for teachers
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case, distinct
from sqlalchemy.orm import joinedload
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify router works"""
    return {"status": "ok", "message": "Teacher analytics router is working"}


# ===================== Schemas =====================

class ClassPerformance(BaseModel):
    class_id: int
    class_name: str
    avg_score: float
    completion: float
    students: int

class ScoreDistribution(BaseModel):
    range: str
    count: int
    percentage: float

class SkillScore(BaseModel):
    skill: str
    score: float
    count: int

class MonthlyProgress(BaseModel):
    month: str
    avg_score: float
    submissions: int

class TeacherStatsSummary(BaseModel):
    total_students: int
    avg_score: float
    completion_rate: float
    excellent_count: int
    class_performance: List[ClassPerformance]
    score_distribution: List[ScoreDistribution]
    skills_data: List[SkillScore]
    monthly_progress: List[MonthlyProgress]

class ClassOverview(BaseModel):
    student_count: int
    total_exercises: int
    total_submissions: int
    class_average: float
    submission_rate: float
    pending_grading: int
    graded_submissions: int

class StudentAnalytics(BaseModel):
    student_id: int
    student_name: str
    total_submissions: int
    graded_submissions: int
    average_score: float
    skill_scores: Dict[str, float]
    recent_trend: str  # 'improving', 'declining', 'stable'


# ===================== Helper Functions =====================

def calculate_skill_scores(submissions: List[Submission]) -> Dict[str, float]:
    """Calculate average scores for each skill (reading, writing, listening, speaking)"""
    skill_scores = {'reading': 0, 'writing': 0, 'listening': 0, 'speaking': 0}
    skill_counts = {'reading': 0, 'writing': 0, 'listening': 0, 'speaking': 0}
    
    for sub in submissions:
        # Check if graded (has score and graded_at)
        if sub.score is not None and sub.graded_at is not None:
            # Determine skill from exercise skill_type
            skill_type = sub.exercise.skill_type if hasattr(sub, 'exercise') and sub.exercise else None
            
            # Get max_score from submission or exercise
            max_score = sub.exercise.max_score if sub.exercise and sub.exercise.max_score else 100
            if max_score and max_score > 0:
                score_percent = (sub.score / max_score) * 100
                
                if skill_type in ['reading', 'writing', 'listening', 'speaking']:
                    skill_scores[skill_type] += score_percent
                    skill_counts[skill_type] += 1
    
    # Calculate averages
    for skill in skill_scores:
        if skill_counts[skill] > 0:
            skill_scores[skill] = round(skill_scores[skill] / skill_counts[skill], 1)
        else:
            skill_scores[skill] = 0.0
    
    return skill_scores


def calculate_trend(recent_submissions: List[Submission]) -> str:
    """
    Calculate if student is improving, declining or stable
    Based on last 5 submissions
    """
    if len(recent_submissions) < 3:
        return 'stable'
    
    # Get last 5 submissions with scores (graded = has score and graded_at)
    scored_subs = [
        s for s in recent_submissions 
        if s.score is not None and s.graded_at is not None and s.exercise and s.exercise.max_score
    ]
    if len(scored_subs) < 3:
        return 'stable'
    
    scored_subs = sorted(scored_subs, key=lambda x: x.submitted_at)[-5:]
    
    # Calculate percentages
    percentages = [(s.score / s.exercise.max_score) * 100 for s in scored_subs]
    
    # Simple trend: compare first half vs second half
    mid = len(percentages) // 2
    first_half = sum(percentages[:mid]) / mid if mid > 0 else 0
    second_half = sum(percentages[mid:]) / (len(percentages) - mid)
    
    diff = second_half - first_half
    
    if diff > 5:
        return 'improving'
    elif diff < -5:
        return 'declining'
    else:
        return 'stable'


# ===================== Endpoints =====================

@router.get("/statistics", response_model=TeacherStatsSummary)
async def get_teacher_statistics(
    period: str = Query("month", regex="^(week|month|semester|year)$"),
    class_id: Optional[int] = None,
    # current_user: User = Depends(get_current_user),  # TEMPORARILY DISABLED FOR DEMO
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for teacher dashboard
    
    - **period**: Time period (week, month, semester, year)
    - **class_id**: Optional filter by specific class
    """
    # For demo: get first teacher from database
    current_user = db.query(User).filter(User.role == "teacher").first()
    if not current_user:
        # If no teacher, use admin or first user
        current_user = db.query(User).filter(User.role == "admin").first()
        if not current_user:
            current_user = db.query(User).first()
    
    if not current_user:
        raise HTTPException(status_code=404, detail="No users found in database")
    
    logger.info(f"[ANALYTICS] Getting statistics for user {current_user.id}, period: {period}, class_id: {class_id}")
    
    try:
        # Calculate date range
        now = datetime.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'semester':
            start_date = now - timedelta(days=120)
        else:  # year
            start_date = now - timedelta(days=365)
        
        # Get teacher's classes
        classes_query = db.query(Classroom).filter(Classroom.teacher_id == current_user.id)
        if class_id:
            classes_query = classes_query.filter(Classroom.id == class_id)
        classes = classes_query.all()
        
        logger.info(f"[ANALYTICS] Found {len(classes)} classes for teacher")
        
        if not classes:
            logger.info("[ANALYTICS] No classes found, returning empty stats")
            # Return empty stats with default skill data
            return TeacherStatsSummary(
                total_students=0,
                avg_score=0.0,
                completion_rate=0.0,
                excellent_count=0,
                class_performance=[],
                score_distribution=[
                    ScoreDistribution(range='0-4', count=0, percentage=0.0),
                    ScoreDistribution(range='4-6', count=0, percentage=0.0),
                    ScoreDistribution(range='6-8', count=0, percentage=0.0),
                    ScoreDistribution(range='8-10', count=0, percentage=0.0),
                ],
                skills_data=[
                    SkillScore(skill='Reading', score=0.0, count=0),
                    SkillScore(skill='Writing', score=0.0, count=0),
                    SkillScore(skill='Listening', score=0.0, count=0),
                    SkillScore(skill='Speaking', score=0.0, count=0),
                ],
                monthly_progress=[]
            )
        
        class_ids = [c.id for c in classes]
        
        # Get all students in these classes
        enrollments = db.query(Enrollment).filter(Enrollment.class_id.in_(class_ids)).all()
        student_ids = list(set([e.student_id for e in enrollments]))
        total_students = len(student_ids)
        
        # Get all exercises in these classes
        exercises = db.query(Exercise).filter(Exercise.class_id.in_(class_ids)).all()
        exercise_ids = [ex.id for ex in exercises]
        
        # Get all submissions (eager load exercise for efficiency)
        if exercise_ids:
            submissions = db.query(Submission).options(
                joinedload(Submission.exercise)
            ).filter(
                and_(
                    Submission.exercise_id.in_(exercise_ids),
                    Submission.submitted_at >= start_date,
                    Submission.submitted_at.isnot(None)  # Ensure submitted_at is not None
                )
            ).all()
        else:
            submissions = []
        
        logger.info(f"[ANALYTICS] Found {len(submissions)} submissions in date range")
        
        # Graded submissions = has score, graded_at, and exercise with max_score
        graded_submissions = []
        for s in submissions:
            try:
                if (s.score is not None and 
                    s.graded_at is not None and 
                    s.exercise and 
                    s.exercise.max_score and 
                    s.exercise.max_score > 0):
                    graded_submissions.append(s)
            except Exception as e:
                logger.warning(f"[ANALYTICS] Error checking submission {s.id}: {e}")
                continue
        
        logger.info(f"[ANALYTICS] Found {len(graded_submissions)} graded submissions")
        
        # Calculate average score
        avg_score = 0.0
        if graded_submissions:
            try:
                total_score = 0.0
                count = 0
                for s in graded_submissions:
                    try:
                        score_pct = (s.score / s.exercise.max_score) * 100
                        total_score += score_pct
                        count += 1
                    except Exception as e:
                        logger.warning(f"[ANALYTICS] Error calculating score for submission {s.id}: {e}")
                        continue
                
                if count > 0:
                    avg_score = round(total_score / count, 1)
                logger.info(f"[ANALYTICS] Average score: {avg_score}")
            except Exception as e:
                logger.error(f"[ANALYTICS] Error calculating average: {e}")
                avg_score = 0.0
        
        # Calculate completion rate
        expected_submissions = len(exercises) * total_students if total_students > 0 else 0
        completion_rate = round(
            (len(submissions) / expected_submissions * 100) if expected_submissions > 0 else 0,
            1
        )
        
        # Calculate excellent students (avg score >= 80)
        excellent_count = 0
        try:
            student_scores = {}
            for sub in graded_submissions:
                try:
                    if sub.student_id not in student_scores:
                        student_scores[sub.student_id] = []
                    score_pct = (sub.score / sub.exercise.max_score) * 100
                    student_scores[sub.student_id].append(score_pct)
                except Exception as e:
                    logger.warning(f"[ANALYTICS] Error calculating student score: {e}")
                    continue
            
            excellent_count = sum(
                1 for scores in student_scores.values()
                if scores and (sum(scores) / len(scores)) >= 80
            )
            logger.info(f"[ANALYTICS] Excellent students: {excellent_count}")
        except Exception as e:
            logger.error(f"[ANALYTICS] Error calculating excellent count: {e}")
            excellent_count = 0
        
        # Class performance
        class_performance = []
        try:
            for cls in classes:
                try:
                    cls_enrollments = [e for e in enrollments if e.class_id == cls.id]
                    cls_student_ids = [e.student_id for e in cls_enrollments]
                    cls_exercises = [ex for ex in exercises if ex.class_id == cls.id]
                    cls_exercise_ids = [ex.id for ex in cls_exercises]
                    cls_submissions = [s for s in submissions if s.exercise_id in cls_exercise_ids]
                    
                    cls_graded = []
                    for s in cls_submissions:
                        try:
                            if (s.score is not None and s.graded_at is not None and 
                                s.exercise and s.exercise.max_score):
                                cls_graded.append(s)
                        except:
                            continue
                    
                    cls_avg = 0.0
                    if cls_graded:
                        try:
                            total = sum((s.score / s.exercise.max_score * 100) for s in cls_graded)
                            cls_avg = round(total / len(cls_graded), 1)
                        except:
                            cls_avg = 0.0
                    
                    cls_expected = len(cls_exercises) * len(cls_student_ids) if len(cls_student_ids) > 0 else 0
                    cls_completion = round(
                        (len(cls_submissions) / cls_expected * 100) if cls_expected > 0 else 0,
                        1
                    )
                    
                    class_performance.append(ClassPerformance(
                        class_id=cls.id,
                        class_name=cls.name,
                        avg_score=cls_avg,
                        completion=cls_completion,
                        students=len(cls_student_ids)
                    ))
                except Exception as e:
                    logger.warning(f"[ANALYTICS] Error processing class {cls.id}: {e}")
                    continue
                    
            logger.info(f"[ANALYTICS] Class performance calculated for {len(class_performance)} classes")
        except Exception as e:
            logger.error(f"[ANALYTICS] Error calculating class performance: {e}")
            class_performance = []
        
        # Score distribution
        score_distribution = []
        try:
            score_ranges = {'0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0}
            for sub in graded_submissions:
                try:
                    score_10 = (sub.score / sub.exercise.max_score) * 10
                    if score_10 < 4:
                        score_ranges['0-4'] += 1
                    elif score_10 < 6:
                        score_ranges['4-6'] += 1
                    elif score_10 < 8:
                        score_ranges['6-8'] += 1
                    else:
                        score_ranges['8-10'] += 1
                except:
                    continue
            
            total_graded = len(graded_submissions) if graded_submissions else 1
            score_distribution = [
                ScoreDistribution(
                    range=range_key,
                    count=count,
                    percentage=round((count / total_graded) * 100, 1)
                )
                for range_key, count in score_ranges.items()
            ]
            logger.info(f"[ANALYTICS] Score distribution calculated")
        except Exception as e:
            logger.error(f"[ANALYTICS] Error calculating score distribution: {e}")
            score_distribution = [
                ScoreDistribution(range='0-4', count=0, percentage=0.0),
                ScoreDistribution(range='4-6', count=0, percentage=0.0),
                ScoreDistribution(range='6-8', count=0, percentage=0.0),
                ScoreDistribution(range='8-10', count=0, percentage=0.0),
            ]
        
        # Skills data
        skills_data = []
        try:
            skill_submissions = {
                'reading': [],
                'writing': [],
                'listening': [],
                'speaking': []
            }
            
            for sub in graded_submissions:
                try:
                    if (hasattr(sub, 'exercise') and sub.exercise and 
                        sub.exercise.skill_type in skill_submissions):
                        score_pct = (sub.score / sub.exercise.max_score) * 100
                        skill_submissions[sub.exercise.skill_type].append(score_pct)
                except:
                    continue
            
            for skill, scores in skill_submissions.items():
                try:
                    avg = round(sum(scores) / len(scores), 1) if scores else 0.0
                    skills_data.append(SkillScore(
                        skill=skill.capitalize(),
                        score=avg,
                        count=len(scores)
                    ))
                except:
                    skills_data.append(SkillScore(
                        skill=skill.capitalize(),
                        score=0.0,
                        count=0
                    ))
                    
            logger.info(f"[ANALYTICS] Skills data calculated")
        except Exception as e:
            logger.error(f"[ANALYTICS] Error calculating skills data: {e}")
            skills_data = [
                SkillScore(skill='Reading', score=0.0, count=0),
                SkillScore(skill='Writing', score=0.0, count=0),
                SkillScore(skill='Listening', score=0.0, count=0),
                SkillScore(skill='Speaking', score=0.0, count=0),
            ]
        
        # Monthly progress (last 4 months)
        monthly_progress = []
        try:
            monthly_data = {}
            for i in range(4):
                try:
                    month_start = now - timedelta(days=30 * (i + 1))
                    month_end = now - timedelta(days=30 * i)
                    month_key = month_start.strftime('T%m')
                    
                    month_subs = []
                    for s in graded_submissions:
                        try:
                            if s.submitted_at and month_start <= s.submitted_at <= month_end:
                                month_subs.append(s)
                        except:
                            continue
                    
                    month_avg = 0.0
                    if month_subs:
                        try:
                            total = sum((s.score / s.exercise.max_score * 100) for s in month_subs)
                            month_avg = total / len(month_subs)
                        except:
                            month_avg = 0.0
                    
                    monthly_data[month_key] = {
                        'avg': round(month_avg, 1),
                        'count': len(month_subs)
                    }
                except:
                    continue
            
            monthly_progress = [
                MonthlyProgress(
                    month=month,
                    avg_score=data['avg'],
                    submissions=data['count']
                )
                for month, data in sorted(monthly_data.items())
            ]
            logger.info(f"[ANALYTICS] Monthly progress calculated: {len(monthly_progress)} months")
        except Exception as e:
            logger.error(f"[ANALYTICS] Error calculating monthly progress: {e}")
            monthly_progress = []
        
        return TeacherStatsSummary(
            total_students=total_students,
            avg_score=avg_score,
            completion_rate=completion_rate,
            excellent_count=excellent_count,
            class_performance=class_performance,
            score_distribution=score_distribution,
            skills_data=skills_data,
            monthly_progress=monthly_progress
        )
        
    except Exception as e:
        logger.error(f"[ANALYTICS] Error getting teacher statistics: {e}")
        import traceback
        logger.error(f"[ANALYTICS] Traceback: {traceback.format_exc()}")
        # Return more detailed error for debugging
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Failed to get statistics",
                "message": str(e),
                "type": type(e).__name__
            }
        )


@router.get("/classes/{class_id}/analytics/overview", response_model=ClassOverview)
async def get_class_overview(
    class_id: int,
    # current_user: User = Depends(get_current_user),  # TEMPORARILY DISABLED FOR DEMO
    db: Session = Depends(get_db)
):
    """Get overview analytics for a specific class"""
    # Get class
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # For demo: skip access control
    
    # Get students count
    student_count = db.query(Enrollment).filter(Enrollment.class_id == class_id).count()
    
    # Get exercises
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    total_exercises = len(exercises)
    exercise_ids = [ex.id for ex in exercises]
    
    # Get submissions (eager load exercise)
    submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids)
    ).all()
    
    total_submissions = len(submissions)
    graded_submissions = len([s for s in submissions if s.score is not None and s.graded_at is not None])
    pending_grading = total_submissions - graded_submissions
    
    # Calculate class average
    graded_with_scores = [
        s for s in submissions
        if s.score is not None and s.graded_at is not None and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
    ]
    
    if graded_with_scores:
        class_average = round(
            sum((s.score / s.exercise.max_score * 100) for s in graded_with_scores) / len(graded_with_scores),
            1
        )
    else:
        class_average = 0.0
    
    # Submission rate
    expected_submissions = total_exercises * student_count if student_count > 0 else 0
    submission_rate = round(
        (total_submissions / expected_submissions * 100) if expected_submissions > 0 else 0,
        1
    )
    
    return ClassOverview(
        student_count=student_count,
        total_exercises=total_exercises,
        total_submissions=total_submissions,
        class_average=class_average,
        submission_rate=submission_rate,
        pending_grading=pending_grading,
        graded_submissions=graded_submissions
    )


@router.get("/classes/{class_id}/analytics/students", response_model=List[StudentAnalytics])
async def get_student_analytics(
    class_id: int,
    # current_user: User = Depends(get_current_user),  # TEMPORARILY DISABLED FOR DEMO
    db: Session = Depends(get_db)
):
    """Get detailed analytics for each student in a class"""
    # Get class
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # For demo: skip access control
    
    # Get students
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    student_ids = [e.student_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    
    # Get exercises
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    exercise_ids = [ex.id for ex in exercises]
    
    analytics = []
    
    for student in students:
        # Get student submissions (eager load exercise)
        student_subs = db.query(Submission).options(
            joinedload(Submission.exercise)
        ).filter(
            and_(
                Submission.student_id == student.id,
                Submission.exercise_id.in_(exercise_ids)
            )
        ).order_by(Submission.submitted_at.desc()).all()
        
        total_subs = len(student_subs)
        graded_subs = [s for s in student_subs if s.score is not None and s.graded_at is not None]
        graded_count = len(graded_subs)
        
        # Calculate average
        graded_with_scores = [
            s for s in graded_subs
            if s.exercise and s.exercise.max_score and s.exercise.max_score > 0
        ]
        
        if graded_with_scores:
            avg_score = round(
                sum((s.score / s.exercise.max_score * 100) for s in graded_with_scores) / len(graded_with_scores),
                1
            )
        else:
            avg_score = 0.0
        
        # Calculate skill scores
        skill_scores = calculate_skill_scores(student_subs)
        
        # Calculate trend
        trend = calculate_trend(student_subs)
        
        analytics.append(StudentAnalytics(
            student_id=student.id,
            student_name=student.full_name,
            total_submissions=total_subs,
            graded_submissions=graded_count,
            average_score=avg_score,
            skill_scores=skill_scores,
            recent_trend=trend
        ))
    
    # Sort by average score descending
    analytics.sort(key=lambda x: x.average_score, reverse=True)
    
    return analytics

