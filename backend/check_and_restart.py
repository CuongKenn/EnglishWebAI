"""
Quick check and force restart helper
"""
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "englishwebai.db"

def check_database():
    """Check if database has thumbnail_url column"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("PRAGMA table_info(courses)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print("=" * 70)
        print("DATABASE CHECK")
        print("=" * 70)
        print(f"Database path: {DB_PATH}")
        print(f"Total columns in 'courses' table: {len(columns)}")
        print("\nAll columns:")
        for i, col in enumerate(columns, 1):
            marker = " ✓" if col == "thumbnail_url" else ""
            print(f"  {i:2d}. {col}{marker}")
        
        if "thumbnail_url" in columns:
            print("\n✓ Column 'thumbnail_url' EXISTS in database")
            print("\n" + "=" * 70)
            print("DATABASE IS READY!")
            print("=" * 70)
            print("\nNOW YOU NEED TO:")
            print("1. STOP your backend server (Ctrl+C in the terminal)")
            print("2. START it again:")
            print("   cd C:\\Users\\HNC\\Desktop\\EnglishWebAI\\EnglishWebAI\\backend")
            print("   python main.py")
            print("\n" + "=" * 70)
            return True
        else:
            print("\n✗ Column 'thumbnail_url' NOT FOUND!")
            print("Running ALTER TABLE now...")
            cursor.execute("ALTER TABLE courses ADD COLUMN thumbnail_url TEXT")
            conn.commit()
            print("✓ Column added!")
            conn.close()
            return check_database()  # Check again
        
        conn.close()
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    check_database()


