import sqlite3

conn = sqlite3.connect('/app/data/englishwebai.db')
cursor = conn.cursor()

# Backup data
cursor.execute('DROP TABLE IF EXISTS exercises_backup')
cursor.execute('CREATE TABLE exercises_backup AS SELECT * FROM exercises')

# Drop old table
cursor.execute('DROP TABLE exercises')

# Create new table with AUTOINCREMENT
cursor.execute('''
CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    lesson_id INTEGER,
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL DEFAULT 'assignment',
    skill_type TEXT,
    max_score REAL,
    due_at DATETIME,
    duration INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    enable_ai_grading INTEGER DEFAULT 0,
    rubrics TEXT,
    content TEXT,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
)
''')

# Create indexes
cursor.execute('CREATE INDEX ix_exercises_id ON exercises (id)')
cursor.execute('CREATE INDEX ix_exercises_class_id ON exercises (class_id)')

# Restore data
cursor.execute('SELECT COUNT(*) FROM exercises_backup')
count = cursor.fetchone()[0]
if count > 0:
    cursor.execute('INSERT INTO exercises SELECT * FROM exercises_backup')
    print(f'Restored {count} exercises')
else:
    print('No exercises to restore')

# Drop backup
cursor.execute('DROP TABLE exercises_backup')

conn.commit()
conn.close()
print('SUCCESS: Table exercises recreated with AUTOINCREMENT')
