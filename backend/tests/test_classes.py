import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_classes.db"
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
def test_classroom(db_session, test_teacher):
    """Create a test classroom"""
    classroom = Classroom(
        name="Test Class",
        code="TEST001",
        description="Test classroom description",
        teacher_id=test_teacher.id,
        max_students=30,
        schedule="Thứ 2, 4, 6 - 8:00-9:00",
        is_active=True
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    return classroom

@pytest.fixture
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

@pytest.fixture
def teacher_token(test_teacher):
    """Get authentication token for teacher"""
    response = client.post(
        "/api/users/login/",
        json={"username": "testteacher", "password": "Test123!"}
    )
    return response.json()["access_token"]

# =============== Classes Tests ===============

def test_get_classes_list(db_session, test_classroom):
    """Test getting list of classes"""
    response = client.get("/api/v1/classes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_classes_with_search(db_session, test_classroom):
    """Test searching classes"""
    response = client.get("/api/v1/classes/?search=Test")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_class_detail(db_session, test_classroom):
    """Test getting class detail"""
    response = client.get(f"/api/v1/classes/{test_classroom.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_classroom.id
    assert data["name"] == test_classroom.name

def test_get_class_not_found(db_session):
    """Test getting non-existent class"""
    response = client.get("/api/v1/classes/9999")
    assert response.status_code == 404
    assert "Không tìm thấy lớp học" in response.json()["detail"]

def test_join_class_success(db_session, test_classroom, test_student, student_token):
    """Test student joining a class"""
    response = client.post(
        f"/api/v1/classes/{test_classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["class_id"] == test_classroom.id
    assert data["user_id"] == test_student.id
    assert data["status"] == "active"

def test_join_class_already_joined(db_session, test_classroom, test_student, student_token):
    """Test joining a class that student already joined"""
    # Join first time
    client.post(
        f"/api/v1/classes/{test_classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    # Try to join again
    response = client.post(
        f"/api/v1/classes/{test_classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 400
    assert "đã tham gia" in response.json()["detail"]

def test_join_class_not_found(db_session, test_student, student_token):
    """Test joining non-existent class"""
    response = client.post(
        "/api/v1/classes/9999/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_join_class_unauthorized(db_session, test_classroom):
    """Test joining class without authentication"""
    response = client.post(f"/api/v1/classes/{test_classroom.id}/join")
    assert response.status_code == 401

def test_get_my_classes(db_session, test_classroom, test_student, student_token):
    """Test getting student's enrolled classes"""
    # Join a class first
    client.post(
        f"/api/v1/classes/{test_classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    # Get my classes
    response = client.get(
        "/api/v1/classes/my-classes",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_classroom.id

def test_leave_class_success(db_session, test_classroom, test_student, student_token):
    """Test leaving a class"""
    # Join class first
    client.post(
        f"/api/v1/classes/{test_classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    # Leave class
    response = client.post(
        f"/api/v1/classes/{test_classroom.id}/leave",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    assert "thành công" in response.json()["message"]

def test_leave_class_not_joined(db_session, test_classroom, test_student, student_token):
    """Test leaving a class that student hasn't joined"""
    response = client.post(
        f"/api/v1/classes/{test_classroom.id}/leave",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404
    assert "chưa tham gia" in response.json()["detail"]

def test_join_full_class(db_session, test_teacher, test_student, student_token):
    """Test joining a full class"""
    # Create a class with max 1 student
    classroom = Classroom(
        name="Full Class",
        code="FULL001",
        description="Full classroom",
        teacher_id=test_teacher.id,
        max_students=1,
        is_active=True
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    
    # Create another student and join the class
    other_student = User(
        username="otherstudent",
        email="other@test.com",
        full_name="Other Student",
        hashed_password=get_password_hash("Test123!"),
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(other_student)
    db_session.commit()
    
    enrollment = Enrollment(
        class_id=classroom.id,
        user_id=other_student.id,
        status="active"
    )
    db_session.add(enrollment)
    db_session.commit()
    
    # Try to join full class
    response = client.post(
        f"/api/v1/classes/{classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 400
    assert "đầy" in response.json()["detail"]

def test_join_inactive_class(db_session, test_teacher, test_student, student_token):
    """Test joining an inactive class"""
    classroom = Classroom(
        name="Inactive Class",
        code="INACT001",
        description="Inactive classroom",
        teacher_id=test_teacher.id,
        is_active=False
    )
    db_session.add(classroom)
    db_session.commit()
    db_session.refresh(classroom)
    
    response = client.post(
        f"/api/v1/classes/{classroom.id}/join",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 400
    assert "đóng" in response.json()["detail"]
