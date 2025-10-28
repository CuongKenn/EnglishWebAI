#!/usr/bin/env python3
"""
Seed data for testing Parent-Teacher chat feature
Creates: 1 parent, 1 student (child), 1 teacher, 1 class with enrollment
"""

from app.core.database import SessionLocal
from app.models.user import User
from app.models.parent_student import ParentStudent
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.core.security import get_password_hash
from datetime import datetime

def seed_parent_teacher_chat_data():
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_parent = db.query(User).filter(User.email == "parent_test@test.com").first()
        if existing_parent:
            print("✅ Data already exists. Skipping seed.")
            return
        
        # 1. Create Parent
        parent = User(
            email="parent_test@test.com",
            username="parent_test_001",
            full_name="Nguyễn Văn Phụ Huynh",
            hashed_password=get_password_hash("password123"),
            role="parent",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(parent)
        db.flush()
        print(f"✅ Created parent: {parent.email} (ID: {parent.id})")
        
        # 2. Create Student (Child)
        student = User(
            email="student_test@test.com",
            username="student_test_001",
            full_name="Nguyễn Văn Con",
            hashed_password=get_password_hash("password123"),
            role="user",  # student role
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(student)
        db.flush()
        print(f"✅ Created student: {student.email} (ID: {student.id})")
        
        # 3. Create Teacher
        teacher = User(
            email="teacher_test@test.com",
            username="teacher_test_001",
            full_name="Trần Thị Giáo Viên",
            hashed_password=get_password_hash("password123"),
            role="teacher",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(teacher)
        db.flush()
        print(f"✅ Created teacher: {teacher.email} (ID: {teacher.id})")
        
        # 4. Link Parent to Student
        parent_student = ParentStudent(
            parent_id=parent.id,
            student_id=student.id,
            is_verified=True,
            verified_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(parent_student)
        db.flush()
        print(f"✅ Linked parent {parent.id} to student {student.id}")
        
        # 5. Create Class taught by Teacher
        classroom = Classroom(
            name="Lớp Tiếng Anh 10A",
            code="ENG10A",
            teacher_id=teacher.id,
            grade="10",
            max_students=30,
            status="active",
            created_at=datetime.utcnow()
        )
        db.add(classroom)
        db.flush()
        print(f"✅ Created classroom: {classroom.name} (ID: {classroom.id}) taught by teacher {teacher.id}")
        
        # 6. Enroll Student in Class
        enrollment = Enrollment(
            user_id=student.id,
            class_id=classroom.id,
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(enrollment)
        db.flush()
        print(f"✅ Enrolled student {student.id} in classroom {classroom.id}")
        
        # Commit all changes
        db.commit()
        
        print("\n🎉 SEED COMPLETED SUCCESSFULLY!")
        print("\n📝 Test Accounts:")
        print(f"   Parent:  parent_test@test.com / password123")
        print(f"   Student: student_test@test.com / password123")
        print(f"   Teacher: teacher_test@test.com / password123")
        print("\n🔗 Relationships:")
        print(f"   Parent (ID: {parent.id}) → Student (ID: {student.id})")
        print(f"   Student (ID: {student.id}) → Classroom: {classroom.name}")
        print(f"   Classroom: {classroom.name} → Teacher (ID: {teacher.id})")
        print("\n✅ Parent should now see Teacher in chat!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding Parent-Teacher Chat data...\n")
    seed_parent_teacher_chat_data()
