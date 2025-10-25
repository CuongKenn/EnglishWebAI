from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.news import NewsPost
from app.schemas.student import NewsListResponse, NewsPostResponse, NewsCreate, NewsUpdate

router = APIRouter()

@router.get("/", response_model=List[NewsListResponse])
async def get_news(
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tin tức và sự kiện - Trả về từ database
    """
    query = db.query(NewsPost).filter(NewsPost.status == "published")
    
    # Filter by category if provided
    if category and category != "all":
        query = query.filter(NewsPost.category == category)
    
    # Order by published_at descending (newest first)
    query = query.order_by(desc(NewsPost.published_at))
    
    # Apply pagination
    news_posts = query.offset(skip).limit(limit).all()
    
    # Transform to response format
    result = []
    for news in news_posts:
        # Get author info
        author = db.query(User).filter(User.id == news.author_id).first() if news.author_id else None
        
        result.append({
            "id": news.id,
            "title": news.title,
            "description": news.description or "",
            "content": news.content,
            "icon": news.icon or "📰",
            "type": news.type,
            "category": news.category,
            "date": news.published_at.strftime("%d/%m/%Y") if news.published_at else news.created_at.strftime("%d/%m/%Y"),
            "image": news.image,
            "views": news.views,
            "likes": news.likes,
            "reading_time": news.reading_time,
            "author_name": author.name if author else "Admin",
            "author_role": author.role.value if author else "admin"
        })
    
    return result

@router.get("/{news_id}", response_model=NewsPostResponse)
async def get_news_detail(
    news_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết một tin tức
    """
    news = db.query(NewsPost).filter(
        NewsPost.id == news_id,
        NewsPost.status == "published"
    ).first()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin tức"
        )
    
    return news

# ===================== Teacher/Admin: CRUD News =====================

@router.post("/", response_model=NewsPostResponse, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tạo tin tức mới (chỉ teacher và admin)
    """
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể tạo tin tức"
        )
    
    # Calculate reading time based on content length (approx 200 words per minute)
    word_count = len(news_data.content.split())
    reading_time = max(1, round(word_count / 200))
    
    news = NewsPost(
        title=news_data.title,
        description=news_data.description,
        content=news_data.content,
        author_id=current_user.id,
        category=news_data.category,
        icon=news_data.icon,
        type=news_data.type,
        image=news_data.image,
        reading_time=reading_time,
        status=news_data.status,
        published_at=datetime.now() if news_data.status == "published" else None
    )
    
    db.add(news)
    db.commit()
    db.refresh(news)
    
    return news

@router.put("/{news_id}", response_model=NewsPostResponse)
async def update_news(
    news_id: int,
    news_data: NewsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật tin tức (chỉ tác giả hoặc admin)
    """
    news = db.query(NewsPost).filter(NewsPost.id == news_id).first()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin tức"
        )
    
    # Check permission
    if news.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền sửa tin tức này"
        )
    
    # Update fields
    update_data = news_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(news, field, value)
    
    # Update published_at if status changes to published
    if news_data.status == "published" and news.published_at is None:
        news.published_at = datetime.now()
    
    db.commit()
    db.refresh(news)
    
    return news

@router.delete("/{news_id}")
async def delete_news(
    news_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xóa tin tức (chỉ tác giả hoặc admin)
    """
    news = db.query(NewsPost).filter(NewsPost.id == news_id).first()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin tức"
        )
    
    # Check permission
    if news.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa tin tức này"
        )
    
    db.delete(news)
    db.commit()
    
    return {"message": "Đã xóa tin tức thành công"}

# ===================== Admin/Teacher Management =====================

@router.get("/manage/all")
async def get_all_news_for_management(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tất cả tin tức cho quản lý (bao gồm draft, published, archived)
    Chỉ dành cho admin và teacher
    """
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể xem tất cả tin tức"
        )
    
    # Teacher chỉ thấy bài của mình, Admin thấy tất cả
    if current_user.role == UserRole.TEACHER:
        news_posts = db.query(NewsPost).filter(
            NewsPost.author_id == current_user.id
        ).order_by(desc(NewsPost.created_at)).all()
    else:
        news_posts = db.query(NewsPost).order_by(desc(NewsPost.created_at)).all()
    
    result = []
    for news in news_posts:
        author = db.query(User).filter(User.id == news.author_id).first() if news.author_id else None
        result.append({
            "id": news.id,
            "title": news.title,
            "description": news.description,
            "content": news.content,
            "category": news.category,
            "icon": news.icon,
            "type": news.type,
            "image": news.image,
            "status": news.status,
            "views": news.views,
            "likes": news.likes,
            "reading_time": news.reading_time,
            "author_name": author.name if author else "Unknown",
            "author_id": news.author_id,
            "published_at": news.published_at.isoformat() if news.published_at else None,
            "created_at": news.created_at.isoformat() if news.created_at else None,
            "updated_at": news.updated_at.isoformat() if news.updated_at else None
        })
    
    return result
