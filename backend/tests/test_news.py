import pytest
from app.models.news import NewsPost
from tests.conftest import client

@pytest.fixture
def test_news(db_session):
    """Create test news"""
    news1 = NewsPost(
        title="Test News 1",
        content="Content of test news 1",
        status="published"
    )
    news2 = NewsPost(
        title="Test News 2",
        content="Content of test news 2",
        status="published"
    )
    db_session.add_all([news1, news2])
    db_session.commit()
    db_session.refresh(news1)
    db_session.refresh(news2)
    return [news1, news2]

# =============== News Tests ===============

def test_get_news_list(db_session):
    """Test getting list of news"""
    response = client.get("/api/v1/news/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Should return mock data
    assert len(response.json()) > 0

def test_get_news_with_category_filter(db_session):
    """Test getting news filtered by category"""
    response = client.get("/api/v1/news/?category=all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_news_detail_from_db(db_session, test_news):
    """Test getting news detail from database"""
    response = client.get(f"/api/v1/news/{test_news[0].id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_news[0].id
    assert data["title"] == test_news[0].title
    assert data["content"] == test_news[0].content

def test_get_news_not_found(db_session):
    """Test getting non-existent news"""
    response = client.get("/api/v1/news/9999")
    assert response.status_code == 404
    assert "Không tìm thấy tin tức" in response.json()["detail"]

def test_get_news_multiple_categories(db_session):
    """Test that news list contains different categories"""
    response = client.get("/api/v1/news/")
    assert response.status_code == 200
    data = response.json()
    
    # Check that we have news
    assert len(data) > 0

def test_get_news_pagination(db_session):
    """Test getting news with pagination parameters"""
    response = client.get("/api/v1/news/?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_news_response_structure(db_session):
    """Test that news response has correct structure"""
    response = client.get("/api/v1/news/")
    assert response.status_code == 200
    data = response.json()
    
    # Check first item structure
    if len(data) > 0:
        news_item = data[0]
        assert "id" in news_item
        assert "title" in news_item
        assert "content" in news_item
        assert "category" in news_item

def test_create_news_as_teacher(db_session, test_teacher, teacher_token):
    """Test creating news as teacher"""
    news_data = {
        "title": "New Teacher News",
        "content": "This is news created by teacher",
        "status": "published",
        "category": "Thông báo"
    }
    response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == news_data["title"]
    assert data["content"] == news_data["content"]
    assert data["author_id"] == test_teacher.id

def test_create_news_as_student_forbidden(db_session, test_student, student_token):
    """Test that students cannot create news"""
    news_data = {
        "title": "Student News",
        "content": "Students should not be able to create news",
        "status": "published"
    }
    response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403
    assert "giáo viên" in response.json()["detail"]

def test_create_news_unauthorized(db_session):
    """Test creating news without authentication"""
    news_data = {
        "title": "Unauthorized News",
        "content": "This should fail",
        "status": "published"
    }
    response = client.post("/api/v1/news/", json=news_data)
    assert response.status_code == 401

def test_update_news_as_author(db_session, test_teacher, teacher_token):
    """Test updating news as author"""
    # First create news
    news_data = {
        "title": "Original Title",
        "content": "Original content",
        "status": "published"
    }
    create_response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    news_id = create_response.json()["id"]
    
    # Update news
    update_data = {
        "title": "Updated Title",
        "content": "Updated content"
    }
    response = client.put(
        f"/api/v1/news/{news_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated content"

def test_update_news_not_author(db_session, test_teacher, test_student, teacher_token, student_token):
    """Test updating news as non-author"""
    # Create news as teacher
    news_data = {
        "title": "Teacher's News",
        "content": "Original content",
        "status": "published"
    }
    create_response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    news_id = create_response.json()["id"]
    
    # Try to update as student
    update_data = {
        "title": "Hacked Title"
    }
    response = client.put(
        f"/api/v1/news/{news_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403
    assert "không có quyền" in response.json()["detail"]

def test_update_news_not_found(db_session, test_teacher, teacher_token):
    """Test updating non-existent news"""
    update_data = {
        "title": "Updated Title"
    }
    response = client.put(
        "/api/v1/news/9999",
        json=update_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 404

def test_delete_news_as_author(db_session, test_teacher, teacher_token):
    """Test deleting news as author"""
    # First create news
    news_data = {
        "title": "News to Delete",
        "content": "This will be deleted",
        "status": "published"
    }
    create_response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    news_id = create_response.json()["id"]
    
    # Delete news
    response = client.delete(
        f"/api/v1/news/{news_id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 200
    assert "xóa" in response.json()["message"].lower()
    
    # Verify deleted from database
    deleted_news = db_session.query(NewsPost).filter(
        NewsPost.id == news_id
    ).first()
    assert deleted_news is None

def test_delete_news_not_author(db_session, test_teacher, test_student, teacher_token, student_token):
    """Test deleting news as non-author"""
    # Create news as teacher
    news_data = {
        "title": "Protected News",
        "content": "Cannot be deleted by others",
        "status": "published"
    }
    create_response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    news_id = create_response.json()["id"]
    
    # Try to delete as student
    response = client.delete(
        f"/api/v1/news/{news_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403
    assert "không có quyền" in response.json()["detail"]

def test_delete_news_not_found(db_session, test_teacher, teacher_token):
    """Test deleting non-existent news"""
    response = client.delete(
        "/api/v1/news/9999",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 404

def test_create_news_with_draft_status(db_session, test_teacher, teacher_token):
    """Test creating news with draft status"""
    news_data = {
        "title": "Draft News",
        "content": "This is a draft",
        "status": "draft"
    }
    response = client.post(
        "/api/v1/news/",
        json=news_data,
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "draft"
    assert data["published_at"] is None
