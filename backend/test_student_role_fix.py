"""
Test script to verify student role fix in analytics
Run this to check if analytics correctly filters by enrollment.role='student'
"""

from app.core.database import SessionLocal
from app.models.enrollment import Enrollment
from app.models.classroom import Classroom
from app.models.user import User, UserRole
from sqlalchemy import func


def test_enrollment_roles():
    """Check enrollment roles distribution"""
    db = SessionLocal()
    try:
        print("=" * 60)
        print("CHECKING ENROLLMENT ROLES IN DATABASE")
        print("=" * 60)
        
        # Count enrollments by role and status
        results = db.query(
            Enrollment.role,
            Enrollment.status,
            func.count(Enrollment.id).label('count')
        ).group_by(
            Enrollment.role,
            Enrollment.status
        ).all()
        
        print("\n📊 Enrollment Distribution:")
        print("-" * 60)
        print(f"{'Role':<15} {'Status':<15} {'Count':<10}")
        print("-" * 60)
        
        total_students = 0
        active_students = 0
        
        for role, status, count in results:
            print(f"{role:<15} {status:<15} {count:<10}")
            if role == "student":
                total_students += count
                if status == "active":
                    active_students += count
        
        print("-" * 60)
        print(f"\n✅ Total students (all statuses): {total_students}")
        print(f"✅ Active students (should be counted): {active_students}")
        
        # Check classes with enrollments
        print("\n" + "=" * 60)
        print("CHECKING CLASSES AND THEIR STUDENTS")
        print("=" * 60)
        
        classes = db.query(Classroom).all()
        print(f"\nTotal classes: {len(classes)}")
        
        for cls in classes[:5]:  # Show first 5 classes
            total_enrollments = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id
            ).count()
            
            student_enrollments = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id,
                Enrollment.role == "student",
                Enrollment.status == "active"
            ).count()
            
            print(f"\nClass: {cls.name}")
            print(f"  Total enrollments: {total_enrollments}")
            print(f"  Active students: {student_enrollments}")
        
        # Check user roles
        print("\n" + "=" * 60)
        print("CHECKING USER ROLES")
        print("=" * 60)
        
        user_role_counts = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        print("\n📊 User Role Distribution:")
        print("-" * 60)
        print(f"{'Role':<20} {'Count':<10}")
        print("-" * 60)
        
        for role, count in user_role_counts:
            display_role = "student (USER)" if role == UserRole.USER else role.value
            print(f"{display_role:<20} {count:<10}")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE CHECK COMPLETED")
        print("=" * 60)
        
        print("\n📝 Summary:")
        print(f"  - Students in database (users.role='user'): {sum(c for r, c in user_role_counts if r == UserRole.USER)}")
        print(f"  - Active student enrollments: {active_students}")
        print(f"  - These are the numbers that should appear in analytics")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def test_analytics_query_simulation():
    """Simulate the analytics query to see what it returns"""
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("SIMULATING ANALYTICS QUERY")
        print("=" * 60)
        
        # Get a teacher
        teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
        if not teacher:
            print("❌ No teacher found in database")
            return
        
        print(f"\n👨‍🏫 Teacher: {teacher.full_name} (ID: {teacher.id})")
        
        # Get teacher's classes
        classes = db.query(Classroom).filter(Classroom.teacher_id == teacher.id).all()
        print(f"📚 Classes: {len(classes)}")
        
        # Count students BEFORE fix (wrong way)
        total_students_wrong = 0
        for cls in classes:
            enrollments = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id
            ).all()
            total_students_wrong += len(enrollments)
        
        # Count students AFTER fix (correct way)
        total_students_correct = 0
        for cls in classes:
            enrollments = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id,
                Enrollment.role == "student",
                Enrollment.status == "active"
            ).all()
            total_students_correct += len(enrollments)
        
        print("\n" + "=" * 60)
        print("COMPARISON")
        print("=" * 60)
        print(f"❌ BEFORE fix (counting all enrollments): {total_students_wrong}")
        print(f"✅ AFTER fix (counting only active students): {total_students_correct}")
        
        difference = total_students_wrong - total_students_correct
        if difference > 0:
            print(f"\n⚠️  Difference: {difference} enrollments were incorrectly counted")
            print(f"   (These are likely assistants or inactive enrollments)")
        else:
            print(f"\n✅ No difference - all enrollments are active students")
        
        # Show breakdown per class
        print("\n📊 Breakdown per class:")
        print("-" * 60)
        print(f"{'Class':<30} {'All':<10} {'Students':<10} {'Diff':<10}")
        print("-" * 60)
        
        for cls in classes:
            all_enroll = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id
            ).count()
            
            student_enroll = db.query(Enrollment).filter(
                Enrollment.class_id == cls.id,
                Enrollment.role == "student",
                Enrollment.status == "active"
            ).count()
            
            diff = all_enroll - student_enroll
            print(f"{cls.name:<30} {all_enroll:<10} {student_enroll:<10} {diff:<10}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🧪 STUDENT ROLE FIX - VERIFICATION TEST")
    print("=" * 60)
    
    try:
        test_enrollment_roles()
        test_analytics_query_simulation()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED")
        print("=" * 60)
        
        print("\n💡 What to check:")
        print("  1. Are there any enrollments with role='assistant'?")
        print("  2. Are there any inactive enrollments?")
        print("  3. Does the 'Students' column match what you expect?")
        print("\n✅ If analytics now shows the correct student count, the fix works!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

