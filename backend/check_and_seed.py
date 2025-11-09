"""
Script to check database and seed users if needed
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.utils.seed import seed_users


def main():
    db = SessionLocal()
    try:
        # Check if users exist
        user_count = db.query(User).count()
        print(f"Current user count: {user_count}")

        if user_count == 0:
            print("No users found. Seeding database...")
            seed_users(db, force=True)
            print("✅ Database seeded successfully!")

            # Show created users
            users = db.query(User).all()
            print("\n📋 Created users:")
            for user in users:
                print(f"  - {user.username} ({user.role.value}) - Password: Check seed.py")
        else:
            print("✅ Users already exist:")
            users = db.query(User).limit(5).all()
            for user in users:
                print(f"  - {user.username} ({user.role.value})")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()

