"""
Script seed data cho materials và exercises
Tạo dữ liệu mẫu cho học liệu và bài tập
"""

import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.classroom import Classroom
from app.models.material import Material
from app.models.exercise import Exercise
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson


def seed_materials_and_exercises():
    db: Session = SessionLocal()
    
    try:
        print("🌱 Bắt đầu seed data cho materials và exercises...")
        
        # Lấy các lớp học hiện có
        classrooms = db.query(Classroom).filter(Classroom.status == "active").all()
        
        if not classrooms:
            print("⚠️  Không tìm thấy lớp học nào. Vui lòng tạo lớp học trước.")
            return
        
        print(f"📚 Tìm thấy {len(classrooms)} lớp học")
        
        materials_created = 0
        exercises_created = 0
        
        # Seed data cho mỗi lớp
        for classroom in classrooms:
            print(f"\n🏫 Đang xử lý lớp: {classroom.name} (ID: {classroom.id})")
            
            # Tạo materials cho lớp
            materials_data = [
                {
                    "title": f"Giáo trình {classroom.name} - Phần 1",
                    "type": "file",
                    "description": f"Tài liệu học tập chính thức cho {classroom.name}. Bao gồm lý thuyết và bài tập thực hành.",
                    "url": None,
                    "file_path": f"/media/materials/textbook_{classroom.id}_part1.pdf"
                },
                {
                    "title": f"Bài giảng Video - Chủ đề 1",
                    "type": "link",
                    "description": f"Video bài giảng chi tiết về các chủ đề quan trọng trong {classroom.name}.",
                    "url": "https://www.youtube.com/watch?v=example1",
                    "file_path": None
                },
                {
                    "title": f"Từ vựng {classroom.name}",
                    "type": "file",
                    "description": "Danh sách từ vựng quan trọng cần ghi nhớ kèm theo ví dụ và bài tập.",
                    "url": None,
                    "file_path": f"/media/materials/vocabulary_{classroom.id}.pdf"
                },
                {
                    "title": f"Ngữ pháp cơ bản",
                    "type": "text",
                    "description": "Tổng hợp các cấu trúc ngữ pháp cơ bản với giải thích chi tiết và bài tập.",
                    "url": "https://grammar.example.com",
                    "file_path": None
                },
                {
                    "title": f"Bài tập thực hành {classroom.name}",
                    "type": "file",
                    "description": "Bộ bài tập thực hành đa dạng giúp củng cố kiến thức đã học.",
                    "url": None,
                    "file_path": f"/media/materials/exercises_{classroom.id}.pdf"
                },
            ]
            
            for mat_data in materials_data:
                material = Material(
                    class_id=classroom.id,
                    lesson_id=None,
                    **mat_data
                )
                db.add(material)
                materials_created += 1
            
            # Tạo exercises cho lớp
            exercises_data = [
                {
                    "title": f"Bài tập tuần 1 - {classroom.name}",
                    "description": "Ôn tập kiến thức tuần 1: từ vựng và ngữ pháp cơ bản. Hoàn thành các bài tập và nộp file PDF hoặc hình ảnh.",
                    "type": "assignment",
                    "max_score": 100,
                    "due_at": datetime.now() + timedelta(days=7)
                },
                {
                    "title": f"Kiểm tra giữa kỳ - {classroom.name}",
                    "description": "Bài kiểm tra đánh giá kiến thức tổng hợp các chủ đề đã học. Thời gian làm bài: 45 phút.",
                    "type": "quiz",
                    "max_score": 100,
                    "due_at": datetime.now() + timedelta(days=14)
                },
                {
                    "title": f"Thuyết trình nhóm - {classroom.name}",
                    "description": "Làm việc theo nhóm 3-4 người, chuẩn bị bài thuyết trình về chủ đề được giao. Nộp file slide và video thuyết trình.",
                    "type": "assignment",
                    "max_score": 100,
                    "due_at": datetime.now() + timedelta(days=21)
                },
                {
                    "title": f"Bài tập nghe - {classroom.name}",
                    "description": "Luyện tập kỹ năng nghe hiểu qua các đoạn hội thoại và bài giảng. Trả lời các câu hỏi liên quan.",
                    "type": "assignment",
                    "max_score": 50,
                    "due_at": datetime.now() + timedelta(days=10)
                },
                {
                    "title": f"Kiểm tra cuối kỳ - {classroom.name}",
                    "description": "Bài kiểm tra tổng hợp toàn bộ kiến thức học kỳ. Thời gian làm bài: 90 phút. Mang theo giấy nháp và bút.",
                    "type": "quiz",
                    "max_score": 100,
                    "due_at": datetime.now() + timedelta(days=60)
                },
            ]
            
            for ex_data in exercises_data:
                exercise = Exercise(
                    class_id=classroom.id,
                    lesson_id=None,
                    **ex_data
                )
                db.add(exercise)
                exercises_created += 1
            
            print(f"  ✅ Đã tạo 5 materials và 5 exercises cho lớp {classroom.name}")
        
        # Commit tất cả
        db.commit()
        
        print(f"\n✅ Hoàn thành seed data!")
        print(f"📊 Tổng kết:")
        print(f"   - Materials: {materials_created}")
        print(f"   - Exercises: {exercises_created}")
        print(f"   - Lớp học: {len(classrooms)}")
        
        # Kiểm tra enrollment để đảm bảo students có thể xem
        total_students = db.query(Enrollment).filter(
            Enrollment.role == "student",
            Enrollment.status == "active"
        ).count()
        print(f"   - Học sinh đã enroll: {total_students}")
        
        if total_students == 0:
            print("\n⚠️  Lưu ý: Chưa có học sinh nào enroll vào lớp.")
            print("   Hãy enroll học sinh vào lớp để họ có thể xem materials và exercises.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Lỗi khi seed data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def create_sample_lessons_and_materials():
    """Tạo lessons và materials gắn với lessons"""
    db: Session = SessionLocal()
    
    try:
        print("\n🌱 Tạo lessons và materials cho lessons...")
        
        classrooms = db.query(Classroom).filter(Classroom.status == "active").limit(3).all()
        
        if not classrooms:
            print("⚠️  Không tìm thấy lớp học")
            return
        
        lessons_created = 0
        materials_created = 0
        
        for classroom in classrooms:
            # Tạo 3 lessons cho mỗi lớp
            for i in range(1, 4):
                lesson = Lesson(
                    class_id=classroom.id,
                    title=f"Bài {i}: Chủ đề {i} - {classroom.name}",
                    content=f"Nội dung chi tiết của bài học {i}. Học sinh sẽ tìm hiểu về các khái niệm cơ bản và nâng cao.",
                    order_index=i
                )
                db.add(lesson)
                db.flush()  # Get lesson.id
                lessons_created += 1
                
                # Tạo 2 materials cho mỗi lesson
                for j in range(1, 3):
                    material = Material(
                        class_id=classroom.id,
                        lesson_id=lesson.id,
                        title=f"Tài liệu bài {i}.{j} - {classroom.name}",
                        type="file" if j == 1 else "link",
                        description=f"Tài liệu hỗ trợ cho bài học {i}",
                        url=f"https://example.com/lesson{i}_{j}" if j == 2 else None,
                        file_path=f"/media/materials/lesson_{lesson.id}_{j}.pdf" if j == 1 else None
                    )
                    db.add(material)
                    materials_created += 1
            
            print(f"  ✅ Đã tạo 3 lessons và 6 materials cho {classroom.name}")
        
        db.commit()
        print(f"\n✅ Hoàn thành!")
        print(f"   - Lessons: {lessons_created}")
        print(f"   - Materials: {materials_created}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("SEED DATA - MATERIALS & EXERCISES")
    print("=" * 60)
    
    # Seed materials và exercises
    seed_materials_and_exercises()
    
    # Tạo lessons và materials cho lessons
    create_sample_lessons_and_materials()
    
    print("\n" + "=" * 60)
    print("✨ Hoàn tất!")
    print("=" * 60)
