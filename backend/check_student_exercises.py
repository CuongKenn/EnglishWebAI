#!/usr/bin/env python3
"""Check what exercises are visible to student."""

import sqlite3

conn = sqlite3.connect('/app/data/englishwebai.db')
cursor = conn.cursor()

# Check exercises for student user_id=11
cursor.execute("""
    SELECT e.id, e.title, e.type, e.skill_type, e.class_id, c.name as class_name
    FROM exercises e
    JOIN classes c ON e.class_id = c.id
    JOIN class_enrollments ce ON ce.class_id = c.id
    WHERE ce.user_id = 11 
    AND ce.role = 'student' 
    AND ce.status = 'active'
""")

print("=== Exercises visible to student (user_id=11) ===")
exercises = cursor.fetchall()
if exercises:
    for ex in exercises:
        print(f"ID: {ex[0]}, Title: {ex[1]}, Type: {ex[2]}, Skill: {ex[3]}, Class: {ex[5]} (id={ex[4]})")
else:
    print("No exercises found!")

# Check enrollment
cursor.execute("SELECT user_id, class_id, role, status FROM class_enrollments WHERE user_id = 11")
print("\n=== Student enrollment ===")
for row in cursor.fetchall():
    print(f"user_id={row[0]}, class_id={row[1]}, role={row[2]}, status={row[3]}")

# Check all exercises
cursor.execute("SELECT id, title, class_id, type, skill_type FROM exercises")
print("\n=== All exercises ===")
for row in cursor.fetchall():
    print(f"ID: {row[0]}, Title: {row[1]}, Class: {row[2]}, Type: {row[3]}, Skill: {row[4]}")

conn.close()
