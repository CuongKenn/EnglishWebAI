"""
Force SQLAlchemy to recognize the new column
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import inspect
from app.core.database import engine, SessionLocal
from app.models.course import Course

def check_sqlalchemy_schema():
    """Check what SQLAlchemy sees"""
    print("=" * 70)
    print("SQLALCHEMY SCHEMA CHECK")
    print("=" * 70)
    
    # Get inspector
    inspector = inspect(engine)
    
    # Get columns as SQLAlchemy sees them
    columns = inspector.get_columns('courses')
    
    print(f"\nSQLAlchemy sees {len(columns)} columns in 'courses' table:")
    for col in columns:
        marker = " ✓" if col['name'] == "thumbnail_url" else ""
        print(f"  - {col['name']} ({col['type']}){marker}")
    
    # Check model
    print("\n" + "-" * 70)
    print("Course Model Columns:")
    print("-" * 70)
    from sqlalchemy.orm import class_mapper
    mapper = class_mapper(Course)
    for column in mapper.columns:
        marker = " ✓" if column.name == "thumbnail_url" else ""
        print(f"  - {column.name} ({column.type}){marker}")
    
    # Test query
    print("\n" + "-" * 70)
    print("Testing SELECT query with thumbnail_url:")
    print("-" * 70)
    try:
        db = SessionLocal()
        # Try to query with thumbnail_url
        result = db.query(Course.id, Course.title, Course.thumbnail_url).first()
        if result:
            print(f"✓ Query successful!")
            print(f"  id={result[0]}, title={result[1]}, thumbnail_url={result[2]}")
        else:
            print("✓ Query successful (no courses found)")
        db.close()
    except Exception as e:
        print(f"✗ Query failed: {e}")
        return False
    
    print("\n" + "=" * 70)
    print("SCHEMA CHECK COMPLETE")
    print("=" * 70)
    
    has_thumbnail = any(col['name'] == 'thumbnail_url' for col in columns)
    
    if has_thumbnail:
        print("\n✓ SQLAlchemy CAN see 'thumbnail_url' column")
        print("\nYour backend should work now!")
        print("If you still get errors, make sure to:")
        print("1. RESTART the backend server (Ctrl+C then python main.py)")
        print("2. Clear browser cache and reload the page")
    else:
        print("\n✗ SQLAlchemy CANNOT see 'thumbnail_url' column")
        print("\nThis means you need to:")
        print("1. Make sure the column exists in database (run check_and_restart.py)")
        print("2. Restart the backend server")
    
    return has_thumbnail

if __name__ == "__main__":
    try:
        check_sqlalchemy_schema()
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()


