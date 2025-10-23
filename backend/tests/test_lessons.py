import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.lesson import Lesson
from app.core.security import get_password_hash
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_lessons.db"
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
def test_lesson(db_session):
    """Create a test lesson"""
    lesson = Lesson(
        class_id=1,
        title="Test Lesson",
        content="Test lesson content",
        order_index=1
    )
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)
    return lesson

@pytest.fixture
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

# =============== Lessons Tests ===============

def test_get_lessons_list(db_session):
    """Test getting list of lessons"""
    response = client.get("/api/v1/lessons/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Should return mock data even without database lessons
    assert len(response.json()) > 0

def test_get_lessons_with_filters(db_session):
    """Test getting lessons with filters"""
    response = client.get("/api/v1/lessons/?grade=Lớp 3&subject=Tiếng Anh")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_lesson_detail(db_session, test_lesson):
    """Test getting lesson detail"""
    response = client.get(f"/api/v1/lessons/{test_lesson.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_lesson.id
    assert data["title"] == test_lesson.title

def test_get_lesson_not_found(db_session):
    """Test getting non-existent lesson"""
    response = client.get("/api/v1/lessons/9999")
    assert response.status_code == 404
    assert "Không tìm thấy bài học" in response.json()["detail"]

def test_get_lesson_materials(db_session, test_lesson):
    """Test getting lesson materials"""
    response = client.get(f"/api/v1/lessons/{test_lesson.id}/materials")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_lesson_progress(db_session, test_lesson, test_student, student_token):
    """Test updating lesson progress"""
    response = client.post(
        f"/api/v1/lessons/{test_lesson.id}/progress?progress=50",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "tiến độ" in data["message"]
    assert data["progress"] == 50

def test_update_lesson_progress_unauthorized(db_session, test_lesson):
    """Test updating lesson progress without authentication"""
    response = client.post(f"/api/v1/lessons/{test_lesson.id}/progress?progress=50")
    assert response.status_code == 401
