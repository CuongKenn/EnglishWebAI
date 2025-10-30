#!/usr/bin/env python3
"""
Fix exercises table - add missing columns
"""
from app.core.database import engine
from sqlalchemy import text, inspect

def main():
    print("Checking exercises table...")
    
    # Check current columns
    insp = inspect(engine)
    current_cols = [c['name'] for c in insp.get_columns('exercises')]
    print(f"Current columns: {current_cols}")
    
    # Columns that should exist
    required_cols = {
        'skill_type': 'TEXT',
        'duration': 'INTEGER',
        'enable_ai_grading': 'INTEGER DEFAULT 0',
        'rubrics': 'TEXT',
        'content': 'TEXT'
    }
    
    # Add missing columns
    with engine.connect() as conn:
        for col_name, col_type in required_cols.items():
            if col_name not in current_cols:
                try:
                    sql = f"ALTER TABLE exercises ADD COLUMN {col_name} {col_type}"
                    print(f"Executing: {sql}")
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✅ Added column: {col_name}")
                except Exception as e:
                    print(f"⚠️  Column {col_name} might already exist or error: {e}")
            else:
                print(f"✓ Column {col_name} already exists")
    
    # Verify
    insp = inspect(engine)
    final_cols = [c['name'] for c in insp.get_columns('exercises')]
    print(f"\nFinal columns: {final_cols}")
    print("\n✅ Exercises table updated successfully!")

if __name__ == "__main__":
    main()
