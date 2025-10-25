import pytest
from app.models.lesson import Lesson
from app.models.classroom import Classroom
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
def test_lesson(db_session, test_classroom):
    """Create a test lesson"""
    lesson = Lesson(
        class_id=test_classroom.id,
        title="Test Lesson",
        content="Test lesson content",
        order_index=1
    )
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    return lesson

# =============== Lessons Tests ===============

def test_get_lessons_list(db_session, test_lesson):
    """Test getting list of lessons"""
    response = client.get("/api/v1/lessons/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_lesson_detail(db_session, test_lesson, student_token):
    """Test getting lesson detail"""
    response = client.get(f"/api/v1/lessons/{test_lesson.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_lesson.id

def test_get_lesson_not_found(db_session, student_token):
    """Test getting non-existent lesson"""
    response = client.get("/api/v1/lessons/9999")
    assert response.status_code == 404

def test_update_lesson_progress(db_session, test_lesson, test_student, student_token):
    """Test updating lesson progress"""
    response = client.post(
        f"/api/v1/lessons/{test_lesson.id}/progress?progress=50",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "tiến độ" in data["message"].lower()
    assert data["progress"] == 50

def test_update_lesson_progress_unauthorized(db_session, test_lesson):
    """Test updating lesson progress without authentication"""
    response = client.post(f"/api/v1/lessons/{test_lesson.id}/progress?progress=50")
    assert response.status_code == 401
