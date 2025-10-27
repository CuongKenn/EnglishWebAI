#!/usr/bin/env python3
"""Fix user roles to match SQLAlchemy enum member names (uppercase)."""

import sqlite3

# Connect to database
conn = sqlite3.connect('/app/data/englishwebai.db')
cursor = conn.cursor()

# Update roles to uppercase
updates = [
    ("UPDATE users SET role='USER' WHERE role='user'", "user -> USER"),
    ("UPDATE users SET role='TEACHER' WHERE role='teacher'", "teacher -> TEACHER"),
    ("UPDATE users SET role='ADMIN' WHERE role='admin'", "admin -> ADMIN"),
    ("UPDATE users SET role='PARENT' WHERE role='parent'", "parent -> PARENT"),
    ("UPDATE users SET role='SUPERADMIN' WHERE role='superadmin'", "superadmin -> SUPERADMIN"),
]

total_updated = 0
for update_sql, desc in updates:
    cursor.execute(update_sql)
    count = cursor.rowcount
    if count > 0:
        print(f"Updated {count} users: {desc}")
        total_updated += count

conn.commit()

# Verify
cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
print("\n=== Current Role Distribution ===")
for role, count in cursor.fetchall():
    print(f"{role}: {count}")

print(f"\nTotal users updated: {total_updated}")

conn.close()
