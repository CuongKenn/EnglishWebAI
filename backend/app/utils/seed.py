"""
Seed data for development and testing
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

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

def seed_all(force: bool = False):
    """Run all seed functions"""
    print("🌱 Starting database seeding...")
    db = SessionLocal()
    try:
        seed_users(db, force=force)
        print("\n✅ Database seeding completed!")
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
