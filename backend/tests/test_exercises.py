import pytest
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from tests.conftest import client

@pytest.fixture
def test_classroom(db_session, test_teacher):
    """Create a test classroom"""
    classroom = Classroom(
        name="Test Class",
        code="TEST001",
        description="Test classroom",
        teacher_id=test_teacher.id,
        is_active=True
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    return classroom

@pytest.fixture
def test_exercise(db_session, test_classroom):
    """Create a test exercise"""
    exercise = Exercise(
        class_id=test_classroom.id,
        title="Test Exercise",
        description="Test exercise description",
        type="assignment",
        max_score=100
    )
    db_session.add(exercise)
    db_session.commit()
    db_session.refresh(exercise)
    return exercise

@pytest.fixture
def enrolled_student(db_session, test_student, test_classroom):
    """Enroll student in classroom"""
    enrollment = Enrollment(
        user_id=test_student.id,
        class_id=test_classroom.id,
        role="student",
        status="active"
    )
    db_session.add(enrollment)
    db_session.commit()
    return test_student

# =============== Exercises Tests ===============

def test_get_exercises_list(db_session, enrolled_student, student_token):
    """Test getting list of exercises"""
    response = client.get(
        "/api/v1/exercises/",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_exercises_with_filters(db_session, enrolled_student, student_token):
    """Test getting exercises with filters"""
    response = client.get(
        "/api/v1/exercises/?class_id=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_exercise_detail(db_session, test_exercise, enrolled_student, student_token):
    """Test getting exercise detail"""
    response = client.get(
        f"/api/v1/exercises/{test_exercise.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_exercise.id
    assert data["title"] == test_exercise.title

def test_get_exercise_not_found(db_session, enrolled_student, student_token):
    """Test getting non-existent exercise"""
    response = client.get(
        "/api/v1/exercises/9999",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404
    assert "Không tìm thấy bài tập" in response.json()["detail"]

def test_submit_exercise_success(db_session, test_exercise, enrolled_student, student_token):
    """Test submitting an exercise"""
    submission_data = {
        "content_text": "My answer",
        "content_url": None
    }
    response = client.post(
        f"/api/v1/exercises/{test_exercise.id}/submit",
        json=submission_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content_text"] == "My answer"
    assert data["status"] in ["submitted", "late"]
    assert "score" in data

def test_submit_exercise_not_found(db_session, test_student, student_token):
    """Test submitting to non-existent exercise"""
    response = client.post(
        "/api/v1/exercises/9999/submit",
        json={"answer": "test"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_submit_exercise_unauthorized(db_session, test_exercise):
    """Test submitting exercise without authentication"""
    response = client.post(
        f"/api/v1/exercises/{test_exercise.id}/submit",
        json={"answer": "test"}
    )
    assert response.status_code == 401

def test_get_exercise_result(db_session, test_exercise, enrolled_student, student_token):
    """Test getting exercise result"""
    # Submit exercise first
    submission = Submission(
        exercise_id=test_exercise.id,
        student_id=enrolled_student.id,
        content_text="Test submission",
        score=85,
        status="graded",
        feedback="Good job!"
    )
    db_session.add(submission)
    db_session.commit()
    
    # Get result
    response = client.get(
        f"/api/v1/exercises/{test_exercise.id}/my-submission",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 85

def test_get_exercise_result_not_submitted(db_session, test_exercise, enrolled_student, student_token):
    """Test getting result for exercise not submitted"""
    response = client.get(
        f"/api/v1/exercises/{test_exercise.id}/my-submission",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_get_exercise_result_unauthorized(db_session, test_exercise):
    """Test getting exercise result without authentication"""
    response = client.get(f"/api/v1/exercises/{test_exercise.id}/my-submission")
    assert response.status_code == 401
