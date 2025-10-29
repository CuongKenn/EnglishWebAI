"""
Verify and fix database schema for courses table
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "englishwebai.db"

def verify_and_fix():
    """Verify and fix courses table schema"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("VERIFYING DATABASE SCHEMA")
        print("=" * 60)
        
        # Check current schema
        cursor.execute("PRAGMA table_info(courses)")
        columns = cursor.fetchall()
        
        print("\nCurrent columns in 'courses' table:")
        column_names = []
        for col in columns:
            column_names.append(col[1])
            print(f"  - {col[1]} ({col[2]})")
        
        # Check if thumbnail_url exists
        if 'thumbnail_url' in column_names:
            print("\n[OK] Column 'thumbnail_url' EXISTS")
        else:
            print("\n[ADDING] Column 'thumbnail_url' does NOT exist, adding now...")
            cursor.execute("ALTER TABLE courses ADD COLUMN thumbnail_url TEXT")
            conn.commit()
            print("[OK] Column added successfully!")
        
        # Verify again
        cursor.execute("PRAGMA table_info(courses)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print("\n" + "=" * 60)
        print("FINAL SCHEMA VERIFICATION")
        print("=" * 60)
        print("All columns in 'courses' table:")
        for col in columns:
            print(f"  {col[0]}. {col[1]} - {col[2]} - NOT NULL={col[3]} - DEFAULT={col[4]}")
        
        # Test INSERT with thumbnail_url
        print("\n" + "=" * 60)
        print("TESTING INSERT WITH thumbnail_url")
        print("=" * 60)
        
        try:
            # Try a test insert (will rollback)
            test_sql = """
            INSERT INTO courses 
            (title, description, grade, skill, category, total_cups, is_premium, level, is_active, thumbnail_url, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """
            cursor.execute(test_sql, (
                'TEST COURSE',
                'Test description',
                10,
                'listening',
                'listening',
                0,
                0,
                'Beginner',
                1,
                '/test/thumbnail.jpg',
                1
            ))
            # Don't commit - just test
            conn.rollback()
            print("[OK] INSERT test PASSED - thumbnail_url column is working!")
            
        except Exception as e:
            print(f"[ERROR] INSERT test FAILED: {e}")
            conn.rollback()
        
        conn.close()
        
        print("\n" + "=" * 60)
        print("DONE! Please restart your backend server now.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_and_fix()


