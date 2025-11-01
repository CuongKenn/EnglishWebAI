"""
Script to add missing columns to exercise_submissions table
"""
from sqlalchemy import create_engine, text
from app.core.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

columns_to_add = [
    ("grading_status", "VARCHAR(50) NOT NULL DEFAULT 'pending'"),
    ("teacher_reviewed", "BOOLEAN NOT NULL DEFAULT FALSE"),
    ("queue_position", "INTEGER"),
    ("grading_attempts", "INTEGER NOT NULL DEFAULT 0"),
    ("last_grading_error", "TEXT"),
    ("teacher_modified_score", "FLOAT"),
]

with engine.begin() as conn:
    for col_name, col_type in columns_to_add:
        try:
            sql = f"ALTER TABLE exercise_submissions ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
            conn.execute(text(sql))
            print(f"✅ Added column: {col_name}")
        except Exception as e:
            print(f"❌ Error adding {col_name}: {e}")

    # Add indexes
    indexes = [
        "CREATE INDEX IF NOT EXISTS ix_exercise_submissions_grading_status ON exercise_submissions(grading_status)",
        "CREATE INDEX IF NOT EXISTS ix_exercise_submissions_teacher_reviewed ON exercise_submissions(teacher_reviewed)",
        "CREATE INDEX IF NOT EXISTS ix_exercise_submissions_queue_position ON exercise_submissions(queue_position)",
        "CREATE INDEX IF NOT EXISTS idx_submission_queue_status ON exercise_submissions(grading_status, queue_position)",
        "CREATE INDEX IF NOT EXISTS idx_submission_teacher_review ON exercise_submissions(teacher_reviewed, grading_status)",
    ]
    
    for idx_sql in indexes:
        try:
            conn.execute(text(idx_sql))
            print(f"✅ Created index")
        except Exception as e:
            print(f"❌ Error creating index: {e}")

print("\n✅ Done! All columns and indexes added.")

