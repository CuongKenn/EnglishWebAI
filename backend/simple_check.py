"""
Simple database check without unicode
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "englishwebai.db"

print("=" * 70)
print("CHECKING DATABASE")
print("=" * 70)
print(f"Database: {DB_PATH}")
print()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all columns
cursor.execute("PRAGMA table_info(courses)")
columns_info = cursor.fetchall()

print(f"Total columns: {len(columns_info)}")
print()
print("All columns:")
column_names = []
for col in columns_info:
    col_id, name, col_type, not_null, default, pk = col
    column_names.append(name)
    print(f"  {col_id}. {name} - {col_type}")

print()
print("=" * 70)

# Check specifically for thumbnail_url
if "thumbnail_url" in column_names:
    print("[OK] Column 'thumbnail_url' EXISTS")
    print()
    print("Now RESTART your backend:")
    print("  1. Stop backend (Ctrl+C)")
    print("  2. cd C:\\Users\\HNC\\Desktop\\EnglishWebAI\\EnglishWebAI\\backend")
    print("  3. python main.py")
else:
    print("[MISSING] Column 'thumbnail_url' NOT FOUND")
    print()
    print("Adding column now...")
    try:
        cursor.execute("ALTER TABLE courses ADD COLUMN thumbnail_url TEXT")
        conn.commit()
        print("[OK] Column added successfully!")
        print()
        print("Now RESTART your backend:")
        print("  1. Stop backend (Ctrl+C)")
        print("  2. cd C:\\Users\\HNC\\Desktop\\EnglishWebAI\\EnglishWebAI\\backend")
        print("  3. python main.py")
    except Exception as e:
        print(f"[ERROR] Failed to add column: {e}")

conn.close()
print("=" * 70)


