"""
Student Progress Analytics Router
Comprehensive progress tracking, support group identification, and detailed reporting
For teacher dashboard - focuses on individual student progress and class-wide insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, case, desc
from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import logging
import json

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.weekly_assessment import WeeklyAssessment
from app.models.exam_assessment import ExamAssessment, ExamSubmission

from app.schemas.progress_analytics import (
    StudentProgressDetail,
    ClassProgressSummary,
    SupportGroupsResponse,
    StudentSupportInfo,
    WeeklyClassReport,
    WeeklyStudentReport,
    DetailedStudentAnalysis,
    SkillBreakdown,
    DetailedErrorAnalysis,
    ErrorPattern,
    SubmissionDetail,
    SupportLevel,
    TrendType,
    ExerciseType
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== HELPER FUNCTIONS ====================

def calculate_percentage(score: float, max_score: float) -> float:
    """Safely calculate percentage"""
    if not max_score or max_score <= 0:
        return 0.0
    return round((score / max_score) * 100, 1)


def determine_trend(scores: List[float]) -> TrendType:
    """Determine trend from list of scores"""
    if len(scores) < 3:
        return "stable"
    
    # Compare first half vs second half
    mid = len(scores) // 2
    if mid == 0:
        return "stable"
    
    first_half_avg = sum(scores[:mid]) / mid
    second_half_avg = sum(scores[mid:]) / (len(scores) - mid)
    diff = second_half_avg - first_half_avg
    
    if diff > 5:
        return "improving"
    elif diff < -5:
        return "declining"
    return "stable"


def determine_support_level(
    avg_score: float,
    trend: TrendType,
    completion_rate: float,
    days_since_last: Optional[int]
) -> Tuple[SupportLevel, List[str]]:
    """Determine support level and reasons"""
    reasons = []
    
    # Critical conditions
    if avg_score < 40:
        reasons.append("Điểm trung bình dưới 40% - cần can thiệp khẩn cấp")
    if days_since_last and days_since_last > 14:
        reasons.append(f"Không nộp bài {days_since_last} ngày - nguy cơ bỏ học")
    if trend == "declining" and avg_score < 50:
        reasons.append("Điểm giảm liên tục và đang ở mức yếu")
    
    if len(reasons) > 0 or avg_score < 40:
        return "urgent", reasons
    
    # Moderate conditions
    if avg_score < 60:
        reasons.append("Điểm trung bình dưới 60% - cần theo dõi")
    if trend == "declining":
        reasons.append("Xu hướng điểm đang giảm")
    if completion_rate < 50:
        reasons.append(f"Tỷ lệ hoàn thành thấp ({completion_rate:.0f}%)")
    if days_since_last and days_since_last > 7:
        reasons.append(f"{days_since_last} ngày chưa nộp bài")
    
    if len(reasons) > 0:
        return "moderate", reasons
    
    # Low priority
    if avg_score < 70 or completion_rate < 80:
        if avg_score < 70:
            reasons.append("Điểm có thể cải thiện thêm")
        if completion_rate < 80:
            reasons.append("Nên hoàn thành đầy đủ hơn các bài tập")
        return "low", reasons
    
    return "none", ["Học sinh đang học tốt, tiếp tục duy trì"]


def extract_error_patterns(submissions: List[Submission]) -> List[ErrorPattern]:
    """Extract common error patterns from AI feedback and error analysis"""
    error_map = defaultdict(lambda: {
        'count': 0,
        'examples': [],
        'descriptions': set(),
        'suggestions': set()
    })
    
    for sub in submissions:
        if not sub.error_analysis:
            continue
        
        try:
            # error_analysis is JSON field
            if isinstance(sub.error_analysis, str):
                errors = json.loads(sub.error_analysis)
            else:
                errors = sub.error_analysis
            
            # Parse error analysis structure
            if isinstance(errors, dict):
                for category, details in errors.items():
                    error_map[category]['count'] += 1
                    
                    if isinstance(details, dict):
                        if 'examples' in details:
                            examples = details['examples']
                            if isinstance(examples, list):
                                error_map[category]['examples'].extend(examples[:2])
                        if 'description' in details:
                            error_map[category]['descriptions'].add(str(details['description']))
                        if 'suggestion' in details or 'suggestions' in details:
                            sugg = details.get('suggestion') or details.get('suggestions')
                            if isinstance(sugg, list):
                                error_map[category]['suggestions'].update(sugg)
                            else:
                                error_map[category]['suggestions'].add(str(sugg))
                    elif isinstance(details, str):
                        error_map[category]['descriptions'].add(details)
            
            # Also parse ai_feedback for common error keywords
            if sub.ai_feedback:
                feedback_lower = sub.ai_feedback.lower()
                common_errors = {
                    'grammar': ['grammar', 'tense', 'subject-verb', 'ngữ pháp'],
                    'vocabulary': ['vocabulary', 'word choice', 'từ vựng'],
                    'pronunciation': ['pronunciation', 'accent', 'phát âm'],
                    'structure': ['structure', 'organization', 'cấu trúc'],
                    'spelling': ['spelling', 'chính tả']
                }
                
                for category, keywords in common_errors.items():
                    if any(keyword in feedback_lower for keyword in keywords):
                        error_map[category]['count'] += 1
                        
        except Exception as e:
            logger.warning(f"Error parsing error_analysis for submission {sub.id}: {e}")
            continue
    
    # Convert to ErrorPattern objects
    patterns = []
    for category, data in sorted(error_map.items(), key=lambda x: x[1]['count'], reverse=True):
        if data['count'] > 0:
            patterns.append(ErrorPattern(
                category=category.replace('_', ' ').title(),
                description=' | '.join(list(data['descriptions'])[:3]) if data['descriptions'] else f"Lỗi về {category}",
                frequency=data['count'],
                examples=data['examples'][:3],
                suggestions=list(data['suggestions'])[:3]
            ))
    
    return patterns[:10]  # Top 10 error patterns


def generate_recommendations(
    support_level: SupportLevel,
    weakest_skills: List[str],
    error_patterns: List[ErrorPattern],
    trend: TrendType
) -> List[str]:
    """Generate personalized recommendations"""
    recommendations = []
    
    if support_level == "urgent":
        recommendations.append("🚨 Cần gặp học sinh và phụ huynh để trao đổi về tình hình học tập")
        recommendations.append("📚 Cung cấp tài liệu ôn tập cơ bản và bài tập bổ trợ")
        recommendations.append("👥 Xem xét sắp xếp học thêm hoặc lớp hỗ trợ")
    elif support_level == "moderate":
        recommendations.append("📝 Theo dõi sát sao tiến độ học tập trong 2 tuần tới")
        recommendations.append("💬 Trao đổi với học sinh để hiểu khó khăn và hỗ trợ")
    
    # Skill-specific recommendations
    skill_tips = {
        'reading': 'Tăng cường luyện đọc hiểu với các bài đọc ngắn hàng ngày',
        'writing': 'Thực hành viết đoạn văn ngắn và nhận feedback thường xuyên',
        'listening': 'Nghe podcast/video tiếng Anh với phụ đề ít nhất 15 phút/ngày',
        'speaking': 'Thực hành nói với bạn bè hoặc ghi âm tự luyện'
    }
    
    for skill in weakest_skills[:2]:
        if skill in skill_tips:
            recommendations.append(f"🎯 Kỹ năng {skill.title()}: {skill_tips[skill]}")
    
    # Error-specific recommendations
    if error_patterns:
        top_error = error_patterns[0]
        if top_error.suggestions:
            recommendations.append(f"⚠️ Tập trung khắc phục: {top_error.category} - {top_error.suggestions[0]}")
    
    # Trend-based recommendations
    if trend == "improving":
        recommendations.append("✅ Học sinh đang tiến bộ tốt! Động viên và duy trì động lực")
    elif trend == "declining":
        recommendations.append("⚠️ Điểm đang giảm - cần tìm hiểu nguyên nhân và hỗ trợ kịp thời")
    
    return recommendations


def classify_exercise_type(exercise: Exercise, exam: Optional[ExamAssessment] = None) -> ExerciseType:
    """Classify exercise into appropriate type"""
    if exam:
        if exam.exam_type == "midterm":
            return "midterm_exam"
        elif exam.exam_type == "final":
            return "final_exam"
        return "test"
    
    if exercise.type == "test":
        return "test"
    elif exercise.type == "quiz":
        return "quiz"
    return "assignment"


def extract_exam_skill_scores(exam_submission: ExamSubmission) -> Dict[str, float]:
    """
    Extract individual skill scores from exam submission
    Exam rubrics_scores format:
    {
        "reading": {"score": 8.5, "max_score": 10},
        "writing": {"score": 7.0, "max_score": 10},
        "listening": {"score": 8.0, "max_score": 10},
        "speaking": {"score": 7.5, "max_score": 10}
    }
    """
    skill_scores = {}
    
    if not exam_submission.rubrics_scores:
        return skill_scores
    
    try:
        if isinstance(exam_submission.rubrics_scores, str):
            rubrics = json.loads(exam_submission.rubrics_scores)
        else:
            rubrics = exam_submission.rubrics_scores
        
        # Parse each skill
        for skill in ['reading', 'writing', 'listening', 'speaking']:
            if skill in rubrics:
                skill_data = rubrics[skill]
                if isinstance(skill_data, dict):
                    score = skill_data.get('score', 0)
                    max_score = skill_data.get('max_score', 10)
                    if max_score > 0:
                        percentage = (score / max_score) * 100
                        skill_scores[skill] = round(percentage, 1)
                elif isinstance(skill_data, (int, float)):
                    # If just a number, assume it's percentage
                    skill_scores[skill] = float(skill_data)
        
        return skill_scores
        
    except Exception as e:
        logger.warning(f"Error parsing exam rubrics_scores for submission {exam_submission.id}: {e}")
        return skill_scores


# ==================== MAIN ENDPOINTS ====================

@router.get("/classes/{class_id}/progress-analysis", response_model=ClassProgressSummary)
async def get_class_progress_analysis(
    class_id: int,
    period_days: int = Query(30, ge=7, le=365, description="Analysis period in days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive progress analysis for a class
    - Overall class metrics
    - Skill performance breakdown
    - Support group distribution
    - Exercise type breakdown
    """
    logger.info(f"[PROGRESS] Class analysis: class_id={class_id}, period={period_days} days")
    
    # Verify class ownership
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_days)
    
    # Get students (only role='student')
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).all()
    student_ids = [e.user_id for e in enrollments]
    total_students = len(student_ids)
    
    if total_students == 0:
        return ClassProgressSummary(
            class_id=class_id,
            class_name=class_obj.name,
            total_students=0,
            average_score=0.0,
            completion_rate=0.0,
            students_needing_urgent_support=0,
            students_needing_moderate_support=0,
            students_doing_well=0
        )
    
    # Get exercises
    exercises = db.query(Exercise).filter(
        Exercise.class_id == class_id,
        Exercise.created_at >= start_date
    ).all()
    exercise_ids = [ex.id for ex in exercises]
    
    # Get submissions with eager loading
    submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids),
        Submission.student_id.in_(student_ids),
        Submission.submitted_at >= start_date
    ).all()
    
    graded_submissions = [
        s for s in submissions 
        if s.score is not None and s.graded_at is not None and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
    ]
    
    # Get exam assessments
    exams = db.query(ExamAssessment).filter(
        ExamAssessment.class_id == class_id,
        ExamAssessment.created_at >= start_date
    ).all()
    
    exam_submissions = []
    if exams:
        exam_ids = [ex.id for ex in exams]
        exam_submissions = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id.in_(exam_ids),
            ExamSubmission.student_id.in_(student_ids)
        ).all()
    
    # Calculate average score
    average_score = 0.0
    if graded_submissions:
        total_pct = sum(calculate_percentage(s.score, s.exercise.max_score) for s in graded_submissions)
        average_score = round(total_pct / len(graded_submissions), 1)
    
    # Calculate completion rate
    expected_submissions = len(exercises) * total_students
    completion_rate = 0.0
    if expected_submissions > 0:
        completion_rate = round((len(submissions) / expected_submissions) * 100, 1)
    
    # Calculate skill averages (from both exercises and exams)
    skill_data = {
        'reading': {'total': 0.0, 'count': 0},
        'writing': {'total': 0.0, 'count': 0},
        'listening': {'total': 0.0, 'count': 0},
        'speaking': {'total': 0.0, 'count': 0}
    }
    
    # Add scores from regular exercises (single skill)
    for sub in graded_submissions:
        if sub.exercise and sub.exercise.skill_type and sub.exercise.skill_type in skill_data:
            pct = calculate_percentage(sub.score, sub.exercise.max_score)
            skill_data[sub.exercise.skill_type]['total'] += pct
            skill_data[sub.exercise.skill_type]['count'] += 1
    
    # Add scores from exam assessments (4 skills per exam)
    for exam_sub in exam_submissions:
        if exam_sub.score is not None and exam_sub.graded_at:
            # Extract individual skill scores from exam
            exam_skills = extract_exam_skill_scores(exam_sub)
            for skill, score_pct in exam_skills.items():
                if skill in skill_data:
                    skill_data[skill]['total'] += score_pct
                    skill_data[skill]['count'] += 1
    
    skill_averages = {
        skill: round(data['total'] / data['count'], 1) if data['count'] > 0 else 0.0
        for skill, data in skill_data.items()
    }
    
    # Analyze support needs for each student
    support_counts = {'urgent': 0, 'moderate': 0, 'well': 0}
    
    for student_id in student_ids:
        student_subs = [s for s in graded_submissions if s.student_id == student_id]
        if not student_subs:
            support_counts['moderate'] += 1  # No submissions = needs attention
            continue
        
        # Calculate student metrics
        student_scores = [calculate_percentage(s.score, s.exercise.max_score) for s in student_subs]
        student_avg = sum(student_scores) / len(student_scores) if student_scores else 0
        
        last_sub = max(student_subs, key=lambda x: x.submitted_at or datetime.min)
        days_since = (datetime.now() - last_sub.submitted_at).days if last_sub.submitted_at else None
        
        completion = (len(student_subs) / len(exercises)) * 100 if exercises else 0
        trend = determine_trend(student_scores[-5:])
        
        support_level, _ = determine_support_level(student_avg, trend, completion, days_since)
        
        if support_level == "urgent":
            support_counts['urgent'] += 1
        elif support_level in ["moderate", "low"]:
            support_counts['moderate'] += 1
        else:
            support_counts['well'] += 1
    
    # Exercise breakdown
    exercise_breakdown = {
        "individual_skill": 0,
        "midterm_exam": 0,
        "final_exam": 0,
        "regular_exercises": 0
    }
    
    for ex in exercises:
        if ex.skill_type and ex.skill_type != "mixed":
            exercise_breakdown["individual_skill"] += 1
        else:
            exercise_breakdown["regular_exercises"] += 1
    
    for exam in exams:
        if exam.exam_type == "midterm":
            exercise_breakdown["midterm_exam"] += 1
        elif exam.exam_type == "final":
            exercise_breakdown["final_exam"] += 1
    
    return ClassProgressSummary(
        class_id=class_id,
        class_name=class_obj.name,
        total_students=total_students,
        average_score=average_score,
        completion_rate=completion_rate,
        skill_averages=skill_averages,
        students_needing_urgent_support=support_counts['urgent'],
        students_needing_moderate_support=support_counts['moderate'],
        students_doing_well=support_counts['well'],
        exercise_breakdown=exercise_breakdown
    )


@router.get("/classes/{class_id}/students-needing-support", response_model=SupportGroupsResponse)
async def get_students_needing_support(
    class_id: int,
    period_days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Identify and group students by support level
    - Urgent: Students needing immediate intervention
    - Moderate: Students needing monitoring
    - Doing well: Students performing well
    """
    logger.info(f"[SUPPORT] Analyzing support needs: class_id={class_id}")
    
    # Verify ownership
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_days)
    
    # Get students
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).all()
    student_ids = [e.user_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    student_map = {s.id: s for s in students}
    
    # Get exercises
    exercises = db.query(Exercise).filter(
        Exercise.class_id == class_id,
        Exercise.created_at >= start_date
    ).all()
    exercise_ids = [ex.id for ex in exercises]
    total_exercises = len(exercises)
    
    if not exercise_ids:
        return SupportGroupsResponse(
            class_id=class_id,
            class_name=class_obj.name,
            analysis_date=datetime.now(),
            urgent_support=[],
            moderate_support=[],
            doing_well=[],
            summary={'urgent': 0, 'moderate': 0, 'doing_well': 0, 'total': len(students)}
        )
    
    # Get all submissions
    all_submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids),
        Submission.student_id.in_(student_ids),
        Submission.submitted_at >= start_date
    ).all()
    
    # Group by student
    student_submissions_map = defaultdict(list)
    for sub in all_submissions:
        student_submissions_map[sub.student_id].append(sub)
    
    # Analyze each student
    urgent_list = []
    moderate_list = []
    doing_well_list = []
    
    for student in students:
        student_subs = student_submissions_map.get(student.id, [])
        graded_subs = [
            s for s in student_subs
            if s.score is not None and s.graded_at and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
        ]
        
        # Calculate metrics
        if graded_subs:
            scores = [calculate_percentage(s.score, s.exercise.max_score) for s in graded_subs]
            avg_score = sum(scores) / len(scores)
            trend = determine_trend(scores[-5:])
            
            last_sub = max(graded_subs, key=lambda x: x.submitted_at or datetime.min)
            days_since = (datetime.now() - last_sub.submitted_at).days if last_sub.submitted_at else None
        else:
            avg_score = 0.0
            trend = "stable"
            days_since = None
            scores = []
        
        completion_rate = (len(student_subs) / total_exercises * 100) if total_exercises > 0 else 0
        support_level, reasons = determine_support_level(avg_score, trend, completion_rate, days_since)
        
        # Identify weakest skills (from both exercises and exams)
        skill_scores = {
            'reading': [],
            'writing': [],
            'listening': [],
            'speaking': []
        }
        
        # Add scores from regular exercises
        for sub in graded_subs:
            if sub.exercise and sub.exercise.skill_type and sub.exercise.skill_type in skill_scores:
                pct = calculate_percentage(sub.score, sub.exercise.max_score)
                skill_scores[sub.exercise.skill_type].append(pct)
        
        # Add scores from exams (if available)
        # Get exam submissions for this student
        student_exam_subs = db.query(ExamSubmission).filter(
            ExamSubmission.student_id == student.id,
            ExamSubmission.score.isnot(None),
            ExamSubmission.graded_at.isnot(None)
        ).all()
        
        for exam_sub in student_exam_subs:
            exam_skills = extract_exam_skill_scores(exam_sub)
            for skill, score_pct in exam_skills.items():
                if skill in skill_scores:
                    skill_scores[skill].append(score_pct)
        
        skill_avgs = {
            skill: (sum(scores) / len(scores)) if scores else 0
            for skill, scores in skill_scores.items()
        }
        
        # Get 2 weakest skills
        weakest_skills = sorted(
            [(skill, avg) for skill, avg in skill_avgs.items() if avg > 0],
            key=lambda x: x[1]
        )[:2]
        weakest_skill_names = [skill.title() for skill, _ in weakest_skills]
        
        # Generate recommendations
        error_patterns = extract_error_patterns(graded_subs)
        recommendations = generate_recommendations(support_level, [s.lower() for s, _ in weakest_skills], error_patterns, trend)
        
        # Create support info
        support_info = StudentSupportInfo(
            student_id=student.id,
            student_name=student.full_name,
            support_level=support_level,
            average_score=round(avg_score, 1),
            weakest_skills=weakest_skill_names,
            reasons=reasons,
            recommendations=recommendations,
            declining_trend=(trend == "declining"),
            low_completion_rate=(completion_rate < 70),
            multiple_failed_assessments=(sum(1 for s in scores if s < 50) >= 3),
            no_recent_submissions=(days_since is not None and days_since > 7)
        )
        
        # Categorize
        if support_level == "urgent":
            urgent_list.append(support_info)
        elif support_level in ["moderate", "low"]:
            moderate_list.append(support_info)
        else:
            doing_well_list.append(support_info)
    
    # Sort by average score
    urgent_list.sort(key=lambda x: x.average_score)
    moderate_list.sort(key=lambda x: x.average_score)
    doing_well_list.sort(key=lambda x: x.average_score, reverse=True)
    
    return SupportGroupsResponse(
        class_id=class_id,
        class_name=class_obj.name,
        analysis_date=datetime.now(),
        urgent_support=urgent_list,
        moderate_support=moderate_list,
        doing_well=doing_well_list,
        summary={
            'urgent': len(urgent_list),
            'moderate': len(moderate_list),
            'doing_well': len(doing_well_list),
            'total': len(students)
        }
    )


@router.get("/classes/{class_id}/student/{student_id}/detailed-analysis", response_model=DetailedStudentAnalysis)
async def get_detailed_student_analysis(
    class_id: int,
    student_id: int,
    period_days: int = Query(90, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive detailed analysis for a single student
    - Overall performance and trends
    - Skill breakdown with weakest areas
    - Recent submissions with feedback
    - Error analysis and patterns
    - Personalized recommendations
    """
    logger.info(f"[DETAIL] Student analysis: class={class_id}, student={student_id}")
    
    # Verify ownership
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.user_id == student_id,
        Enrollment.role == "student"
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student not found in class")
    
    # Get student
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_days)
    
    # Get exercises
    exercises = db.query(Exercise).filter(
        Exercise.class_id == class_id,
        Exercise.created_at >= start_date
    ).all()
    exercise_ids = [ex.id for ex in exercises]
    
    # Get submissions
    submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids),
        Submission.student_id == student_id,
        Submission.submitted_at >= start_date
    ).order_by(desc(Submission.submitted_at)).all()
    
    total_submissions = len(submissions)
    graded_submissions = [
        s for s in submissions
        if s.score is not None and s.graded_at and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
    ]
    graded_count = len(graded_submissions)
    
    # Calculate overall average
    overall_average = 0.0
    if graded_submissions:
        total_pct = sum(calculate_percentage(s.score, s.exercise.max_score) for s in graded_submissions)
        overall_average = round(total_pct / graded_count, 1)
    
    # Skill breakdown
    skill_data = {
        'reading': {'scores': [], 'exercises': 0, 'completed': 0},
        'writing': {'scores': [], 'exercises': 0, 'completed': 0},
        'listening': {'scores': [], 'exercises': 0, 'completed': 0},
        'speaking': {'scores': [], 'exercises': 0, 'completed': 0}
    }
    
    for ex in exercises:
        if ex.skill_type and ex.skill_type in skill_data:
            skill_data[ex.skill_type]['exercises'] += 1
    
    for sub in submissions:
        if sub.exercise and sub.exercise.skill_type and sub.exercise.skill_type in skill_data:
            skill_data[sub.exercise.skill_type]['completed'] += 1
            if sub.score is not None and sub.exercise.max_score:
                pct = calculate_percentage(sub.score, sub.exercise.max_score)
                skill_data[sub.exercise.skill_type]['scores'].append(pct)
    
    # Get exam assessments (midterm & final)
    exams = db.query(ExamAssessment).filter(
        ExamAssessment.class_id == class_id,
        ExamAssessment.created_at >= start_date
    ).all()
    
    midterm_performance = None
    final_performance = None
    
    if exams:
        exam_ids = [ex.id for ex in exams]
        exam_submissions = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id.in_(exam_ids),
            ExamSubmission.student_id == student_id,
            ExamSubmission.score.isnot(None),
            ExamSubmission.graded_at.isnot(None)
        ).all()
        
        # Group exam submissions by type
        exam_map = {ex.id: ex for ex in exams}
        
        for exam_sub in exam_submissions:
            exam = exam_map.get(exam_sub.exam_id)
            if not exam:
                continue
            
            # Extract skill scores from this exam
            exam_skills = extract_exam_skill_scores(exam_sub)
            
            # Add to skill_data for overall calculation
            for skill, score_pct in exam_skills.items():
                if skill in skill_data:
                    skill_data[skill]['scores'].append(score_pct)
                    skill_data[skill]['completed'] += 1
            
            # Store for midterm/final performance
            if exam.exam_type == "midterm" and not midterm_performance:
                midterm_performance = exam_skills
            elif exam.exam_type == "final" and not final_performance:
                final_performance = exam_skills
    
    skills_breakdown = []
    for skill, data in skill_data.items():
        scores = data['scores']
        avg = (sum(scores) / len(scores)) if scores else 0.0
        trend = determine_trend(scores[-5:]) if len(scores) >= 3 else "stable"
        recent = scores[-5:] if scores else []
        pending = data['exercises'] - data['completed']
        
        # Identify weak areas (placeholder - could be enhanced with more detailed analysis)
        weak_areas = []
        if avg < 60:
            weak_areas.append(f"Điểm trung bình thấp ({avg:.1f}%)")
        if trend == "declining":
            weak_areas.append("Xu hướng giảm điểm")
        if pending > data['exercises'] * 0.3:
            weak_areas.append(f"{pending} bài chưa hoàn thành")
        
        skills_breakdown.append(SkillBreakdown(
            skill=skill,
            average_score=round(avg, 1),
            total_exercises=data['exercises'],
            completed_exercises=data['completed'],
            pending_exercises=pending,
            trend=trend,
            recent_scores=recent,
            weakest_areas=weak_areas
        ))
    
    # Recent submissions detail
    recent_submissions_detail = []
    for sub in submissions[:10]:  # Last 10 submissions
        if sub.exercise:
            pct = calculate_percentage(sub.score or 0, sub.exercise.max_score) if sub.exercise.max_score else 0
            
            errors = []
            if sub.error_analysis:
                try:
                    if isinstance(sub.error_analysis, str):
                        err_data = json.loads(sub.error_analysis)
                    else:
                        err_data = sub.error_analysis
                    if isinstance(err_data, dict):
                        errors = list(err_data.keys())[:5]
                except:
                    pass
            
            recent_submissions_detail.append(SubmissionDetail(
                submission_id=sub.id,
                exercise_title=sub.exercise.title,
                exercise_type=classify_exercise_type(sub.exercise),
                skill_type=sub.exercise.skill_type or "mixed",
                score=sub.score,
                max_score=sub.exercise.max_score,
                percentage=pct,
                teacher_feedback=sub.feedback,
                ai_feedback=sub.ai_feedback,
                errors_identified=errors,
                submitted_at=sub.submitted_at or datetime.now(),
                graded_at=sub.graded_at
            ))
    
    # Error analysis
    error_patterns = extract_error_patterns(graded_submissions)
    most_common = [p.category for p in error_patterns[:5]]
    improvement_sugg = []
    for pattern in error_patterns[:3]:
        if pattern.suggestions:
            improvement_sugg.extend(pattern.suggestions[:2])
    
    error_analysis = DetailedErrorAnalysis(
        student_id=student_id,
        student_name=student.full_name,
        total_errors=sum(p.frequency for p in error_patterns),
        error_patterns=error_patterns,
        most_common_errors=most_common,
        improvement_suggestions=improvement_sugg[:5]
    )
    
    # Monthly progress (last 4 months)
    monthly_progress = []
    for i in range(4):
        month_end = end_date - timedelta(days=30 * i)
        month_start = month_end - timedelta(days=30)
        
        month_subs = [
            s for s in graded_submissions
            if s.submitted_at and month_start <= s.submitted_at < month_end
        ]
        
        if month_subs:
            month_scores = [calculate_percentage(s.score, s.exercise.max_score) for s in month_subs]
            month_avg = sum(month_scores) / len(month_scores)
        else:
            month_avg = 0.0
        
        monthly_progress.insert(0, {
            'month': month_start.strftime('%Y-%m'),
            'average': round(month_avg, 1),
            'submissions': len(month_subs)
        })
    
    # Support level
    scores_list = [calculate_percentage(s.score, s.exercise.max_score) for s in graded_submissions]
    trend = determine_trend(scores_list[-5:])
    last_sub = graded_submissions[0] if graded_submissions else None
    days_since = (datetime.now() - last_sub.submitted_at).days if last_sub and last_sub.submitted_at else None
    completion = (total_submissions / len(exercises) * 100) if exercises else 0
    
    support_level, support_reasons = determine_support_level(overall_average, trend, completion, days_since)
    
    # Personalized recommendations
    weakest = sorted(
        [(s.skill, s.average_score) for s in skills_breakdown if s.average_score > 0],
        key=lambda x: x[1]
    )[:2]
    personalized_recs = generate_recommendations(
        support_level,
        [skill for skill, _ in weakest],
        error_patterns,
        trend
    )
    
    return DetailedStudentAnalysis(
        student_id=student_id,
        student_name=student.full_name,
        student_email=student.email,
        analysis_date=datetime.now(),
        overall_average=overall_average,
        total_submissions=total_submissions,
        graded_submissions=graded_count,
        skills_breakdown=skills_breakdown,
        recent_submissions=recent_submissions_detail,
        midterm_performance=midterm_performance,  # Extracted from exam submissions
        final_performance=final_performance,      # Extracted from exam submissions
        error_analysis=error_analysis,
        monthly_progress=monthly_progress,
        support_level=support_level,
        support_reasons=support_reasons,
        personalized_recommendations=personalized_recs,
        attendance_rate=None,  # TODO: Calculate from attendance table if available
        participation_score=None,
        last_activity=last_sub.submitted_at if last_sub else None
    )


@router.get("/classes/{class_id}/weekly-report/export")
async def export_weekly_report(
    class_id: int,
    week_start: Optional[datetime] = Query(None, description="Week start date (defaults to last Monday)"),
    include_error_analysis: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export weekly assessment report for a class
    - Individual student reports
    - Class-wide insights
    - Error analysis
    - Recommendations
    
    Returns Excel file with detailed weekly report
    """
    from fastapi.responses import StreamingResponse
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter
    from io import BytesIO
    
    logger.info(f"[EXPORT] Weekly report: class_id={class_id}")
    
    # Verify ownership
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate week range
    if not week_start:
        # Default to last Monday
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    
    week_period = f"Tuần {week_start.strftime('%d/%m/%Y')} - {week_end.strftime('%d/%m/%Y')}"
    
    # Get students
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.role == "student",
        Enrollment.status == "active"
    ).all()
    student_ids = [e.user_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    student_map = {s.id: s for s in students}
    
    # Get exercises in this week
    exercises = db.query(Exercise).filter(
        Exercise.class_id == class_id,
        Exercise.created_at >= week_start,
        Exercise.created_at < week_end
    ).all()
    exercise_ids = [ex.id for ex in exercises]
    
    # Get submissions
    all_submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids),
        Submission.student_id.in_(student_ids),
        Submission.submitted_at >= week_start,
        Submission.submitted_at < week_end
    ).all()
    
    # Group by student
    student_submissions_map = defaultdict(list)
    for sub in all_submissions:
        student_submissions_map[sub.student_id].append(sub)
    
    # Create workbook
    wb = Workbook()
    
    # Styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    title_font = Font(bold=True, size=14)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # ==================== SHEET 1: Overview ====================
    ws1 = wb.active
    ws1.title = "Tổng quan"
    
    ws1['A1'] = f'BÁO CÁO ĐÁNH GIÁ TUẦN - {class_obj.name}'
    ws1['A1'].font = Font(bold=True, size=16)
    ws1['A1'].alignment = Alignment(horizontal='center')
    ws1.merge_cells('A1:F1')
    
    ws1['A2'] = f'Giáo viên: {current_user.full_name}'
    ws1['A3'] = f'{week_period}'
    ws1['A4'] = f'Ngày xuất: {datetime.now().strftime("%d/%m/%Y %H:%M")}'
    
    # Class summary
    ws1['A6'] = 'TỔNG QUAN LỚP HỌC'
    ws1['A6'].font = title_font
    
    ws1['A7'] = 'Chỉ tiêu'
    ws1['B7'] = 'Giá trị'
    for cell in ['A7', 'B7']:
        ws1[cell].font = header_font
        ws1[cell].fill = header_fill
        ws1[cell].border = border
    
    total_students = len(students)
    students_submitted = len([s for s in student_ids if s in student_submissions_map])
    submission_rate = (students_submitted / total_students * 100) if total_students > 0 else 0
    
    graded_subs = [
        s for s in all_submissions
        if s.score is not None and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
    ]
    
    class_avg = 0.0
    if graded_subs:
        total_pct = sum(calculate_percentage(s.score, s.exercise.max_score) for s in graded_subs)
        class_avg = total_pct / len(graded_subs)
    
    ws1['A8'] = 'Tổng số học sinh'
    ws1['B8'] = total_students
    ws1['A9'] = 'Số học sinh nộp bài'
    ws1['B9'] = students_submitted
    ws1['A10'] = 'Tỷ lệ nộp bài'
    ws1['B10'] = f"{submission_rate:.1f}%"
    ws1['A11'] = 'Điểm trung bình lớp'
    ws1['B11'] = f"{class_avg:.1f}"
    ws1['A12'] = 'Số bài tập tuần này'
    ws1['B12'] = len(exercises)
    
    for row in range(8, 13):
        for col in ['A', 'B']:
            ws1[f'{col}{row}'].border = border
    
    ws1.column_dimensions['A'].width = 30
    ws1.column_dimensions['B'].width = 20
    
    # ==================== SHEET 2: Student Details ====================
    ws2 = wb.create_sheet("Chi tiết học sinh")
    
    headers = ['STT', 'Họ tên', 'Số bài nộp', 'Điểm TB', 'Kỹ năng yếu nhất', 'Xu hướng', 'Nhận xét']
    for col_idx, header in enumerate(headers, start=1):
        cell = ws2.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = border
        cell.alignment = Alignment(horizontal='center', vertical='center')
    
    row_idx = 2
    for idx, student in enumerate(sorted(students, key=lambda x: x.full_name), start=1):
        student_subs = student_submissions_map.get(student.id, [])
        graded = [
            s for s in student_subs
            if s.score is not None and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
        ]
        
        # Calculate metrics
        if graded:
            scores = [calculate_percentage(s.score, s.exercise.max_score) for s in graded]
            avg = sum(scores) / len(scores)
            trend = determine_trend(scores)
        else:
            avg = 0.0
            trend = "stable"
        
        # Weakest skill
        skill_scores = {'reading': [], 'writing': [], 'listening': [], 'speaking': []}
        for s in graded:
            if s.exercise and s.exercise.skill_type and s.exercise.skill_type in skill_scores:
                pct = calculate_percentage(s.score, s.exercise.max_score)
                skill_scores[s.exercise.skill_type].append(pct)
        
        skill_avgs = {
            skill: (sum(scores) / len(scores)) if scores else 0
            for skill, scores in skill_scores.items()
        }
        weakest = min(skill_avgs.items(), key=lambda x: x[1]) if any(skill_avgs.values()) else ("N/A", 0)
        
        # Performance comment
        if avg >= 80:
            comment = "Xuất sắc! Tiếp tục duy trì."
        elif avg >= 70:
            comment = "Tốt. Cần cố gắng thêm."
        elif avg >= 60:
            comment = "Trung bình. Cần theo dõi."
        elif avg >= 50:
            comment = "Yếu. Cần hỗ trợ."
        else:
            comment = "Rất yếu. Cần can thiệp khẩn cấp."
        
        if trend == "improving":
            comment += " (Đang tiến bộ)"
        elif trend == "declining":
            comment += " (Đang tụt)"
        
        ws2.cell(row=row_idx, column=1, value=idx).border = border
        ws2.cell(row=row_idx, column=2, value=student.full_name).border = border
        ws2.cell(row=row_idx, column=3, value=len(student_subs)).border = border
        ws2.cell(row=row_idx, column=4, value=f"{avg:.1f}").border = border
        ws2.cell(row=row_idx, column=5, value=weakest[0].title()).border = border
        
        trend_vn = {"improving": "Tăng", "declining": "Giảm", "stable": "Ổn định"}
        ws2.cell(row=row_idx, column=6, value=trend_vn.get(trend, trend)).border = border
        ws2.cell(row=row_idx, column=7, value=comment).border = border
        
        row_idx += 1
    
    # Column widths
    ws2.column_dimensions['A'].width = 8
    ws2.column_dimensions['B'].width = 25
    ws2.column_dimensions['C'].width = 12
    ws2.column_dimensions['D'].width = 12
    ws2.column_dimensions['E'].width = 18
    ws2.column_dimensions['F'].width = 12
    ws2.column_dimensions['G'].width = 40
    
    # ==================== SHEET 3: Error Analysis (if enabled) ====================
    if include_error_analysis:
        ws3 = wb.create_sheet("Phân tích lỗi")
        
        ws3['A1'] = 'PHÂN TÍCH LỖI THƯỜNG GẶP'
        ws3['A1'].font = title_font
        ws3.merge_cells('A1:D1')
        
        # Extract errors from all submissions
        all_error_patterns = extract_error_patterns(graded_subs)
        
        headers = ['Loại lỗi', 'Số lần xuất hiện', 'Mô tả', 'Gợi ý cải thiện']
        for col_idx, header in enumerate(headers, start=1):
            cell = ws3.cell(row=3, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
        
        row_idx = 4
        for pattern in all_error_patterns[:15]:  # Top 15 errors
            ws3.cell(row=row_idx, column=1, value=pattern.category).border = border
            ws3.cell(row=row_idx, column=2, value=pattern.frequency).border = border
            ws3.cell(row=row_idx, column=3, value=pattern.description[:100]).border = border
            suggestions_text = '; '.join(pattern.suggestions[:2]) if pattern.suggestions else "Cần ôn tập"
            ws3.cell(row=row_idx, column=4, value=suggestions_text[:100]).border = border
            row_idx += 1
        
        ws3.column_dimensions['A'].width = 20
        ws3.column_dimensions['B'].width = 15
        ws3.column_dimensions['C'].width = 40
        ws3.column_dimensions['D'].width = 40
    
    # ==================== SHEET 4: Recommendations ====================
    ws4 = wb.create_sheet("Khuyến nghị")
    
    ws4['A1'] = 'KHUYẾN NGHỊ VÀ ĐỀ XUẤT'
    ws4['A1'].font = title_font
    ws4.merge_cells('A1:C1')
    
    ws4['A3'] = 'A. HỌC SINH CẦN HỖ TRỢ KHẨN CẤP'
    ws4['A3'].font = Font(bold=True, size=12, color="FF0000")
    
    row_idx = 4
    urgent_students = []
    
    for student in students:
        student_subs = student_submissions_map.get(student.id, [])
        graded = [
            s for s in student_subs
            if s.score is not None and s.exercise and s.exercise.max_score and s.exercise.max_score > 0
        ]
        
        if graded:
            scores = [calculate_percentage(s.score, s.exercise.max_score) for s in graded]
            avg = sum(scores) / len(scores)
            trend = determine_trend(scores)
        else:
            avg = 0.0
            trend = "stable"
        
        completion = (len(student_subs) / len(exercises) * 100) if exercises else 0
        support_level, reasons = determine_support_level(avg, trend, completion, None)
        
        if support_level == "urgent":
            urgent_students.append((student, avg, reasons))
    
    if urgent_students:
        for student, avg, reasons in sorted(urgent_students, key=lambda x: x[1]):
            ws4[f'A{row_idx}'] = f"• {student.full_name} (Điểm TB: {avg:.1f})"
            ws4[f'A{row_idx}'].font = Font(bold=True)
            row_idx += 1
            
            for reason in reasons:
                ws4[f'B{row_idx}'] = f"- {reason}"
                row_idx += 1
            row_idx += 1
    else:
        ws4[f'A{row_idx}'] = "Không có học sinh cần hỗ trợ khẩn cấp."
        row_idx += 1
    
    row_idx += 2
    ws4[f'A{row_idx}'] = 'B. KHUYẾN NGHỊ CHUNG CHO LỚP'
    ws4[f'A{row_idx}'].font = Font(bold=True, size=12)
    row_idx += 1
    
    # Class-wide recommendations based on data
    recommendations = []
    
    if submission_rate < 70:
        recommendations.append(f"Tỷ lệ nộp bài thấp ({submission_rate:.0f}%) - Cần nhắc nhở học sinh tích cực hơn")
    
    if class_avg < 60:
        recommendations.append(f"Điểm trung bình lớp thấp ({class_avg:.1f}) - Cần xem xét điều chỉnh phương pháp giảng dạy")
    
    # Find most common errors
    if include_error_analysis and all_error_patterns:
        top_3_errors = [p.category for p in all_error_patterns[:3]]
        recommendations.append(f"Lỗi phổ biến nhất: {', '.join(top_3_errors)} - Cần tập trung giảng dạy các phần này")
    
    # Skill analysis
    skill_data = {'reading': [], 'writing': [], 'listening': [], 'speaking': []}
    for sub in graded_subs:
        if sub.exercise and sub.exercise.skill_type and sub.exercise.skill_type in skill_data:
            pct = calculate_percentage(sub.score, sub.exercise.max_score)
            skill_data[sub.exercise.skill_type].append(pct)
    
    skill_avgs = {
        skill: (sum(scores) / len(scores)) if scores else 0
        for skill, scores in skill_data.items()
    }
    
    if skill_avgs:
        weakest_skill = min(skill_avgs.items(), key=lambda x: x[1])
        if weakest_skill[1] < 65:
            recommendations.append(f"Kỹ năng {weakest_skill[0].title()} yếu nhất ({weakest_skill[1]:.1f}) - Cần bổ sung bài tập cho kỹ năng này")
    
    if not recommendations:
        recommendations.append("Lớp học đang hoạt động tốt. Tiếp tục duy trì phương pháp hiện tại.")
    
    for rec in recommendations:
        ws4[f'A{row_idx}'] = f"• {rec}"
        ws4[f'A{row_idx}'].alignment = Alignment(wrap_text=True, vertical='top')
        row_idx += 1
    
    ws4.column_dimensions['A'].width = 80
    ws4.column_dimensions['B'].width = 60
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    # Generate filename
    filename = f"BaoCaoTuan_{class_obj.name.replace(' ', '_')}_{week_start.strftime('%Y%m%d')}.xlsx"
    
    logger.info(f"[EXPORT] Weekly report completed: {filename}")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/classes/{class_id}/progress-report/export")
async def export_progress_report(
    class_id: int,
    period_days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export comprehensive progress report with all analytics
    - Class overview
    - All students detailed analysis
    - Support groups
    - Error patterns
    - Recommendations
    """
    from fastapi.responses import StreamingResponse
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from io import BytesIO
    
    logger.info(f"[EXPORT] Progress report: class_id={class_id}, period={period_days}")
    
    # Get class progress analysis
    class_progress = await get_class_progress_analysis(class_id, period_days, current_user, db)
    
    # Get support groups
    support_groups = await get_students_needing_support(class_id, period_days, current_user, db)
    
    # Create workbook
    wb = Workbook()
    
    # Styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    urgent_fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
    moderate_fill = PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid")
    good_fill = PatternFill(start_color="00B050", end_color="00B050", fill_type="solid")
    
    header_font = Font(bold=True, color="FFFFFF", size=12)
    title_font = Font(bold=True, size=14)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Get class object for name
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    
    # ==================== SHEET 1: Overview ====================
    ws1 = wb.active
    ws1.title = "Tổng quan"
    
    ws1['A1'] = f'BÁO CÁO PHÂN TÍCH TIẾN ĐỘ - {class_progress.class_name}'
    ws1['A1'].font = Font(bold=True, size=16)
    ws1['A1'].alignment = Alignment(horizontal='center')
    ws1.merge_cells('A1:D1')
    
    ws1['A2'] = f'Giáo viên: {current_user.full_name}'
    ws1['A3'] = f'Kỳ phân tích: {period_days} ngày'
    ws1['A4'] = f'Ngày xuất: {datetime.now().strftime("%d/%m/%Y %H:%M")}'
    
    # Metrics
    ws1['A6'] = 'CHỈ TIÊU TỔNG QUÁT'
    ws1['A6'].font = title_font
    
    metrics = [
        ('Tổng số học sinh', class_progress.total_students),
        ('Điểm trung bình', f"{class_progress.average_score:.1f}"),
        ('Tỷ lệ hoàn thành', f"{class_progress.completion_rate:.1f}%"),
        ('Học sinh cần hỗ trợ khẩn cấp', class_progress.students_needing_urgent_support),
        ('Học sinh cần theo dõi', class_progress.students_needing_moderate_support),
        ('Học sinh học tốt', class_progress.students_doing_well),
    ]
    
    row_idx = 7
    ws1['A7'] = 'Chỉ tiêu'
    ws1['B7'] = 'Giá trị'
    for cell in ['A7', 'B7']:
        ws1[cell].font = header_font
        ws1[cell].fill = header_fill
        ws1[cell].border = border
    
    row_idx = 8
    for label, value in metrics:
        ws1[f'A{row_idx}'] = label
        ws1[f'B{row_idx}'] = value
        for col in ['A', 'B']:
            ws1[f'{col}{row_idx}'].border = border
        row_idx += 1
    
    # Skills breakdown
    row_idx += 2
    ws1[f'A{row_idx}'] = 'ĐIỂM TRUNG BÌNH THEO KỸ NĂNG'
    ws1[f'A{row_idx}'].font = title_font
    row_idx += 1
    
    ws1[f'A{row_idx}'] = 'Kỹ năng'
    ws1[f'B{row_idx}'] = 'Điểm TB'
    for cell in [f'A{row_idx}', f'B{row_idx}']:
        ws1[cell].font = header_font
        ws1[cell].fill = header_fill
        ws1[cell].border = border
    row_idx += 1
    
    for skill, score in class_progress.skill_averages.items():
        ws1[f'A{row_idx}'] = skill.title()
        ws1[f'B{row_idx}'] = f"{score:.1f}"
        for col in ['A', 'B']:
            ws1[f'{col}{row_idx}'].border = border
        row_idx += 1
    
    ws1.column_dimensions['A'].width = 35
    ws1.column_dimensions['B'].width = 20
    
    # ==================== SHEET 2: Support Groups ====================
    ws2 = wb.create_sheet("Nhóm hỗ trợ")
    
    ws2['A1'] = 'PHÂN LOẠI HỌC SINH THEO MỨC ĐỘ HỖ TRỢ'
    ws2['A1'].font = title_font
    ws2.merge_cells('A1:E1')
    
    # Urgent support
    ws2['A3'] = '🚨 HỌC SINH CẦN HỖ TRỢ KHẨN CẤP'
    ws2['A3'].font = Font(bold=True, size=12, color="FF0000")
    ws2.merge_cells('A3:E3')
    
    headers = ['Họ tên', 'Điểm TB', 'Kỹ năng yếu', 'Lý do', 'Khuyến nghị']
    row_idx = 4
    for col_idx, header in enumerate(headers, start=1):
        cell = ws2.cell(row=row_idx, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = urgent_fill
        cell.border = border
    
    row_idx = 5
    for student in support_groups.urgent_support:
        ws2.cell(row=row_idx, column=1, value=student.student_name).border = border
        ws2.cell(row=row_idx, column=2, value=f"{student.average_score:.1f}").border = border
        ws2.cell(row=row_idx, column=3, value=', '.join(student.weakest_skills)).border = border
        ws2.cell(row=row_idx, column=4, value='; '.join(student.reasons)[:200]).border = border
        ws2.cell(row=row_idx, column=5, value='; '.join(student.recommendations[:2])[:200]).border = border
        row_idx += 1
    
    # Moderate support
    row_idx += 2
    ws2[f'A{row_idx}'] = '⚠️ HỌC SINH CẦN THEO DÕI'
    ws2[f'A{row_idx}'].font = Font(bold=True, size=12, color="FF8C00")
    ws2.merge_cells(f'A{row_idx}:E{row_idx}')
    row_idx += 1
    
    for col_idx, header in enumerate(headers, start=1):
        cell = ws2.cell(row=row_idx, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = moderate_fill
        cell.border = border
    
    row_idx += 1
    for student in support_groups.moderate_support:
        ws2.cell(row=row_idx, column=1, value=student.student_name).border = border
        ws2.cell(row=row_idx, column=2, value=f"{student.average_score:.1f}").border = border
        ws2.cell(row=row_idx, column=3, value=', '.join(student.weakest_skills)).border = border
        ws2.cell(row=row_idx, column=4, value='; '.join(student.reasons)[:200]).border = border
        ws2.cell(row=row_idx, column=5, value='; '.join(student.recommendations[:2])[:200]).border = border
        row_idx += 1
    
    ws2.column_dimensions['A'].width = 25
    ws2.column_dimensions['B'].width = 12
    ws2.column_dimensions['C'].width = 20
    ws2.column_dimensions['D'].width = 40
    ws2.column_dimensions['E'].width = 40
    
    # ==================== SHEET 3: All Students ====================
    ws3 = wb.create_sheet("Tất cả học sinh")
    
    headers = ['STT', 'Họ tên', 'Điểm TB', 'Reading', 'Writing', 'Listening', 'Speaking', 'Xu hướng', 'Mức hỗ trợ']
    for col_idx, header in enumerate(headers, start=1):
        cell = ws3.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = border
    
    # Combine all students
    all_students_info = (
        support_groups.urgent_support +
        support_groups.moderate_support +
        support_groups.doing_well
    )
    
    row_idx = 2
    for idx, student in enumerate(all_students_info, start=1):
        # Placeholder skill scores (would need to fetch individually)
        ws3.cell(row=row_idx, column=1, value=idx).border = border
        ws3.cell(row=row_idx, column=2, value=student.student_name).border = border
        ws3.cell(row=row_idx, column=3, value=f"{student.average_score:.1f}").border = border
        ws3.cell(row=row_idx, column=4, value="-").border = border  # Would need detailed data
        ws3.cell(row=row_idx, column=5, value="-").border = border
        ws3.cell(row=row_idx, column=6, value="-").border = border
        ws3.cell(row=row_idx, column=7, value="-").border = border
        
        trend_icon = "↑" if student.declining_trend else "→"
        ws3.cell(row=row_idx, column=8, value=trend_icon).border = border
        
        support_vn = {
            "urgent": "Khẩn cấp",
            "moderate": "Trung bình",
            "low": "Thấp",
            "none": "Không cần"
        }
        ws3.cell(row=row_idx, column=9, value=support_vn.get(student.support_level, student.support_level)).border = border
        
        row_idx += 1
    
    for col in range(1, 10):
        ws3.column_dimensions[get_column_letter(col)].width = 15
    ws3.column_dimensions['B'].width = 25
    
    # Save
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"BaoCaoPhanTichTienDo_{class_obj.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    logger.info(f"[EXPORT] Progress report completed: {filename}")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

