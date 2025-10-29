"""
Simple script to add thumbnail_url column to courses table
"""
import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "data" / "englishwebai.db"

def add_thumbnail_column():
    """Add thumbnail_url column to courses table if it doesn't exist"""
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(courses)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'thumbnail_url' in columns:
            print("[OK] Column 'thumbnail_url' already exists in courses table")
        else:
            # Add the column
            print("Adding 'thumbnail_url' column to courses table...")
            cursor.execute("ALTER TABLE courses ADD COLUMN thumbnail_url TEXT")
            conn.commit()
            print("[OK] Column 'thumbnail_url' added successfully!")
        
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("Adding thumbnail_url column to courses table")
    print("=" * 50)
    success = add_thumbnail_column()
    if success:
        print("\n[OK] Done! You can now upload thumbnails for courses.")
    else:
        print("\n[ERROR] Failed. Please check the error above.")

