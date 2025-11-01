import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.user import User
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.exercise import Exercise
from app.models.submission import Submission
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

db = SessionLocal()

# Get class 1
class_id = 1
class_obj = db.query(Classroom).filter(Classroom.id == class_id).first()
print(f"Class: {class_obj.name}")

# Get students
enrollments = db.query(Enrollment).filter(
    Enrollment.class_id == class_id,
    Enrollment.role == "student",
    Enrollment.status == "active"
).all()
student_ids = [e.user_id for e in enrollments]
students = db.query(User).filter(User.id.in_(student_ids)).all()
print(f"Students: {len(students)}")

# Get exercises
exercises = db.query(Exercise).filter(Exercise.class_id == class_id).all()
exercise_ids = [ex.id for ex in exercises]
print(f"Exercises: {len(exercises)}")

# Get submissions
all_submissions = db.query(Submission).options(
    joinedload(Submission.exercise)
).filter(
    and_(
        Submission.student_id.in_(student_ids),
        Submission.exercise_id.in_(exercise_ids)
    )
).all()

print(f"Submissions: {len(all_submissions)}")

# Calculate for first student
for student in students[:1]:
    student_subs = [s for s in all_submissions if s.student_id == student.id]
    print(f"\n=== {student.full_name} ===")
    print(f"Total submissions: {len(student_subs)}")
    
    graded = [s for s in student_subs if (s.score is not None or s.ai_score is not None) and s.exercise and s.exercise.max_score and s.exercise.max_score > 0]
    print(f"Graded submissions: {len(graded)}")
    
    # Calculate skill scores
    skills = {'reading': [], 'writing': [], 'listening': [], 'speaking': []}
    
    for s in graded:
        if s.exercise.skill_type:
            final_score = s.score if s.score is not None else s.ai_score
            pct = (final_score / s.exercise.max_score) * 100
            skills[s.exercise.skill_type].append(pct)
            print(f"  {s.exercise.skill_type}: {final_score}/{s.exercise.max_score} = {pct:.1f}%")
    
    print("\nSkill averages:")
    for skill, scores in skills.items():
        if scores:
            avg = sum(scores) / len(scores)
            print(f"  {skill}: {avg:.1f}")
        else:
            print(f"  {skill}: 0.0")

db.close()
