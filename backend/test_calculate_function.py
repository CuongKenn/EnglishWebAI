import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.submission import Submission
from app.models.exercise import Exercise
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

def calculate_score_percentage(score, max_score):
    if not max_score or max_score <= 0:
        return 0.0
    return round((score / max_score) * 100, 1)

def calculate_skill_scores_batch(submissions):
    skills = {
        'reading': {'total': 0.0, 'count': 0},
        'writing': {'total': 0.0, 'count': 0},
        'listening': {'total': 0.0, 'count': 0},
        'speaking': {'total': 0.0, 'count': 0}
    }
    
    print(f"Processing {len(submissions)} submissions")
    
    for sub in submissions:
        print(f"  Submission {sub.id}:")
        print(f"    exercise: {sub.exercise}")
        if sub.exercise:
            print(f"    skill_type: {sub.exercise.skill_type}")
        
        if not (sub.exercise and sub.exercise.skill_type):
            print(f"    SKIP: no exercise or skill_type")
            continue
            
        skill = sub.exercise.skill_type
        if skill not in skills:
            print(f"    SKIP: skill '{skill}' not in skills dict")
            continue
        
        final_score = sub.score if sub.score is not None else sub.ai_score
        if final_score is None:
            print(f"    SKIP: no score")
            continue
            
        score_pct = calculate_score_percentage(final_score, sub.exercise.max_score)
        skills[skill]['total'] += score_pct
        skills[skill]['count'] += 1
        print(f"    ADD: {skill} += {score_pct}% (count={skills[skill]['count']})")
    
    result = {
        skill: round(data['total'] / data['count'], 1) if data['count'] > 0 else 0.0
        for skill, data in skills.items()
    }
    
    print(f"\nFinal result: {result}")
    return result

db = SessionLocal()

# Get submissions with exercise loaded
subs = db.query(Submission).options(
    joinedload(Submission.exercise)
).filter(
    and_(
        Submission.student_id == 11,
        (Submission.score != None) | (Submission.ai_score != None)
    )
).all()

print(f"Found {len(subs)} graded submissions for student 11\n")

result = calculate_skill_scores_batch(subs)

db.close()
