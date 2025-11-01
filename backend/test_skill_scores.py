from app.core.database import SessionLocal
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.models.user import User

db = SessionLocal()

student = db.query(User).filter(User.full_name.like('%NGUYEN THANH TRUNG%')).first()
print(f'Student: {student.full_name} (ID: {student.id})')

subs = db.query(Submission).join(Exercise).filter(
    Submission.student_id == student.id
).all()

graded = [s for s in subs if (s.score is not None or s.ai_score is not None) and s.exercise and s.exercise.max_score]

skills = {'reading': [], 'writing': [], 'listening': [], 'speaking': []}

for s in graded:
    if s.exercise.skill_type:
        final_score = s.score if s.score is not None else s.ai_score
        pct = (final_score / s.exercise.max_score) * 100
        skills[s.exercise.skill_type].append(pct)
        print(f'{s.exercise.skill_type}: {final_score}/{s.exercise.max_score} = {pct:.1f}%')

print('\nAverage by skill:')
for skill, scores in skills.items():
    if scores:
        avg = sum(scores) / len(scores)
        print(f'{skill}: {avg:.1f}')
    else:
        print(f'{skill}: 0.0')

db.close()
