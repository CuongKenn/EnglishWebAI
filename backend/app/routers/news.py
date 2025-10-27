from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_, func
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import os
import uuid
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.news import NewsPost
from app.models.news_like import NewsLike
from app.schemas.student import (
    NewsListResponse,
    NewsPostResponse,
    NewsCreate,
    NewsUpdate,
    NewsStatusUpdate,
    NewsManageItem,
    NewsManageListResponse,
)

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
            "author_name": author.full_name if author else "Admin",
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
    
    # Increase views count (best-effort)
    try:
        news.views = (news.views or 0) + 1
        db.commit()
        db.refresh(news)
    except Exception:
        db.rollback()
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
            "author_name": author.full_name if author else "Unknown",
            "author_id": news.author_id,
            "published_at": news.published_at.isoformat() if news.published_at else None,
            "created_at": news.created_at.isoformat() if news.created_at else None,
            "updated_at": news.updated_at.isoformat() if news.updated_at else None
        })
    
    return result


# ===================== Admin/Teacher Management (paginated + filters) =====================

@router.get("/manage", response_model=NewsManageListResponse)
async def get_news_for_management(
    q: Optional[str] = Query(None, description="Search by title/description/content"),
    status_filter: Optional[str] = Query(None, alias="status", description="draft|published|archived"),
    category: Optional[str] = Query(None),
    author_id: Optional[int] = Query(None),
    sort: str = Query("created_at", description="created_at|published_at|views|likes"),
    order: str = Query("desc", description="asc|desc"),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ giáo viên và admin mới có thể xem tin quản trị",
        )

    query = db.query(NewsPost)

    # Permission scoping: teacher sees only own
    if current_user.role == UserRole.TEACHER:
        query = query.filter(NewsPost.author_id == current_user.id)
    else:
        # Admin can filter by author_id if provided
        if author_id is not None:
            query = query.filter(NewsPost.author_id == author_id)

    # Filters
    if status_filter:
        query = query.filter(NewsPost.status == status_filter)
    if category and category != "all":
        query = query.filter(NewsPost.category == category)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                NewsPost.title.ilike(like),
                NewsPost.description.ilike(like),
                NewsPost.content.ilike(like),
            )
        )

    total = query.count()

    # Sorting
    sort_map = {
        "created_at": NewsPost.created_at,
        "published_at": NewsPost.published_at,
        "views": NewsPost.views,
        "likes": NewsPost.likes,
    }
    sort_col = sort_map.get(sort, NewsPost.created_at)
    order_by = desc(sort_col) if order.lower() == "desc" else asc(sort_col)

    rows = (
        query.order_by(order_by)
        .offset(max(0, int(skip)))
        .limit(max(1, min(int(limit), 200)))
        .all()
    )

    items: List[dict] = []
    for news in rows:
        author = db.query(User).filter(User.id == news.author_id).first() if news.author_id else None
        items.append(
            {
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
                "author_name": author.full_name if author else "Unknown",
                "author_id": news.author_id,
                "published_at": news.published_at,
                "created_at": news.created_at,
                "updated_at": news.updated_at,
            }
        )

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# ===================== Status update =====================

@router.patch("/{news_id}/status", response_model=NewsPostResponse)
async def update_news_status(
    news_id: int,
    payload: NewsStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    news = db.query(NewsPost).filter(NewsPost.id == news_id).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin tức")

    # Permission: author or admin/superadmin
    if news.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền sửa tin tức này")

    status_value = payload.status.strip().lower()
    if status_value not in {"draft", "published", "archived"}:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")

    news.status = status_value
    if status_value == "published" and news.published_at is None:
        news.published_at = datetime.now()
    if status_value in {"draft", "archived"} and news.published_at is not None:
        # Optional: clear published_at when moving out of published
        news.published_at = None

    db.commit()
    db.refresh(news)
    return news


# ===================== Image upload =====================

@router.post("/upload-image")
async def upload_news_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Chỉ giáo viên và admin được phép upload ảnh")

    allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"}
    if not file.content_type or file.content_type.lower() not in allowed_types:
        raise HTTPException(status_code=400, detail="Định dạng ảnh không hỗ trợ")

    content = await file.read()
    max_bytes = 5 * 1024 * 1024  # 5MB
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="Kích thước ảnh vượt quá 5MB")

    # Ensure media/news directory
    media_dir = Path("media") / "news"
    media_dir.mkdir(parents=True, exist_ok=True)

    # Compute filename
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        # derive from content-type
        ct_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        }
        ext = ct_map.get((file.content_type or "").lower(), ".jpg")
    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = media_dir / filename

    with open(out_path, "wb") as f:
        f.write(content)

    # Return public URL mounted at /media
    return {"url": f"/media/news/{filename}"}


# ===================== Like / Unlike =====================

@router.post("/{news_id}/like")
async def like_news(
    news_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Increase like counter by 1. Requires authenticated user.
    Note: This simple counter does not track per-user likes.
    """
    news = db.query(NewsPost).filter(NewsPost.id == news_id, NewsPost.status == "published").first()
    if not news:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tức")

    existed = db.query(NewsLike).filter(NewsLike.news_id == news_id, NewsLike.user_id == current_user.id).first()
    if not existed:
        db.add(NewsLike(news_id=news_id, user_id=current_user.id))
        try:
            db.commit()
        except Exception:
            db.rollback()
    count = db.query(func.count()).select_from(NewsLike).filter(NewsLike.news_id == news_id).scalar() or 0
    news.likes = count
    db.commit()
    db.refresh(news)
    return {"likes": news.likes}


@router.delete("/{news_id}/like")
async def unlike_news(
    news_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bỏ thích: xóa like của người dùng nếu có (idempotent)."""
    news = db.query(NewsPost).filter(NewsPost.id == news_id, NewsPost.status == "published").first()
    if not news:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin tức")

    db.query(NewsLike).filter(NewsLike.news_id == news_id, NewsLike.user_id == current_user.id).delete()
    db.commit()

    count = db.query(func.count()).select_from(NewsLike).filter(NewsLike.news_id == news_id).scalar() or 0
    news.likes = count
    db.commit()
    db.refresh(news)
    return {"likes": news.likes}
