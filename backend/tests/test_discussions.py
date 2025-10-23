import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.discussion import DiscussionThread, DiscussionPost
from app.core.security import get_password_hash
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_discussions.db"
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
def test_discussion(db_session, test_student):
    """Create a test discussion"""
    discussion = DiscussionThread(
        class_id=1,
        created_by=test_student.id,
        title="Test Discussion"
    )
    db_session.add(discussion)
    db_session.commit()
    db_session.refresh(discussion)
    return discussion

@pytest.fixture
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

@pytest.fixture
def another_token(another_student):
    """Get authentication token for another student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "anotherstudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

# =============== Discussions Tests ===============

def test_get_discussions_list(db_session):
    """Test getting list of discussions"""
    response = client.get("/api/v1/discussions/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should return mock data
    assert len(data) > 0

def test_get_discussions_with_class_filter(db_session):
    """Test getting discussions filtered by class"""
    response = client.get("/api/v1/discussions/?subject=Toán")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_discussion(db_session, test_student, student_token):
    """Test creating a new discussion"""
    discussion_data = {
        "class_id": 1,
        "title": "New Discussion"
    }
    response = client.post(
        "/api/v1/discussions/",
        json=discussion_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == discussion_data["title"]
    assert data["created_by"] == test_student.id

def test_create_discussion_unauthorized(db_session):
    """Test creating discussion without authentication"""
    discussion_data = {
        "class_id": 1,
        "title": "New Discussion"
    }
    response = client.post("/api/v1/discussions/", json=discussion_data)
    assert response.status_code == 401

def test_get_discussion_detail(db_session, test_discussion):
    """Test getting discussion detail"""
    response = client.get(f"/api/v1/discussions/{test_discussion.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_discussion.id
    assert data["title"] == test_discussion.title

def test_get_discussion_not_found(db_session):
    """Test getting non-existent discussion"""
    response = client.get("/api/v1/discussions/9999")
    assert response.status_code == 404

def test_delete_discussion(db_session, test_discussion, test_student, student_token):
    """Test deleting own discussion"""
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    assert "đã xóa" in response.json()["message"]
    
    # Verify deleted from database
    deleted_thread = db_session.query(DiscussionThread).filter(
        DiscussionThread.id == test_discussion.id
    ).first()
    assert deleted_thread is None

def test_delete_discussion_unauthorized(db_session, test_discussion, another_student, another_token):
    """Test deleting another user's discussion"""
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}",
        headers={"Authorization": f"Bearer {another_token}"}
    )
    assert response.status_code == 403
    assert "không có quyền" in response.json()["detail"]

def test_delete_discussion_not_found(db_session, test_student, student_token):
    """Test deleting non-existent discussion"""
    response = client.delete(
        "/api/v1/discussions/9999",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_create_discussion_post(db_session, test_discussion, test_student, student_token):
    """Test creating a post in discussion"""
    post_data = {
        "content": "This is a reply to the discussion",
        "parent_post_id": None
    }
    response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == post_data["content"]
    assert data["thread_id"] == test_discussion.id
    assert data["author_id"] == test_student.id

def test_create_post_unauthorized(db_session, test_discussion):
    """Test creating post without authentication"""
    post_data = {
        "content": "Test reply",
        "parent_post_id": None
    }
    response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data
    )
    assert response.status_code == 401

def test_create_post_discussion_not_found(db_session, test_student, student_token):
    """Test creating post in non-existent discussion"""
    post_data = {
        "content": "Test reply",
        "parent_post_id": None
    }
    response = client.post(
        "/api/v1/discussions/9999/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_get_discussion_posts(db_session, test_discussion):
    """Test getting posts for a discussion"""
    response = client.get(f"/api/v1/discussions/{test_discussion.id}/posts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
