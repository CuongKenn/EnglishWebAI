"""
Shared pytest fixtures for all test files
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from main import app

# Single test database for all tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return response.json()["access_token"]

@pytest.fixture
def another_student(db_session):
    """Create another test student user"""
    student = User(
        username="anotherstudent",
        email="another@test.com",
        full_name="Another Student",
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
def another_token(another_student):
    """Get authentication token for another student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "anotherstudent", "password": "Test123!"}
    )
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return response.json()["access_token"]

@pytest.fixture
def test_teacher(db_session):
    """Create a test teacher user"""
    teacher = User(
        username="testteacher",
        email="teacher@test.com",
        full_name="Test Teacher",
        hashed_password=get_password_hash("Test123!"),
        role=UserRole.TEACHER,
        is_active=True,
        is_verified=True
    )
    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)
    return teacher

@pytest.fixture
def teacher_token(test_teacher):
    """Get authentication token for teacher"""
    response = client.post(
        "/api/users/login/",
        json={"username": "testteacher", "password": "Test123!"}
    )
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return response.json()["access_token"]
