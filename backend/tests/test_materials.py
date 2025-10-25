import pytest
from app.models.material import Material
from tests.conftest import client

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

# =============== Materials Tests ===============

def test_get_materials_list(db_session, test_student, student_token):
    """Test getting list of materials"""
    response = client.get(
        "/api/v1/materials/",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_materials_with_filters(db_session, test_student, student_token):
    """Test getting materials with filters"""
    response = client.get(
        "/api/v1/materials/?type=file",
        headers={"Authorization": f"Bearer {student_token}"}
    )
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

def test_get_student_materials_list(db_session, test_student, student_token):
    """Test getting student materials list via /student/materials/ endpoint"""
    response = client.get(
        "/api/v1/materials/student/materials/",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_student_materials_unauthorized(db_session):
    """Test getting student materials without authentication"""
    response = client.get("/api/v1/materials/student/materials/")
    assert response.status_code == 401

def test_get_student_materials_with_class_filter(db_session, test_student, student_token):
    """Test getting student materials filtered by class"""
    response = client.get(
        "/api/v1/materials/student/materials/?class_id=1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_student_materials_with_type_filter(db_session, test_student, student_token):
    """Test getting student materials filtered by type"""
    response = client.get(
        "/api/v1/materials/student/materials/?type=file",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
