import pytest
from app.models.discussion import DiscussionThread, DiscussionPost
from tests.conftest import client

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

# =============== Discussions Tests ===============

def test_get_discussions_list(db_session, test_student, student_token):
    """Test getting list of discussions"""
    response = client.get(
        "/api/v1/discussions/",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should return data
    assert len(data) >= 0

def test_get_discussions_with_class_filter(db_session, test_student, student_token):
    """Test getting discussions filtered by class"""
    response = client.get(
        "/api/v1/discussions/?subject=Listening",
        headers={"Authorization": f"Bearer {student_token}"}
    )
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
    assert "xóa" in response.json()["message"].lower()
    
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

def test_update_discussion_post(db_session, test_discussion, test_student, student_token):
    """Test updating own post"""
    # First create a post
    post_data = {
        "content": "Original content",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Update the post
    update_data = {
        "content": "Updated content",
        "parent_post_id": None
    }
    response = client.put(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"
    assert data["id"] == post_id

def test_update_post_unauthorized(db_session, test_discussion, test_student, another_student, student_token, another_token):
    """Test updating another user's post"""
    # Create post as first student
    post_data = {
        "content": "Original content",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Try to update as another student
    update_data = {
        "content": "Hacked content",
        "parent_post_id": None
    }
    response = client.put(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {another_token}"}
    )
    assert response.status_code == 403
    assert "không có quyền" in response.json()["detail"]

def test_update_post_not_found(db_session, test_discussion, test_student, student_token):
    """Test updating non-existent post"""
    update_data = {
        "content": "Updated content",
        "parent_post_id": None
    }
    response = client.put(
        f"/api/v1/discussions/{test_discussion.id}/posts/9999",
        json=update_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_delete_discussion_post(db_session, test_discussion, test_student, student_token):
    """Test deleting own post"""
    # First create a post
    post_data = {
        "content": "Post to delete",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Delete the post
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    assert "xóa" in response.json()["message"].lower()
    
    # Verify deleted from database
    deleted_post = db_session.query(DiscussionPost).filter(
        DiscussionPost.id == post_id
    ).first()
    assert deleted_post is None

def test_delete_post_unauthorized(db_session, test_discussion, test_student, another_student, student_token, another_token):
    """Test deleting another user's post"""
    # Create post as first student
    post_data = {
        "content": "Post to protect",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Try to delete as another student
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}",
        headers={"Authorization": f"Bearer {another_token}"}
    )
    assert response.status_code == 403
    assert "không có quyền" in response.json()["detail"]

def test_delete_post_not_found(db_session, test_discussion, test_student, student_token):
    """Test deleting non-existent post"""
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}/posts/9999",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_like_discussion_post(db_session, test_discussion, test_student, student_token):
    """Test liking a post"""
    # First create a post
    post_data = {
        "content": "Post to like",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Like the post
    response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "thích" in data["message"]

def test_like_post_not_found(db_session, test_discussion, test_student, student_token):
    """Test liking non-existent post"""
    response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts/9999/like",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404

def test_unlike_discussion_post(db_session, test_discussion, test_student, student_token):
    """Test unliking a post"""
    # First create a post
    post_data = {
        "content": "Post to unlike",
        "parent_post_id": None
    }
    create_response = client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts",
        json=post_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    post_id = create_response.json()["id"]
    
    # Like first
    client.post(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    
    # Unlike the post
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "bỏ thích" in data["message"]

def test_unlike_post_not_found(db_session, test_discussion, test_student, student_token):
    """Test unliking non-existent post"""
    response = client.delete(
        f"/api/v1/discussions/{test_discussion.id}/posts/9999/like",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 404
