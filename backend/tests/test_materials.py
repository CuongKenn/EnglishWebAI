import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.material import Material
from app.core.security import get_password_hash
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_materials.db"
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
def test_material(db_session):
    """Create a test material"""
    material = Material(
        class_id=1,
        title="Test Material",
        description="Test material description",
        type="file",
        url="https://example.com/material.pdf"
    )
    db_session.add(material)
    db_session.commit()
    db_session.refresh(material)
    return material

@pytest.fixture
def student_token(test_student):
    """Get authentication token for student"""
    response = client.post(
        "/api/users/login/",
        json={"username": "teststudent", "password": "Test123!"}
    )
    return response.json()["access_token"]

# =============== Materials Tests ===============

def test_get_materials_list(db_session):
    """Test getting list of materials"""
    response = client.get("/api/v1/materials/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Should return mock data
    assert len(response.json()) > 0

def test_get_materials_with_filters(db_session):
    """Test getting materials with filters"""
    response = client.get("/api/v1/materials/?grade=Lớp 2&subject=Toán")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_material_detail(db_session, test_material):
    """Test getting material detail"""
    response = client.get(f"/api/v1/materials/{test_material.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_material.id
    assert data["title"] == test_material.title

def test_get_material_not_found(db_session):
    """Test getting non-existent material"""
    response = client.get("/api/v1/materials/9999")
    assert response.status_code == 404
    assert "Không tìm thấy học liệu" in response.json()["detail"]

def test_update_material_progress(db_session, test_material, test_student, student_token):
    """Test updating material progress"""
    response = client.post(
        f"/api/v1/materials/{test_material.id}/progress?progress=75",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "học liệu" in data["message"]
    assert data["progress"] == 75
    assert data["material_id"] == test_material.id

def test_update_material_progress_not_found(db_session, test_student, student_token):
    """Test updating progress for non-existent material"""
    response = client.post(
        "/api/v1/materials/9999/progress?progress=50",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_update_material_progress_unauthorized(db_session, test_material):
    """Test updating material progress without authentication"""
    response = client.post(f"/api/v1/materials/{test_material.id}/progress?progress=50")
    assert response.status_code == 401

def test_download_material(db_session, test_material, test_student, student_token):
    """Test downloading material"""
    response = client.get(
        f"/api/v1/materials/{test_material.id}/download",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "filename" in data

def test_download_material_not_found(db_session, test_student, student_token):
    """Test downloading non-existent material"""
    response = client.get(
        "/api/v1/materials/9999/download",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_download_material_no_file(db_session, test_student, student_token):
    """Test downloading material without file"""
    material = Material(
        class_id=1,
        title="No File Material",
        description="Material without file",
        type="text"
    )
    db_session.add(material)
    db_session.commit()
    db_session.refresh(material)
    
    response = client.get(
        f"/api/v1/materials/{material.id}/download",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 400
    assert "không có file" in response.json()["detail"]

def test_download_material_unauthorized(db_session, test_material):
    """Test downloading material without authentication"""
    response = client.get(f"/api/v1/materials/{test_material.id}/download")
    assert response.status_code == 401
