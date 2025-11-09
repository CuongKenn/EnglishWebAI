"""
Quick script to test auto-grading flow without external AI keys.
- Grades objective questions (MCQ/TF/fill_blank/matching) using code
- Optionally simulates writing/speaking when OPENAI/AZURE keys are present
Run inside backend container:
  python scripts/test_autograde.py
"""
import json
import os

# Ensure backend module path
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.classroom import Classroom
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.user import User, UserRole
from app.services.ai_grading_service import AIGradingService


def create_sample_exam(db):
    # Minimal exam with objective + optional writing/speaking
    content = {
        "sections": [
            {
                "section_name": "Listening",
                "tasks": [
                    {
                        "task_name": "MCQ",
                        "questions": [
                            {"question_id": 1, "question_type": "multiple_choice", "points": 1.0, "correct_answer": "A", "question_text": "Choose A?"},
                            {"question_id": 2, "question_type": "true_false", "points": 1.0, "correct_answer": "true", "question_text": "True?"},
                            {"question_id": 3, "question_type": "fill_blank", "points": 1.0, "correct_answer": "restore", "question_text": "Type 'restore'"},
                            {"question_id": 4, "question_type": "matching", "points": 1.0, "correct_answer": {"a":"1","b":"2"}, "question_text": "Match"}
                        ]
                    }
                ]
            },
            {
                "section_name": "Writing",
                "tasks": [
                    {
                        "task_name": "Essay",
                        "questions": [
                            {"question_id": 5, "question_type": "essay", "points": 2.0, "rubric": {"content":"","grammar":"","vocabulary":"","structure":""}, "question_text": "Write 2-3 sentences"}
                        ]
                    }
                ]
            },
            {
                "section_name": "Speaking",
                "tasks": [
                    {
                        "task_name": "Talk",
                        "questions": [
                            {"question_id": 6, "question_type": "speaking", "points": 2.0, "rubric": {"content":"","grammar":"","vocabulary":""}, "question_text": "Say hello"}
                        ]
                    }
                ]
            }
        ]
    }

    teacher = User(username="t_teacher", email="t@e.com", hashed_password="x", role=UserRole.TEACHER, is_active=True)
    student = User(username="s_student", email="s@e.com", hashed_password="x", role=UserRole.USER, is_active=True)
    db.add_all([teacher, student])
    db.commit()
    db.refresh(teacher)
    db.refresh(student)

    classroom = Classroom(name="C1", code="C1", description="", teacher_id=teacher.id, is_active=True)
    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    exam = ExamAssessment(
        class_id=classroom.id,
        teacher_id=teacher.id,
        exam_type='final',
        title='AutoGrade Test',
        description='Auto grade test',
        content=content,
        total_points=10.0,
        duration=60,
        ai_parsed=True,
        is_active=True,
        is_published=True
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Student answers: correct MCQ/TF/fill_blank; partial matching; include writing text; no speaking audio
    answers = {
        "1": "A",
        "2": "true",
        "3": "  ReStoRe  ",
        "4": {"a":"1","b":"x"},
        "5": "This is a short essay for testing.",
        # "6": "media/path/to/audio.wav"  # add if you want to test speaking with Azure
    }
    submission = ExamSubmission(
        exam_id=exam.id,
        student_id=student.id,
        answers=answers,
        status="submitted",
        submitted_at=datetime.utcnow()
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return exam, submission


def main():
    print("=== Auto-grade quick test ===")
    db = SessionLocal()
    try:
        exam, submission = create_sample_exam(db)
        AIGradingService()

        # Use router helper logic: import function to ensure same behavior
        import asyncio

        from app.routers.exam_assessments import _auto_grade_exam_submission
        asyncio.run(_auto_grade_exam_submission(submission, db))

        db.commit()
        db.refresh(submission)

        print("\nResult:")
        print("status:", submission.status)
        print("ai_score:", submission.ai_score)
        print("rubrics (truncated):", json.dumps(submission.rubrics_scores)[:500], "...")
        print("\nNote:")
        if not os.getenv("OPENAI_API_KEY"):
            print("- No OPENAI_API_KEY: writing/speaking content won’t be AI-graded (kept pending_review)")
        if not os.getenv("AZURE_SPEECH_KEY"):
            print("- No AZURE_SPEECH_KEY: speaking pronunciation won’t run")
    finally:
        db.close()

if __name__ == "__main__":
    main()
