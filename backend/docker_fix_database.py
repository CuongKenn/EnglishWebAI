"""
SCRIPT ĐỂ CHẠY TRONG DOCKER - FIX DATABASE
Chạy: docker exec -it englishwebai_backend python docker_fix_database.py
"""
import sqlite3
from pathlib import Path
import sys

# Database path trong Docker
DB_PATH = Path("/app/data/englishwebai.db")

def main():
    print("=" * 70)
    print("FIX DATABASE IN DOCKER CONTAINER")
    print("=" * 70)
    print(f"\nDatabase path: {DB_PATH}")
    
    if not DB_PATH.exists():
        print(f"\n[ERROR] Database not found at {DB_PATH}")
        print("Creating new database...")
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if courses table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='courses'")
        if not cursor.fetchone():
            print("\n[ERROR] Table 'courses' does not exist!")
            print("Run migrations first: alembic upgrade head")
            sys.exit(1)
        
        # Get current columns
        cursor.execute("PRAGMA table_info(courses)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print(f"\nCurrent columns ({len(columns)} total):")
        for i, col in enumerate(columns, 1):
            marker = " ✓" if col == "thumbnail_url" else ""
            print(f"  {i:2d}. {col}{marker}")
        
        # Check if thumbnail_url exists
        if "thumbnail_url" in columns:
            print("\n[OK] Column 'thumbnail_url' already exists!")
            print("No action needed.")
        else:
            print("\n[ADDING] Column 'thumbnail_url'...")
            
            # Backup table
            print("Step 1: Creating backup...")
            cursor.execute("DROP TABLE IF EXISTS courses_backup_old")
            cursor.execute("ALTER TABLE courses RENAME TO courses_backup_old")
            
            # Create new table with thumbnail_url
            print("Step 2: Creating new table with thumbnail_url...")
            cursor.execute("""
                CREATE TABLE courses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    grade INTEGER NOT NULL,
                    skill VARCHAR NOT NULL,
                    category VARCHAR,
                    total_cups INTEGER NOT NULL DEFAULT 0,
                    is_premium BOOLEAN NOT NULL DEFAULT 0,
                    level VARCHAR,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    thumbnail_url TEXT,
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            
            # Copy data
            print("Step 3: Copying data...")
            cursor.execute("""
                INSERT INTO courses (
                    id, title, description, grade, skill, category,
                    total_cups, is_premium, level, is_active,
                    created_by, created_at, updated_at
                )
                SELECT 
                    id, title, description, grade, skill, category,
                    total_cups, is_premium, level, is_active,
                    created_by, created_at, updated_at
                FROM courses_backup_old
            """)
            
            rows_copied = cursor.rowcount
            print(f"Copied {rows_copied} rows")
            
            conn.commit()
            print("\n[SUCCESS] Column added successfully!")
        
        # Final verification
        cursor.execute("PRAGMA table_info(courses)")
        final_columns = [row[1] for row in cursor.fetchall()]
        
        print("\n" + "=" * 70)
        print("FINAL VERIFICATION")
        print("=" * 70)
        print(f"Total columns: {len(final_columns)}")
        
        if "thumbnail_url" in final_columns:
            print("\n✓ Column 'thumbnail_url' EXISTS")
            print("\n[SUCCESS] Database is ready!")
            print("\nNext steps:")
            print("1. Exit this container (type 'exit')")
            print("2. Restart container: docker restart englishwebai_backend")
            print("3. Test creating course with thumbnail")
        else:
            print("\n✗ Column 'thumbnail_url' MISSING")
            print("[ERROR] Fix failed!")
        
        conn.close()
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("=" * 70)

if __name__ == "__main__":
    main()


