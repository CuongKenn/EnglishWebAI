"""
Force recreate courses table with correct schema
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "englishwebai.db"

print("=" * 70)
print("FORCE RECREATING COURSES TABLE")
print("=" * 70)
print(f"Database: {DB_PATH}")
print()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get current data
print("Step 1: Backing up current courses data...")
cursor.execute("SELECT * FROM courses")
courses_data = cursor.fetchall()
print(f"  Found {len(courses_data)} courses to backup")

# Get old column names
cursor.execute("PRAGMA table_info(courses)")
old_columns = [col[1] for col in cursor.fetchall()]
print(f"  Old columns: {', '.join(old_columns)}")

# Drop old table
print("\nStep 2: Dropping old courses table...")
cursor.execute("DROP TABLE IF EXISTS courses_backup")
cursor.execute("ALTER TABLE courses RENAME TO courses_backup")
print("  Table renamed to courses_backup")

# Create new table with correct schema
print("\nStep 3: Creating new courses table with thumbnail_url...")
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
print("  New table created successfully!")

# Restore data
print("\nStep 4: Restoring data...")
if courses_data:
    # Map old columns to new
    old_col_idx = {name: idx for idx, name in enumerate(old_columns)}
    
    for row in courses_data:
        # Extract values from old row
        values = {
            'id': row[old_col_idx['id']] if 'id' in old_col_idx else None,
            'title': row[old_col_idx['title']] if 'title' in old_col_idx else 'Untitled',
            'description': row[old_col_idx['description']] if 'description' in old_col_idx else None,
            'grade': row[old_col_idx['grade']] if 'grade' in old_col_idx else 1,
            'skill': row[old_col_idx['skill']] if 'skill' in old_col_idx else 'listening',
            'category': row[old_col_idx['category']] if 'category' in old_col_idx else None,
            'total_cups': row[old_col_idx['total_cups']] if 'total_cups' in old_col_idx else 0,
            'is_premium': row[old_col_idx['is_premium']] if 'is_premium' in old_col_idx else 0,
            'level': row[old_col_idx['level']] if 'level' in old_col_idx else None,
            'is_active': row[old_col_idx['is_active']] if 'is_active' in old_col_idx else 1,
            'thumbnail_url': row[old_col_idx['thumbnail_url']] if 'thumbnail_url' in old_col_idx else None,
            'created_by': row[old_col_idx['created_by']] if 'created_by' in old_col_idx else None,
            'created_at': row[old_col_idx['created_at']] if 'created_at' in old_col_idx else None,
            'updated_at': row[old_col_idx['updated_at']] if 'updated_at' in old_col_idx else None,
        }
        
        cursor.execute("""
            INSERT INTO courses (
                id, title, description, grade, skill, category, 
                total_cups, is_premium, level, is_active, thumbnail_url,
                created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            values['id'], values['title'], values['description'], values['grade'],
            values['skill'], values['category'], values['total_cups'], values['is_premium'],
            values['level'], values['is_active'], values['thumbnail_url'],
            values['created_by'], values['created_at'], values['updated_at']
        ))
    
    print(f"  Restored {len(courses_data)} courses")
else:
    print("  No data to restore")

# Commit changes
conn.commit()

# Verify new schema
print("\nStep 5: Verifying new schema...")
cursor.execute("PRAGMA table_info(courses)")
new_columns = cursor.fetchall()
print("  New columns:")
for col in new_columns:
    print(f"    {col[0]:2d}. {col[1]:20s} - {col[2]}")

# Check if thumbnail_url exists
has_thumbnail = any(col[1] == 'thumbnail_url' for col in new_columns)

conn.close()

print("\n" + "=" * 70)
if has_thumbnail:
    print("[SUCCESS] Table recreated with thumbnail_url column!")
    print("\nNow RESTART your backend:")
    print("  1. Stop backend (Ctrl+C)")
    print("  2. python main.py")
    print("\nThen try creating a course again.")
else:
    print("[ERROR] Failed to add thumbnail_url column")
print("=" * 70)


