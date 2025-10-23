import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.exercise import Exercise
from app.models.submission import Submission
from app.core.security import get_password_hash
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_exercises.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def test_student(db_session):
    """Create a test student user"""
    student = User(
        username="teststudent",
        email="student@test.com",
        full_name="Test Student",
        hashed_password=get_password_hash("Test123!"),
        role=UserRole.USER,
        is_active=True,
        is_verified=True
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    return student

@pytest.fixture
def test_exercise(db_session):
    """Create a test exercise"""
    exercise = Exercise(
        class_id=1,
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
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

# =============== Exercises Tests ===============

def test_get_exercises_list(db_session):
    """Test getting list of exercises"""
    response = client.get("/api/v1/exercises/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Should return mock data
    assert len(response.json()) > 0

def test_get_exercises_with_filters(db_session):
    """Test getting exercises with filters"""
    response = client.get("/api/v1/exercises/?subject=Toán&grade=Lớp 2&difficulty=Dễ")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_exercise_detail(db_session, test_exercise):
    """Test getting exercise detail"""
    response = client.get(f"/api/v1/exercises/{test_exercise.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_exercise.id
    assert data["title"] == test_exercise.title

def test_get_exercise_not_found(db_session):
    """Test getting non-existent exercise"""
    response = client.get("/api/v1/exercises/9999")
    assert response.status_code == 404
    assert "Không tìm thấy bài tập" in response.json()["detail"]

def test_submit_exercise_success(db_session, test_exercise, test_student, student_token):
    """Test submitting an exercise"""
    answers = {"question1": "answer1", "question2": "answer2"}
    response = client.post(
        f"/api/v1/exercises/{test_exercise.id}/submit",
        json=answers,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "thành công" in data["message"]
    assert "submission_id" in data
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

def test_get_exercise_result(db_session, test_exercise, test_student, student_token):
    """Test getting exercise result"""
    # Submit exercise first
    submission = Submission(
        exercise_id=test_exercise.id,
        student_id=test_student.id,
        content_text="Test submission",
        score=85,
        status="graded",
        feedback="Good job!"
    )
    db_session.add(submission)
    db_session.commit()
    
    # Get result
    response = client.get(
        f"/api/v1/exercises/{test_exercise.id}/result",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 85
    assert "submission_id" in data
    assert "graded" in data

def test_get_exercise_result_not_submitted(db_session, test_exercise, test_student, student_token):
    """Test getting result for exercise not submitted"""
    response = client.get(
        f"/api/v1/exercises/{test_exercise.id}/result",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404
    assert "Chưa có kết quả" in response.json()["detail"]

def test_get_exercise_result_unauthorized(db_session, test_exercise):
    """Test getting exercise result without authentication"""
    response = client.get(f"/api/v1/exercises/{test_exercise.id}/result")
    assert response.status_code == 401
