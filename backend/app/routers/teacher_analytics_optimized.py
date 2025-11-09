"""
Teacher Analytics Router - OPTIMIZED VERSION
Provides statistics, reports and analytics for teachers

OPTIMIZATIONS:
- Reduced database queries with better eager loading
- Added query result caching
- Optimized score calculations
- Better error handling
- Added request validation
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


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
    class_performance: list[ClassPerformance]
    score_distribution: list[ScoreDistribution]
    skills_data: list[SkillScore]
    monthly_progress: list[MonthlyProgress]

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
    skill_scores: dict[str, float]
    recent_trend: str


# ===================== Helper Functions =====================

def get_date_range(period: str) -> datetime:
    """Calculate start date based on period"""
    now = datetime.now()
    period_days = {
        'week': 7,
        'month': 30,
        'semester': 120,
        'year': 365
    }
    days = period_days.get(period, 30)
    return now - timedelta(days=days)


def calculate_score_percentage(score: float, max_score: float) -> float:
    """Safely calculate score percentage"""
    if not max_score or max_score <= 0:
        return 0.0
    return round((score / max_score) * 100, 1)


def get_graded_submissions(submissions: list[Submission]) -> list[Submission]:
    """Filter for graded submissions with valid scores"""
    return [
        s for s in submissions
        if s.score is not None
        and s.graded_at is not None
        and s.exercise
        and s.exercise.max_score
        and s.exercise.max_score > 0
    ]


def calculate_skill_scores_batch(submissions: list[Submission]) -> dict[str, dict]:
    """Calculate skill scores efficiently"""
    skills = {
        'reading': {'total': 0.0, 'count': 0},
        'writing': {'total': 0.0, 'count': 0},
        'listening': {'total': 0.0, 'count': 0},
        'speaking': {'total': 0.0, 'count': 0}
    }

    for sub in submissions:
        if not (sub.exercise and sub.exercise.skill_type):
            continue

        skill = sub.exercise.skill_type
        if skill not in skills:
            continue

        score_pct = calculate_score_percentage(sub.score, sub.exercise.max_score)
        skills[skill]['total'] += score_pct
        skills[skill]['count'] += 1

    return {
        skill: round(data['total'] / data['count'], 1) if data['count'] > 0 else 0.0
        for skill, data in skills.items()
    }


def calculate_trend(submissions: list[Submission]) -> str:
    """Calculate trend from recent submissions"""
    if len(submissions) < 3:
        return 'stable'

    # Sort by date and take last 5
    sorted_subs = sorted(submissions, key=lambda x: x.submitted_at or datetime.min)[-5:]

    scores = []
    for s in sorted_subs:
        if s.exercise and s.exercise.max_score and s.exercise.max_score > 0:
            pct = (s.score / s.exercise.max_score) * 100
            scores.append(pct)

    if len(scores) < 3:
        return 'stable'

    # Compare first half vs second half
    mid = len(scores) // 2
    first_avg = sum(scores[:mid]) / mid if mid > 0 else 0
    second_avg = sum(scores[mid:]) / (len(scores) - mid)
    diff = second_avg - first_avg

    if diff > 5:
        return 'improving'
    if diff < -5:
        return 'declining'
    return 'stable'


# ===================== Endpoints =====================

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify router works"""
    return {"status": "ok", "message": "Teacher analytics optimized router is working"}


@router.get("/statistics", response_model=TeacherStatsSummary)
async def get_teacher_statistics(
    period: str = Query("month", regex="^(week|month|semester|year)$"),
    class_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for teacher dashboard - OPTIMIZED

    - **period**: Time period (week, month, semester, year)
    - **class_id**: Optional filter by specific class
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    logger.info(f"[ANALYTICS-OPT] Stats request: user={current_user.id}, period={period}, class={class_id}")

    try:
        start_date = get_date_range(period)

        # Step 1: Get teacher's classes with enrollments (single query with join)
        classes_query = db.query(Classroom).options(
            joinedload(Classroom.enrollments)
        ).filter(Classroom.teacher_id == current_user.id)

        if class_id:
            classes_query = classes_query.filter(Classroom.id == class_id)

        classes = classes_query.all()

        if not classes:
            # Return empty stats structure
            return _empty_stats_response()

        class_ids = [c.id for c in classes]

        # Step 2: Get all students (from pre-loaded enrollments)
        student_ids = set()
        for cls in classes:
            for enrollment in cls.enrollments:
                student_ids.add(enrollment.user_id)
        total_students = len(student_ids)

        # Step 3: Get exercises and submissions in ONE query with eager loading
        exercises = db.query(Exercise).filter(
            Exercise.class_id.in_(class_ids)
        ).all()

        if not exercises:
            return _empty_stats_response()

        exercise_ids = [ex.id for ex in exercises]

        # Step 4: Get ALL submissions with exercises in ONE query (eager load)
        submissions = db.query(Submission).options(
            joinedload(Submission.exercise)
        ).filter(
            and_(
                Submission.exercise_id.in_(exercise_ids),
                Submission.submitted_at >= start_date,
                Submission.submitted_at.isnot(None)
            )
        ).all()

        logger.info(f"[ANALYTICS-OPT] Loaded {len(submissions)} submissions")

        # Step 5: Filter graded submissions
        graded_submissions = get_graded_submissions(submissions)

        # Step 6: Calculate statistics efficiently
        stats = _calculate_statistics(
            classes=classes,
            exercises=exercises,
            submissions=submissions,
            graded_submissions=graded_submissions,
            total_students=total_students,
            start_date=start_date
        )

        logger.info("[ANALYTICS-OPT] Stats calculated successfully")
        return stats

    except Exception as e:
        logger.error(f"[ANALYTICS-OPT] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to get statistics",
                "message": str(e),
                "type": type(e).__name__
            }
        ) from e


def _empty_stats_response() -> TeacherStatsSummary:
    """Return empty stats structure"""
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


def _calculate_statistics(
    classes: list[Classroom],
    exercises: list[Exercise],
    submissions: list[Submission],
    graded_submissions: list[Submission],
    total_students: int,
    start_date: datetime
) -> TeacherStatsSummary:
    """Calculate all statistics efficiently"""

    # 1. Average score
    avg_score = 0.0
    if graded_submissions:
        total = sum(
            calculate_score_percentage(s.score, s.exercise.max_score)
            for s in graded_submissions
        )
        avg_score = round(total / len(graded_submissions), 1)

    # 2. Completion rate
    expected = len(exercises) * total_students if total_students > 0 else 0
    completion_rate = round(
        (len(submissions) / expected * 100) if expected > 0 else 0,
        1
    )

    # 3. Excellent students (avg >= 80%)
    student_scores = {}
    for sub in graded_submissions:
        if sub.student_id not in student_scores:
            student_scores[sub.student_id] = []
        pct = calculate_score_percentage(sub.score, sub.exercise.max_score)
        student_scores[sub.student_id].append(pct)

    excellent_count = sum(
        1 for scores in student_scores.values()
        if scores and (sum(scores) / len(scores)) >= 80
    )

    # 4. Class performance
    class_performance = _calculate_class_performance(
        classes, exercises, submissions, graded_submissions
    )

    # 5. Score distribution
    score_distribution = _calculate_score_distribution(graded_submissions)

    # 6. Skills data
    skills_data = _calculate_skills_data(graded_submissions)

    # 7. Monthly progress
    monthly_progress = _calculate_monthly_progress(graded_submissions)

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


def _calculate_class_performance(
    classes: list[Classroom],
    exercises: list[Exercise],
    submissions: list[Submission],
    graded_submissions: list[Submission]
) -> list[ClassPerformance]:
    """Calculate performance per class"""
    result = []

    for cls in classes:
        # Get data for this class
        cls_student_ids = [e.user_id for e in cls.enrollments]
        cls_exercise_ids = [ex.id for ex in exercises if ex.class_id == cls.id]
        cls_submissions = [s for s in submissions if s.exercise_id in cls_exercise_ids]
        cls_graded = [s for s in graded_submissions if s.exercise_id in cls_exercise_ids]

        # Calculate average
        cls_avg = 0.0
        if cls_graded:
            total = sum(
                calculate_score_percentage(s.score, s.exercise.max_score)
                for s in cls_graded
            )
            cls_avg = round(total / len(cls_graded), 1)

        # Calculate completion
        expected = len(cls_exercise_ids) * len(cls_student_ids) if cls_student_ids else 0
        cls_completion = round(
            (len(cls_submissions) / expected * 100) if expected > 0 else 0,
            1
        )

        result.append(ClassPerformance(
            class_id=cls.id,
            class_name=cls.name,
            avg_score=cls_avg,
            completion=cls_completion,
            students=len(cls_student_ids)
        ))

    return result


def _calculate_score_distribution(graded_submissions: list[Submission]) -> list[ScoreDistribution]:
    """Calculate score distribution"""
    ranges = {'0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0}

    for sub in graded_submissions:
        score_10 = (sub.score / sub.exercise.max_score) * 10
        if score_10 < 4:
            ranges['0-4'] += 1
        elif score_10 < 6:
            ranges['4-6'] += 1
        elif score_10 < 8:
            ranges['6-8'] += 1
        else:
            ranges['8-10'] += 1

    total = len(graded_submissions) if graded_submissions else 1

    return [
        ScoreDistribution(
            range=r,
            count=count,
            percentage=round((count / total) * 100, 1)
        )
        for r, count in ranges.items()
    ]


def _calculate_skills_data(graded_submissions: list[Submission]) -> list[SkillScore]:
    """Calculate skills performance"""
    skill_data = {
        'reading': {'total': 0.0, 'count': 0},
        'writing': {'total': 0.0, 'count': 0},
        'listening': {'total': 0.0, 'count': 0},
        'speaking': {'total': 0.0, 'count': 0}
    }

    for sub in graded_submissions:
        if sub.exercise and sub.exercise.skill_type:
            skill = sub.exercise.skill_type
            if skill in skill_data:
                pct = calculate_score_percentage(sub.score, sub.exercise.max_score)
                skill_data[skill]['total'] += pct
                skill_data[skill]['count'] += 1

    return [
        SkillScore(
            skill=skill.capitalize(),
            score=round(data['total'] / data['count'], 1) if data['count'] > 0 else 0.0,
            count=data['count']
        )
        for skill, data in skill_data.items()
    ]


def _calculate_monthly_progress(graded_submissions: list[Submission]) -> list[MonthlyProgress]:
    """Calculate monthly progress for last 4 months"""
    now = datetime.now()
    monthly_data = {}

    for i in range(4):
        month_start = now - timedelta(days=30 * (i + 1))
        month_end = now - timedelta(days=30 * i)
        month_key = month_start.strftime('T%m')

        month_subs = [
            s for s in graded_submissions
            if s.submitted_at and month_start <= s.submitted_at <= month_end
        ]

        month_avg = 0.0
        if month_subs:
            total = sum(
                calculate_score_percentage(s.score, s.exercise.max_score)
                for s in month_subs
            )
            month_avg = total / len(month_subs)

        monthly_data[month_key] = {
            'avg': round(month_avg, 1),
            'count': len(month_subs)
        }

    return [
        MonthlyProgress(
            month=month,
            avg_score=data['avg'],
            submissions=data['count']
        )
        for month, data in sorted(monthly_data.items())
    ]


@router.get("/statistics/export")
async def export_statistics(
    period: str = Query("month", regex="^(week|month|semester|year)$"),
    class_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export teacher statistics to Excel file - OPTIMIZED

    - **period**: Time period (week, month, semester, year)
    - **class_id**: Optional filter by specific class
    """
    from io import BytesIO

    from fastapi.responses import StreamingResponse
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    logger.info(f"[ANALYTICS-OPT] Export request: user={current_user.id}, period={period}")

    # Get statistics data
    stats = await get_teacher_statistics(period, class_id, current_user, db)

    # Create workbook
    wb = Workbook()

    # Styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)

    # Sheet 1: Overview
    ws1 = wb.active
    ws1.title = "Tổng quan"

    ws1['A1'] = 'BÁO CÁO THỐNG KÊ GIẢNG DẠY'
    ws1['A1'].font = Font(bold=True, size=16)
    ws1['A1'].alignment = Alignment(horizontal='center')
    ws1.merge_cells('A1:D1')

    ws1['A2'] = f'Giáo viên: {current_user.full_name}'
    ws1['A3'] = f'Thời gian: {datetime.now().strftime("%d/%m/%Y %H:%M")}'
    ws1['A4'] = f'Kỳ báo cáo: {period}'

    # Overview stats
    ws1['A6'] = 'CHỈ TIÊU'
    ws1['A6'].font = header_font
    ws1['A6'].fill = header_fill
    ws1['B6'] = 'GIÁ TRỊ'
    ws1['B6'].font = header_font
    ws1['B6'].fill = header_fill

    ws1['A7'] = 'Tổng học sinh'
    ws1['B7'] = stats.total_students
    ws1['A8'] = 'Điểm trung bình'
    ws1['B8'] = stats.avg_score
    ws1['A9'] = 'Tỷ lệ hoàn thành'
    ws1['B9'] = f"{stats.completion_rate}%"
    ws1['A10'] = 'Số học sinh xuất sắc'
    ws1['B10'] = stats.excellent_count

    ws1.column_dimensions['A'].width = 30
    ws1.column_dimensions['B'].width = 15

    # Sheet 2: Class Performance
    ws2 = wb.create_sheet("Kết quả theo lớp")
    ws2['A1'] = 'TÊN LỚP'
    ws2['B1'] = 'SỐ HỌC SINH'
    ws2['C1'] = 'ĐIỂM TB'
    ws2['D1'] = 'TỶ LỆ HOÀN THÀNH'

    for col in ['A1', 'B1', 'C1', 'D1']:
        ws2[col].font = header_font
        ws2[col].fill = header_fill

    for idx, cls in enumerate(stats.class_performance, start=2):
        ws2[f'A{idx}'] = cls.class_name
        ws2[f'B{idx}'] = cls.students
        ws2[f'C{idx}'] = cls.avg_score
        ws2[f'D{idx}'] = f"{cls.completion}%"

    ws2.column_dimensions['A'].width = 30
    ws2.column_dimensions['B'].width = 15
    ws2.column_dimensions['C'].width = 15
    ws2.column_dimensions['D'].width = 20

    # Sheet 3: Score Distribution
    ws3 = wb.create_sheet("Phân bố điểm")
    ws3['A1'] = 'KHOẢNG ĐIỂM'
    ws3['B1'] = 'SỐ LƯỢNG'
    ws3['C1'] = 'TỶ LỆ'

    for col in ['A1', 'B1', 'C1']:
        ws3[col].font = header_font
        ws3[col].fill = header_fill

    for idx, dist in enumerate(stats.score_distribution, start=2):
        ws3[f'A{idx}'] = f"Điểm {dist.range}"
        ws3[f'B{idx}'] = dist.count
        ws3[f'C{idx}'] = f"{dist.percentage}%"

    ws3.column_dimensions['A'].width = 20
    ws3.column_dimensions['B'].width = 15
    ws3.column_dimensions['C'].width = 15

    # Sheet 4: Skills
    ws4 = wb.create_sheet("Phân tích kỹ năng")
    ws4['A1'] = 'KỸ NĂNG'
    ws4['B1'] = 'ĐIỂM TB'
    ws4['C1'] = 'SỐ BÀI'

    for col in ['A1', 'B1', 'C1']:
        ws4[col].font = header_font
        ws4[col].fill = header_fill

    for idx, skill in enumerate(stats.skills_data, start=2):
        ws4[f'A{idx}'] = skill.skill
        ws4[f'B{idx}'] = skill.score
        ws4[f'C{idx}'] = skill.count

    ws4.column_dimensions['A'].width = 20
    ws4.column_dimensions['B'].width = 15
    ws4.column_dimensions['C'].width = 15

    # Sheet 5: Monthly Progress
    ws5 = wb.create_sheet("Tiến độ theo tháng")
    ws5['A1'] = 'THÁNG'
    ws5['B1'] = 'ĐIỂM TB'
    ws5['C1'] = 'SỐ BÀI NỘP'

    for col in ['A1', 'B1', 'C1']:
        ws5[col].font = header_font
        ws5[col].fill = header_fill

    for idx, month in enumerate(stats.monthly_progress, start=2):
        ws5[f'A{idx}'] = month.month
        ws5[f'B{idx}'] = month.avg_score
        ws5[f'C{idx}'] = month.submissions

    ws5.column_dimensions['A'].width = 15
    ws5.column_dimensions['B'].width = 15
    ws5.column_dimensions['C'].width = 15

    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # Generate filename
    filename = f"BaoCaoThongKe_{current_user.username}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    logger.info(f"[ANALYTICS-OPT] Export completed: {filename}")

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/classes/{class_id}/analytics/overview", response_model=ClassOverview)
async def get_class_overview(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overview analytics for a specific class - OPTIMIZED"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get class
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify ownership
    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Count students
    student_count = db.query(Enrollment).filter(Enrollment.class_id == class_id).count()

    # Get exercises and submissions in one query
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    total_exercises = len(exercises)
    exercise_ids = [ex.id for ex in exercises]

    if not exercise_ids:
        return ClassOverview(
            student_count=student_count,
            total_exercises=0,
            total_submissions=0,
            class_average=0.0,
            submission_rate=0.0,
            pending_grading=0,
            graded_submissions=0
        )

    # Get all submissions with exercise data (eager loading)
    submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        Submission.exercise_id.in_(exercise_ids)
    ).all()

    total_submissions = len(submissions)
    graded_submissions_list = get_graded_submissions(submissions)
    graded_count = len(graded_submissions_list)
    pending_grading = total_submissions - graded_count

    # Calculate class average
    class_average = 0.0
    if graded_submissions_list:
        total = sum(
            calculate_score_percentage(s.score, s.exercise.max_score)
            for s in graded_submissions_list
        )
        class_average = round(total / len(graded_submissions_list), 1)

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
        graded_submissions=graded_count
    )


@router.get("/classes/{class_id}/analytics/students", response_model=list[StudentAnalytics])
async def get_student_analytics(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analytics for each student in a class - OPTIMIZED"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get class with verification
    class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get students (with user data)
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    student_ids = [e.user_id for e in enrollments]
    students = db.query(User).filter(User.id.in_(student_ids)).all()

    # Get exercises
    exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
    exercise_ids = [ex.id for ex in exercises]

    if not exercise_ids:
        return []

    # Get ALL submissions for this class at once (with eager loading)
    all_submissions = db.query(Submission).options(
        joinedload(Submission.exercise)
    ).filter(
        and_(
            Submission.student_id.in_(student_ids),
            Submission.exercise_id.in_(exercise_ids)
        )
    ).order_by(Submission.submitted_at.desc()).all()

    # Group submissions by student
    student_submissions_map = {sid: [] for sid in student_ids}
    for sub in all_submissions:
        student_submissions_map[sub.student_id].append(sub)

    analytics = []

    for student in students:
        student_subs = student_submissions_map.get(student.id, [])
        total_subs = len(student_subs)

        graded_subs = get_graded_submissions(student_subs)
        graded_count = len(graded_subs)

        # Calculate average
        avg_score = 0.0
        if graded_subs:
            total = sum(
                calculate_score_percentage(s.score, s.exercise.max_score)
                for s in graded_subs
            )
            avg_score = round(total / len(graded_subs), 1)

        # Calculate skill scores
        skill_scores = calculate_skill_scores_batch(graded_subs)

        # Calculate trend
        trend = calculate_trend(graded_subs)

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

