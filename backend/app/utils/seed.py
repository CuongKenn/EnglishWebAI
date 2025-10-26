"""
Seed data for development and testing
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.discussion import DiscussionThread, DiscussionPost
from app.models.classroom import Classroom
from app.core.security import get_password_hash
from app.models.course import Course, CourseExercise, CourseUnit, CourseQuestion
from datetime import datetime, timedelta

def seed_users(db: Session, force: bool = False):
    """Seed users with different roles"""
    
    # Check if users already exist
    existing_user = db.query(User).first()
    if existing_user and not force:
        print("⚠️  Database already has users. Use --force to reset and seed.")
        return
    
    # If force, delete all existing users
    if force:
        db.query(User).delete()
        db.commit()
        print("🗑️  Cleared existing users.")
    
    users_data = [
        {
            "username": "admin",
            "email": "admin@englishwebai.com",
            "full_name": "System Administrator",
            "hashed_password": get_password_hash("Admin123!"),
            "role": UserRole.ADMIN,
            "phone": "0901234567",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "superadmin",
            "email": "superadmin@englishwebai.com",
            "full_name": "Super Administrator",
            "hashed_password": get_password_hash("Super123!"),
            "role": UserRole.SUPERADMIN,
            "phone": "0901234568",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "teacher_a",
            "email": "teacher_a@example.com",
            "full_name": "Nguyễn Văn A",
            "hashed_password": get_password_hash("Teacher123!"),
            "role": UserRole.TEACHER,
            "phone": "0901000001",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "teacher_b",
            "email": "teacher_b@example.com",
            "full_name": "Trần Thị B",
            "hashed_password": get_password_hash("Teacher123!"),
            "role": UserRole.TEACHER,
            "phone": "0901000002",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "student1",
            "email": "student1@example.com",
            "full_name": "Nguyen Van A",
            "hashed_password": get_password_hash("User123!"),
            "role": UserRole.USER,
            "phone": "0901234569",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "student2",
            "email": "student2@example.com",
            "full_name": "Tran Thi B",
            "hashed_password": get_password_hash("User123!"),
            "role": UserRole.USER,
            "phone": "0901234570",
            "is_active": True,
            "is_verified": False
        },
        {
            "username": "parent1",
            "email": "parent1@example.com",
            "full_name": "Le Van C",
            "hashed_password": get_password_hash("Parent123!"),
            "role": UserRole.PARENT,
            "phone": "0901234571",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "parent2",
            "email": "parent2@example.com",
            "full_name": "Pham Thi D",
            "hashed_password": get_password_hash("Parent123!"),
            "role": UserRole.PARENT,
            "phone": "0901234572",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "teacher1",
            "email": "teacher1@example.com",
            "full_name": "Hoang Van E",
            "hashed_password": get_password_hash("Teacher123!"),
            "role": UserRole.TEACHER,
            "phone": "0901234573",
            "is_active": True,
            "is_verified": True
        },
        {
            "username": "teacher2",
            "email": "teacher2@example.com",
            "full_name": "Nguyen Thi F",
            "hashed_password": get_password_hash("Teacher123!"),
            "role": UserRole.TEACHER,
            "phone": "0901234574",
            "is_active": True,
            "is_verified": True
        }
    ]
    
    created_users = []
    for user_data in users_data:
        user = User(**user_data)
        db.add(user)
        created_users.append(user)
    
    try:
        db.commit()
        print(f"✅ Successfully seeded {len(created_users)} users:")
        for user in created_users:
            print(f"   - {user.username} ({user.role.value}) - {user.email}")
        print("\n📝 Default passwords:")
        print("   - admin/superadmin: Admin123! / Super123!")
        print("   - students (user role): User123!")
        print("   - parents: Parent123!")
        print("   - teachers: Teacher123!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding users: {str(e)}")
        raise

def seed_discussions(db: Session, force: bool = False):
    """Seed discussion threads and posts"""
    
    # Check if discussions already exist
    existing_discussion = db.query(DiscussionThread).first()
    if existing_discussion and not force:
        print("⚠️  Database already has discussions. Use --force to reset and seed.")
        return
    
    # If force, delete all existing discussions
    if force:
        db.query(DiscussionPost).delete()
        db.query(DiscussionThread).delete()
        db.commit()
        print("🗑️  Cleared existing discussions.")
    
    # Get users for assigning as authors
    students = db.query(User).filter(User.role == UserRole.USER).all()
    teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
    
    if not students or not teachers:
        print("⚠️  Need users to seed discussions. Run seed_users first.")
        return
    
    # Get a classroom if exists
    classroom = db.query(Classroom).first()
    class_id = classroom.id if classroom else None
    
    discussions_data = [
        {
            "title": "Cách phân biệt Present Simple và Present Continuous?",
            "created_by": students[0].id if len(students) > 0 else 1,
            "class_id": class_id,
            "posts": [
                {
                    "content": "Em đang bị nhầm lẫn giữa 2 thì này. Thầy cô giải thích giúp em với ạ!",
                    "created_by": students[0].id if len(students) > 0 else 1
                },
                {
                    "content": "Present Simple dùng cho sự thật, thói quen. Present Continuous dùng cho hành động đang xảy ra.",
                    "created_by": teachers[0].id if len(teachers) > 0 else 2
                }
            ]
        },
        {
            "title": "Khi nào dùng 'a' và 'an'?",
            "created_by": students[1].id if len(students) > 1 else 1,
            "class_id": class_id,
            "posts": [
                {
                    "content": "Em hay nhầm giữa 'a' và 'an'. Có quy tắc nào dễ nhớ không ạ?",
                    "created_by": students[1].id if len(students) > 1 else 1
                },
                {
                    "content": "Dùng 'an' trước nguyên âm (a, e, i, o, u), dùng 'a' trước phụ âm. Ví dụ: an apple, a book.",
                    "created_by": teachers[0].id if len(teachers) > 0 else 2
                }
            ]
        },
        {
            "title": "Phương pháp học từ vựng hiệu quả",
            "created_by": students[0].id if len(students) > 0 else 1,
            "class_id": class_id,
            "posts": [
                {
                    "content": "Mọi người có phương pháp nào học từ vựng nhanh không? Chia sẻ với em với!",
                    "created_by": students[0].id if len(students) > 0 else 1
                }
            ]
        },
        {
            "title": "Cấu trúc câu bị động trong tiếng Anh",
            "created_by": students[1].id if len(students) > 1 else 1,
            "class_id": class_id,
            "posts": [
                {
                    "content": "Em đang học về câu bị động nhưng còn nhiều chỗ chưa hiểu. Nhờ thầy cô giảng lại ạ!",
                    "created_by": students[1].id if len(students) > 1 else 1
                },
                {
                    "content": "Câu bị động: S + be + V3/ed + (by O). Ví dụ: The book is read by me.",
                    "created_by": teachers[1].id if len(teachers) > 1 else 2
                }
            ]
        },
        {
            "title": "Làm thế nào để cải thiện kỹ năng nghe?",
            "created_by": students[0].id if len(students) > 0 else 1,
            "class_id": class_id,
            "posts": [
                {
                    "content": "Em nghe tiếng Anh rất kém. Mọi người có tips gì không ạ?",
                    "created_by": students[0].id if len(students) > 0 else 1
                },
                {
                    "content": "Hãy nghe nhiều podcast, xem phim có phụ đề, và luyện tập hàng ngày nhé!",
                    "created_by": teachers[0].id if len(teachers) > 0 else 2
                }
            ]
        }
    ]
    
    created_threads = []
    try:
        for disc_data in discussions_data:
            # Create thread
            thread = DiscussionThread(
                title=disc_data["title"],
                created_by=disc_data["created_by"],
                class_id=disc_data["class_id"],
                created_at=datetime.utcnow() - timedelta(days=len(created_threads))
            )
            db.add(thread)
            db.flush()  # Get thread.id
            
            # Create posts
            for i, post_data in enumerate(disc_data.get("posts", [])):
                post = DiscussionPost(
                    thread_id=thread.id,
                    content=post_data["content"],
                    author_id=post_data["created_by"],
                    created_at=datetime.utcnow() - timedelta(days=len(created_threads), hours=i)
                )
                db.add(post)
            
            created_threads.append(thread)
        
        db.commit()
        print(f"✅ Successfully seeded {len(created_threads)} discussion threads with posts")
        for thread in created_threads:
            post_count = db.query(DiscussionPost).filter(DiscussionPost.thread_id == thread.id).count()
            print(f"   - '{thread.title}' ({post_count} posts)")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding discussions: {str(e)}")
        raise

def seed_all(force: bool = False):
    """Run all seed functions"""
    print("🌱 Starting database seeding...")
    db = SessionLocal()
    try:
        seed_users(db, force=force)
        # Seed public course catalog if empty
        try:
            seed_courses(db)
            seed_course_units_questions(db)
        except Exception as e:
            print(f"⚠️  Seed courses failed: {e}")
        seed_discussions(db, force=force)
        print("\n✅ Database seeding completed!")
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
    finally:
        db.close()


def seed_courses(db: Session) -> None:
    """Create a minimal public catalog: 4 skills x 12 grades with sample exercises, if none exists."""
    existing = db.query(Course).count()
    if existing > 0:
        print(f"📚 Courses already exist: {existing}. Skipping seed.")
        return

    print("📚 Seeding public course catalog (4 skills x 12 grades)...")
    skills = ["listening", "speaking", "reading", "writing"]
    # Pick any teacher as creator if available
    teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
    creator_id = teacher.id if teacher else None

    created = 0
    ex_created = 0
    for grade in range(1, 13):
        for skill in skills:
            title = f"{skill.capitalize()} Lớp {grade}"
            level = (
                "Beginner" if grade <= 3 else
                "Elementary" if grade <= 5 else
                "Intermediate" if grade <= 8 else
                "Upper-Intermediate" if grade <= 10 else
                "Advanced"
            )
            c = Course(
                title=title,
                description=f"Khóa {skill} cho Lớp {grade}",
                grade=grade,
                skill=skill,
                category=skill,
                level=level,
                is_active=True,
                created_by=creator_id,
            )
            db.add(c)
            db.flush()
            created += 1

            # Sample 3 exercises per course
            for idx in range(1, 4):
                e = CourseExercise(
                    course_id=c.id,
                    title=f"Bài {idx}",
                    description=f"Bài luyện tập {skill} số {idx}",
                    type="assignment",
                    max_score=100,
                    order_index=idx,
                )
                db.add(e)
                ex_created += 1
    db.commit()
    print(f"✅ Seeded {created} courses with {ex_created} exercises")


def seed_course_units_questions(db: Session) -> None:
    """For each course, create 3 units and 5 questions per unit if none exist.

    Questions are tailored to skill:
    - reading: MCQ 4 options
    - listening: MCQ 4 options + media_url
    - speaking: prompt only
    - writing: essay prompt
    """
    courses = db.query(Course).all()
    if not courses:
        return

    total_units = 0
    total_questions = 0
    for c in courses:
        exists = db.query(CourseUnit).filter(CourseUnit.course_id == c.id).count()
        if exists:
            continue
        # Create 3 units per course
        for uidx in range(1, 4):
            unit = CourseUnit(
                course_id=c.id,
                title=f"Bài {uidx}: {c.skill.capitalize()} Unit {uidx}",
                description=f"{c.title} - Bài {uidx}",
                week_index=1 if uidx <= 2 else 2,
                order_index=uidx,
            )
            db.add(unit)
            db.flush()
            total_units += 1

            # 5 questions per unit
            for qidx in range(1, 6):
                if c.skill == "reading":
                    options = [f"Đáp án {i}" for i in range(1, 5)]
                    ans = {"correct": (qidx - 1) % 4}
                    q = CourseQuestion(
                        unit_id=unit.id,
                        type="mcq",
                        prompt=f"Câu {qidx}: Chọn đáp án đúng cho đoạn văn.",
                        options_json=json_dumps(options),
                        answer_json=json_dumps(ans),
                        points=1,
                        order_index=qidx,
                    )
                elif c.skill == "listening":
                    options = [f"Lựa chọn {i}" for i in range(1, 4+1)]
                    ans = {"correct": (qidx - 1) % 4}
                    q = CourseQuestion(
                        unit_id=unit.id,
                        type="mcq-audio",
                        prompt=f"Nghe đoạn audio và chọn đáp án: Câu {qidx}",
                        options_json=json_dumps(options),
                        answer_json=json_dumps(ans),
                        media_url="https://example.com/sample-audio.mp3",
                        points=1,
                        order_index=qidx,
                    )
                elif c.skill == "speaking":
                    q = CourseQuestion(
                        unit_id=unit.id,
                        type="prompt",
                        prompt=f"Nói về chủ đề: Unit {uidx} - Question {qidx}",
                        points=2,
                        order_index=qidx,
                    )
                else:  # writing
                    q = CourseQuestion(
                        unit_id=unit.id,
                        type="essay",
                        prompt=f"Viết đoạn văn 80-120 từ về chủ đề Unit {uidx} - Câu {qidx}",
                        points=3,
                        order_index=qidx,
                    )
                db.add(q)
                total_questions += 1
    db.commit()
    print(f"✅ Seeded {total_units} units and {total_questions} questions for {len(courses)} courses")


def json_dumps(obj):
    import json
    return json.dumps(obj, ensure_ascii=False)

if __name__ == "__main__":
    seed_all()
