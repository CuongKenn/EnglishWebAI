import sqlite3

conn = sqlite3.connect('/app/data/englishwebai.db')
c = conn.cursor()

print('=== STUDENTS ===')
c.execute('SELECT id, email, role FROM users WHERE role="user" LIMIT 5')
for r in c.fetchall():
    print(f'  ID={r[0]}, Email={r[1]}, Role={r[2]}')

print('\n=== ENROLLMENTS ===')
c.execute('SELECT id, user_id, class_id, role, status FROM class_enrollments LIMIT 10')
for r in c.fetchall():
    print(f'  ID={r[0]}, User={r[1]}, Class={r[2]}, Role={r[3]}, Status={r[4]}')

print('\n=== CLASSES ===')
c.execute('SELECT id, name, teacher_id FROM classes')
for r in c.fetchall():
    print(f'  ID={r[0]}, Name={r[1]}, Teacher={r[2]}')

print('\n=== EXERCISES ===')
c.execute('SELECT id, title, class_id, type FROM exercises')
exercises = c.fetchall()
if exercises:
    for r in exercises:
        print(f'  ID={r[0]}, Title={r[1]}, Class={r[2]}, Type={r[3]}')
else:
    print('  No exercises found')

conn.close()
