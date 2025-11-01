import sys
sys.path.insert(0, '/app')

from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.models.user import User

# Get a teacher user
db = SessionLocal()
teacher = db.query(User).filter(User.id == 9).first()  # Teacher of class 1
print(f"Testing with teacher: {teacher.full_name} (ID: {teacher.id})")

# Create test client
client = TestClient(app)

# Mock auth by setting user directly (bypass JWT)
from app.core.dependencies import get_current_user
def override_get_current_user():
    return teacher

app.dependency_overrides[get_current_user] = override_get_current_user

# Call endpoint
response = client.get("/api/v1/teacher/classes/1/analytics/students")
print(f"\nStatus: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"Response type: {type(data)}")
    print(f"Response keys: {data.keys() if isinstance(data, dict) else 'N/A (list)'}")
    
    if isinstance(data, dict):
        print(f"Total students: {data.get('total', 0)}")
        students = data.get('students', [])
    else:
        students = data
    
    print(f"Students in response: {len(students)}")
    
    if students:
        student = students[0]
        print(f"\nFirst student:")
        print(f"  Name: {student['student_name']}")
        print(f"  Skill scores: {student['skill_scores']}")
        print(f"  Skill scores type: {type(student['skill_scores'])}")
else:
    print(f"Error: {response.text}")

db.close()
