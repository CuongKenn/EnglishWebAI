"""
Seed sample courses, units, and questions for testing
Run: python seed_courses.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.course import Course, CourseUnit, CourseQuestion
from app.models.user import User, UserRole
import json


def seed_courses():
    db = SessionLocal()
    
    try:
        # Get or create a teacher user
        teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
        if not teacher:
            print("No teacher found. Please create a teacher user first.")
            return
        
        print(f"Using teacher: {teacher.username} (ID: {teacher.id})")
        
        # Sample courses data
        courses_data = [
            {
                "title": "Listening Lớp 1 - Cơ Bản",
                "description": "Khóa học nghe tiếng Anh cho học sinh lớp 1, phát triển kỹ năng nghe hiểu cơ bản",
                "grade": 1,
                "skill": "listening",
                "level": "Beginner",
                "units": [
                    {
                        "title": "Unit 1: Greetings and Introductions",
                        "description": "Học cách chào hỏi và giới thiệu bản thân",
                        "week_index": 1,
                        "max_cups": 2,
                        "questions": [
                            {
                                "type": "mcq-audio",
                                "prompt": "Listen and choose: What is the greeting?",
                                "options": ["Hello", "Goodbye", "Thank you", "Sorry"],
                                "answer": {"correct": 0},
                                "points": 1
                            },
                            {
                                "type": "mcq-audio",
                                "prompt": "Listen and choose: What's the name?",
                                "options": ["John", "Mary", "Tom", "Anna"],
                                "answer": {"correct": 1},
                                "points": 1
                            }
                        ]
                    },
                    {
                        "title": "Unit 2: Colors and Numbers",
                        "description": "Học về màu sắc và số đếm",
                        "week_index": 2,
                        "max_cups": 2,
                        "questions": [
                            {
                                "type": "mcq-audio",
                                "prompt": "Listen and choose the color you hear",
                                "options": ["Red", "Blue", "Green", "Yellow"],
                                "answer": {"correct": 2},
                                "points": 1
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Speaking Lớp 1 - Cơ Bản",
                "description": "Khóa học nói tiếng Anh cho học sinh lớp 1, luyện phát âm cơ bản",
                "grade": 1,
                "skill": "speaking",
                "level": "Beginner",
                "units": [
                    {
                        "title": "Unit 1: Say Hello",
                        "description": "Thực hành chào hỏi",
                        "week_index": 1,
                        "max_cups": 2,
                        "questions": [
                            {
                                "type": "prompt",
                                "prompt": "Say: Hello, my name is...",
                                "points": 2
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Reading Lớp 1 - Cơ Bản",
                "description": "Khóa học đọc tiếng Anh cho học sinh lớp 1",
                "grade": 1,
                "skill": "reading",
                "level": "Beginner",
                "units": [
                    {
                        "title": "Unit 1: The Cat",
                        "description": "Đọc về con mèo",
                        "week_index": 1,
                        "max_cups": 2,
                        "questions": [
                            {
                                "type": "mcq",
                                "prompt": "Read: 'The cat is big.' What is the cat?",
                                "options": ["Small", "Big", "Happy", "Sad"],
                                "answer": {"correct": 1},
                                "points": 1
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Writing Lớp 1 - Cơ Bản",
                "description": "Khóa học viết tiếng Anh cho học sinh lớp 1",
                "grade": 1,
                "skill": "writing",
                "level": "Beginner",
                "units": [
                    {
                        "title": "Unit 1: Write ABC",
                        "description": "Viết chữ cái",
                        "week_index": 1,
                        "max_cups": 2,
                        "questions": [
                            {
                                "type": "essay",
                                "prompt": "Write the letters A, B, C",
                                "points": 3
                            }
                        ]
                    }
                ]
            }
        ]
        
        # Create courses
        for course_data in courses_data:
            # Check if course already exists
            existing = db.query(Course).filter(
                Course.title == course_data["title"],
                Course.grade == course_data["grade"]
            ).first()
            
            if existing:
                print(f"Course '{course_data['title']}' already exists. Skipping...")
                continue
            
            course = Course(
                title=course_data["title"],
                description=course_data["description"],
                grade=course_data["grade"],
                skill=course_data["skill"],
                category=course_data["skill"],  # Back-compat
                level=course_data["level"],
                is_active=True,
                created_by=teacher.id,
                total_cups=0,  # Will be calculated from units
                is_premium=False
            )
            db.add(course)
            db.flush()  # Get course ID
            
            print(f"Created course: {course.title} (ID: {course.id})")
            
            # Create units and questions
            for unit_data in course_data.get("units", []):
                unit = CourseUnit(
                    course_id=course.id,
                    title=unit_data["title"],
                    description=unit_data.get("description"),
                    week_index=unit_data.get("week_index", 1),
                    max_cups=unit_data.get("max_cups", 2),
                    unit_type="lesson"
                )
                db.add(unit)
                db.flush()  # Get unit ID
                
                print(f"  Created unit: {unit.title} (ID: {unit.id})")
                
                # Create questions
                for q_data in unit_data.get("questions", []):
                    question = CourseQuestion(
                        unit_id=unit.id,
                        type=q_data["type"],
                        prompt=q_data["prompt"],
                        options_json=json.dumps(q_data.get("options", []), ensure_ascii=False),
                        answer_json=json.dumps(q_data.get("answer", {}), ensure_ascii=False),
                        points=q_data.get("points", 1)
                    )
                    db.add(question)
                
                print(f"    Created {len(unit_data.get('questions', []))} questions")
        
        db.commit()
        print("\n✅ Sample courses seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding courses: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding sample courses...")
    seed_courses()


