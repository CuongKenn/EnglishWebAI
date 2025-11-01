import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.routers.teacher_analytics import StudentAnalytics

# Test creating StudentAnalytics object
test_data = StudentAnalytics(
    student_id=11,
    student_name="Test Student",
    total_submissions=6,
    graded_submissions=6,
    average_score=22.5,
    skill_scores={'reading': 22.5, 'writing': 0.0, 'listening': 2.5, 'speaking': 0.0},
    recent_trend='stable'
)

print("StudentAnalytics object created:")
print(f"  student_name: {test_data.student_name}")
print(f"  skill_scores: {test_data.skill_scores}")
print(f"  skill_scores type: {type(test_data.skill_scores)}")

# Test dict conversion
as_dict = test_data.model_dump()
print(f"\nAs dict:")
print(f"  skill_scores: {as_dict['skill_scores']}")
print(f"  skill_scores type: {type(as_dict['skill_scores'])}")
