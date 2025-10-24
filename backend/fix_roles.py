import sqlite3

# Connect to database
conn = sqlite3.connect('data/englishwebai.db')
cursor = conn.cursor()

# Update invalid student role to user
cursor.execute("UPDATE users SET role='user' WHERE role='student'")
conn.commit()
print(f'✅ Updated {cursor.rowcount} users with student role to user role')

# Delete inactive users (temporary users from failed registration)
cursor.execute("DELETE FROM users WHERE is_active=0")
conn.commit()
print(f'✅ Deleted {cursor.rowcount} inactive temporary users')

# Show remaining users
cursor.execute("SELECT COUNT(*) FROM users")
total = cursor.fetchone()[0]
print(f'📊 Total users in database: {total}')

conn.close()
print('✅ Database cleanup complete!')
