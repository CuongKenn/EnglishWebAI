from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.course import Course, CourseExercise, CourseSubmission


router = APIRouter(prefix="/api/v1/student/profile", tags=["Student Profile"])


def _avg_score(values: List[float]) -> float:
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else 0.0


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    # Exercises submissions
    subs: List[Submission] = (
        db.query(Submission)
        .filter(Submission.student_id == current_user.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    # Course submissions (lessons inside courses)
    course_subs: List[CourseSubmission] = (
        db.query(CourseSubmission)
        .filter(CourseSubmission.student_id == current_user.id)
        .order_by(CourseSubmission.submitted_at.desc())
        .all()
    )

    total_tests = len(subs)

    # Lessons/tests inside courses counted separately
    total_course_lessons = len(course_subs)
    total_course_tests = 0
    total_course_time = 0
    cups_sum = 0

    if course_subs:
        exercise_ids = [s.exercise_id for s in course_subs]
        exercise_map = {}
        if exercise_ids:
            for ex in (
                db.query(CourseExercise)
                .filter(CourseExercise.id.in_(exercise_ids))
                .all()
            ):
                exercise_map[ex.id] = ex

        for sub in course_subs:
            cups_sum += sub.score or 0
            total_course_time += sub.time_spent or 0
            ex = exercise_map.get(sub.exercise_id)
            if ex and ex.type == "quiz":
                total_course_tests += 1

    # Cups from course submissions fallback (in case there are no course submissions above)
    if cups_sum == 0 and not course_subs:
        cups_sum = (
            db.query(func.coalesce(func.sum(CourseSubmission.score), 0))
            .filter(CourseSubmission.student_id == current_user.id)
            .scalar()
            or 0
        )

    # Lessons: approximate as number of unique exercises with a graded or AI graded score
    graded_count = len([s for s in subs if (s.score is not None) or (s.ai_score is not None)])
    total_lessons = graded_count + total_course_lessons

    # Simple streak calculation based on exercise submissions by day (course submissions currently excluded)
    dates = (
        db.query(cast(Submission.submitted_at, Date))
        .filter(Submission.student_id == current_user.id)
        .group_by(cast(Submission.submitted_at, Date))
        .order_by(cast(Submission.submitted_at, Date).desc())
        .all()
    )
    date_list = [d[0] for d in dates]
    streak = 0
    today = datetime.utcnow().date()
    day = today
    while day in date_list:
        streak += 1
        day = day - timedelta(days=1)

    # Level/rank heuristic: use average percent score across submissions
    # Normalize by exercise.max_score when available
    if subs:
        ex_map = {}
        ex_ids = list({s.exercise_id for s in subs})
        if ex_ids:
            for ex in db.query(Exercise).filter(Exercise.id.in_(ex_ids)).all():
                ex_map[ex.id] = ex
        percents = []
        for s in subs:
            ex = ex_map.get(s.exercise_id)
            max_s = float(ex.max_score or 10) if ex else 10.0
            val = s.score if s.score is not None else s.ai_score
            if val is not None and max_s > 0:
                percents.append(100.0 * float(val) / max_s)
        avg_percent = round(sum(percents) / len(percents), 2) if percents else 0.0
    else:
        avg_percent = 0.0

    level = int(avg_percent // 12.5)  # 0..8 roughly
    rank = "Gold" if avg_percent >= 75 else ("Silver" if avg_percent >= 50 else "Bronze")

    return {
        "totalTime": int(total_course_time) if total_course_time else None,
        "totalCups": int(cups_sum or 0),
        "totalTests": total_tests + total_course_tests,
        "totalLessons": total_lessons,
        "streak": streak,
        "level": level,
        "rank": rank,
        "completionRate": int(avg_percent),
    }


@router.get("/skills")
def get_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    subs: List[Submission] = (
        db.query(Submission)
        .filter(Submission.student_id == current_user.id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )
    if not subs:
        return []

    # Map exercises
    ex_ids = list({s.exercise_id for s in subs})
    ex_map = {}
    if ex_ids:
        for ex in db.query(Exercise).filter(Exercise.id.in_(ex_ids)).all():
            ex_map[ex.id] = ex

    buckets: Dict[str, Dict[str, Any]] = {}
    for s in subs:
        ex = ex_map.get(s.exercise_id)
        if not ex:
            continue
        skill = ex.skill_type or "general"
        max_s = float(ex.max_score or 10)
        val = s.score if s.score is not None else s.ai_score
        if max_s <= 0 or val is None:
            continue
        percent = 100.0 * float(val) / max_s
        b = buckets.setdefault(skill, {"values": []})
        b["values"].append(percent)

    # Format for frontend
    skill_map = {
        "listening": {"label": "Nghe", "icon": "🎧", "color": "#3b82f6"},
        "speaking": {"label": "Nói", "icon": "🗣️", "color": "#ec4899"},
        "reading": {"label": "Đọc", "icon": "📖", "color": "#10b981"},
        "writing": {"label": "Viết", "icon": "✍️", "color": "#f59e0b"},
        "general": {"label": "Tổng hợp", "icon": "📚", "color": "#64748b"},
    }
    out = []
    for key, data in buckets.items():
        meta = skill_map.get(key, skill_map["general"])
        progress = round(sum(data["values"]) / len(data["values"])) if data["values"] else 0
        out.append({
            "skill": meta["label"],
            "icon": meta["icon"],
            "score": round(progress / 10, 1),
            "maxScore": 10,
            "progress": progress,
            "color": meta["color"],
        })

    return out


@router.get("/recent")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    subs = (
        db.query(Submission)
        .filter(Submission.student_id == current_user.id)
        .order_by(Submission.submitted_at.desc())
        .limit(10)
        .all()
    )
    ex_map = {}
    if subs:
        ex_ids = list({s.exercise_id for s in subs})
        for ex in db.query(Exercise).filter(Exercise.id.in_(ex_ids)).all():
            ex_map[ex.id] = ex

    # Course submissions
    course_subs = (
        db.query(CourseSubmission)
        .filter(CourseSubmission.student_id == current_user.id)
        .order_by(CourseSubmission.submitted_at.desc())
        .limit(10)
        .all()
    )
    course_ex_map = {}
    if course_subs:
        ex_ids = list({s.exercise_id for s in course_subs})
        if ex_ids:
            for ex in db.query(CourseExercise).filter(CourseExercise.id.in_(ex_ids)).all():
                course_ex_map[ex.id] = ex

    combined = []
    for s in subs:
        ex = ex_map.get(s.exercise_id)
        if not ex:
            continue
        score_val = s.score if s.score is not None else s.ai_score
        combined.append({
            "id": f"submission-{s.id}",
            "type": "test" if ex.type == "test" else "lesson",
            "title": ex.title,
            "date": s.submitted_at.strftime("%d/%m/%Y") if s.submitted_at else None,
            "time": s.submitted_at.strftime("%H:%M") if s.submitted_at else None,
            "score": round(100.0 * float(score_val) / float(ex.max_score or 10)) if score_val is not None else None,
        })

    for s in course_subs:
        ex = course_ex_map.get(s.exercise_id)
        title = ex.title if ex else "Bài học"  # fallback title
        item_type = "test" if ex and ex.type == "quiz" else "lesson"
        score_val = s.score
        combined.append({
            "id": f"course-{s.id}",
            "type": item_type,
            "title": title,
            "date": s.submitted_at.strftime("%d/%m/%Y") if s.submitted_at else None,
            "time": s.submitted_at.strftime("%H:%M") if s.submitted_at else None,
            "score": score_val,
        })

    combined.sort(key=lambda item: (item.get("date") or "", item.get("time") or ""), reverse=True)

    return combined[:10]
