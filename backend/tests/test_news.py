import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.news import NewsPost
from app.core.security import get_password_hash
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_news.db"
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
    response = client.get("/api/v1/news/?category=event")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

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
    
    # Check that we have news with different categories
    categories = set(item["category"] for item in data)
    assert len(categories) > 1

def test_get_news_pagination(db_session):
    """Test getting news with pagination parameters"""
    response = client.get("/api/v1/news/?skip=0&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5

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
        assert "created_at" in news_item
