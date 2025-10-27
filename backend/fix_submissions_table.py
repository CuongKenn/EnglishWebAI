#!/usr/bin/env python3
"""Fix exercise_submissions table by removing score_old column."""

import sqlite3

# Connect to database
conn = sqlite3.connect('/app/data/englishwebai.db')
cursor = conn.cursor()

print("=== Recreating exercise_submissions table ===")

# Get existing data
cursor.execute("""
    SELECT id, exercise_id, student_id, content_text, content_url, 
           score, feedback, status, submitted_at, graded_at,
           answers, ai_feedback, ai_score, rubrics_scores, error_analysis,
           ai_graded_at, duration
    FROM exercise_submissions
""")
existing_data = cursor.fetchall()
print(f"Backing up {len(existing_data)} submissions")

# Drop old table
cursor.execute("DROP TABLE exercise_submissions")

# Create new table with correct schema
cursor.execute("""
    CREATE TABLE exercise_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        content_text TEXT,
        content_url VARCHAR,
        answers TEXT,
        score REAL,
        feedback TEXT,
        ai_feedback TEXT,
        ai_score REAL,
        rubrics_scores TEXT,
        error_analysis TEXT,
        status VARCHAR DEFAULT 'submitted' NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        graded_at DATETIME,
        ai_graded_at DATETIME,
        duration INTEGER,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    )
""")
print("Created new table")

# Restore data
if existing_data:
    cursor.executemany("""
        INSERT INTO exercise_submissions 
        (id, exercise_id, student_id, content_text, content_url, score,
         feedback, status, submitted_at, graded_at, answers, ai_feedback,
         ai_score, rubrics_scores, error_analysis, ai_graded_at, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, existing_data)
    print(f"Restored {len(existing_data)} submissions")

conn.commit()
print("✅ Table recreated successfully")

conn.close()
