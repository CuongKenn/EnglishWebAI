"""
Test script for exam speaking auto-grading
Creates a sample exam with speaking question and tests auto-grading
"""
import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.exam_assessment import ExamAssessment, ExamSubmission
from app.models.user import User
from app.models.classroom import Classroom
from datetime import datetime
import json


async def create_test_exam_and_submission():
    """Create a test exam with speaking question and a sample submission"""
    db = SessionLocal()
    
    try:
        # Get first classroom and teacher
        classroom = db.query(Classroom).first()
        if not classroom:
            print("❌ No classroom found. Please create a classroom first.")
            return
        
        teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
        student = db.query(User).filter(User.role == 'user').first()
        
        if not teacher or not student:
            print("❌ No teacher or student found.")
            return
        
        print(f"✅ Using classroom: {classroom.name} (ID: {classroom.id})")
        print(f"✅ Teacher: {teacher.full_name} (ID: {teacher.id})")
        print(f"✅ Student: {student.full_name} (ID: {student.id})")
        
        # Create exam with speaking question
        exam_content = {
            "exam_title": "Test Exam - Speaking Auto Grade",
            "total_points": 10.0,
            "duration": 60,
            "sections": [
                {
                    "section_name": "Part 1: Multiple Choice",
                    "tasks": [
                        {
                            "task_name": "Choose the correct answer",
                            "questions": [
                                {
                                    "question_id": "1",
                                    "question_type": "multiple_choice",
                                    "question_text": "What is the capital of France?",
                                    "options": ["A. London", "B. Berlin", "C. Paris", "D. Madrid"],
                                    "correct_answer": "C",
                                    "points": 2.0
                                }
                            ]
                        }
                    ]
                },
                {
                    "section_name": "Part 2: Speaking",
                    "tasks": [
                        {
                            "task_name": "Describe the picture",
                            "questions": [
                                {
                                    "question_id": "2",
                                    "question_type": "speaking",
                                    "question_text": "Describe what you see in this picture. Talk about the people, objects, and activities.",
                                    "reference_text": "There is a beautiful park with green trees. People are walking and children are playing.",
                                    "points": 5.0,
                                    "rubric": {
                                        "content": "Content and relevance",
                                        "grammar": "Grammar accuracy",
                                        "vocabulary": "Vocabulary range"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    "section_name": "Part 3: Writing",
                    "tasks": [
                        {
                            "task_name": "Write an essay",
                            "questions": [
                                {
                                    "question_id": "3",
                                    "question_type": "essay",
                                    "question_text": "Write about your favorite hobby. Why do you like it?",
                                    "points": 3.0,
                                    "rubric": {
                                        "content": "Content quality",
                                        "grammar": "Grammar usage",
                                        "vocabulary": "Word choice"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Create exam
        exam = ExamAssessment(
            class_id=classroom.id,
            teacher_id=teacher.id,
            exam_type='midterm',
            title='Test Exam - Speaking Auto Grade',
            description='Test exam to verify speaking auto-grading functionality',
            content=exam_content,
            total_points=10.0,
            duration=60,
            ai_parsed=True,
            is_active=True,
            is_published=True
        )
        
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        print(f"\n✅ Created exam: {exam.title} (ID: {exam.id})")
        
        # Create submission with answers
        # Note: Using real audio file from speaking_submissions
        submission = ExamSubmission(
            exam_id=exam.id,
            student_id=student.id,
            answers={
                "1": "C",  # Multiple choice - correct
                "2": "speaking_submissions/student_11_ex_32_20251101_013631.webm",  # Speaking - using real audio file
                "3": "My favorite hobby is reading books. I like it because it helps me learn new things and relax after a long day. Reading opens up new worlds and perspectives."  # Writing
            },
            status="submitted",
            submitted_at=datetime.utcnow()
        )
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        print(f"✅ Created submission: ID {submission.id}")
        print(f"\n📋 Submission answers:")
        for q_id, answer in submission.answers.items():
            print(f"  - Question {q_id}: {answer[:50] if isinstance(answer, str) else answer}...")
        
        # Test auto-grading
        print(f"\n🔄 Testing auto-grade function...")
        from app.routers.exam_assessments import _auto_grade_exam_submission
        
        await _auto_grade_exam_submission(submission, db)
        db.commit()
        db.refresh(submission)
        
        print(f"\n✅ Auto-grade completed!")
        print(f"📊 Results:")
        print(f"  - AI Score: {submission.ai_score}/10")
        print(f"  - Status: {submission.status}")
        
        if submission.rubrics_scores:
            print(f"\n📝 Detailed Results:")
            results = submission.rubrics_scores.get('auto_grade_results', {})
            for q_id, result in results.items():
                print(f"\n  Question {q_id} ({result.get('type', 'unknown')}):")
                print(f"    - Earned: {result.get('earned', 0)}/{result.get('points', 0)} points")
                print(f"    - Status: {result.get('status', 'N/A')}")
                
                if result.get('type') == 'speaking':
                    print(f"    - Pronunciation: {result.get('pronunciation', {})}")
                    print(f"    - Content: {result.get('content', {})}")
                    if result.get('ai_feedback'):
                        print(f"    - Feedback: {result.get('ai_feedback')}")
                    if result.get('error'):
                        print(f"    - ⚠️ Error: {result.get('error')}")
        
        print(f"\n✅ Test completed! Exam ID: {exam.id}, Submission ID: {submission.id}")
        
        return exam.id, submission.id
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Testing Exam Speaking Auto-Grading")
    print("=" * 60)
    
    asyncio.run(create_test_exam_and_submission())
