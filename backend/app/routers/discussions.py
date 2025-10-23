from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.discussion import DiscussionThread, DiscussionPost
from app.schemas.student import (
    DiscussionThreadCreate,
    DiscussionThreadResponse,
    DiscussionPostCreate,
    DiscussionPostResponse,
    DiscussionListResponse
)

router = APIRouter()

@router.get("/", response_model=List[DiscussionListResponse])
async def get_discussions(
    subject: str = None,
    answered: bool = None,
    vip: bool = None,
    search: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách câu hỏi thảo luận
    """
    # Mock data matching frontend expectations
    mock_discussions = [
        {
            "id": 1,
            "title": "Cách giải bài toán phép cộng có nhớ trong phạm vi 100?",
            "content": "Em không hiểu cách làm phép cộng có nhớ, ai có thể giúp em không?",
            "author": "Nguyễn Minh Anh",
            "authorRole": "Học sinh",
            "subject": "Toán",
            "grade": "Lớp 2",
            "tags": ["phép cộng", "có nhớ", "lớp 2"],
            "answers": 3,
            "views": 45,
            "likes": 8,
            "createdAt": "2 giờ trước",
            "isAnswered": True,
            "isVip": False,
            "avatar": "👧"
        },
        {
            "id": 2,
            "title": "Từ vựng tiếng Anh về gia đình",
            "content": "Các bạn có thể chia sẻ từ vựng tiếng Anh về gia đình không?",
            "author": "Trần Thị Hoa",
            "authorRole": "Học sinh",
            "subject": "Tiếng Anh",
            "grade": "Lớp 3",
            "tags": ["từ vựng", "gia đình", "tiếng anh"],
            "answers": 5,
            "views": 78,
            "likes": 12,
            "createdAt": "4 giờ trước",
            "isAnswered": True,
            "isVip": False,
            "avatar": "👩"
        },
        {
            "id": 3,
            "title": "Tại sao lá cây có màu xanh?",
            "content": "Em thắc mắc tại sao lá cây lại có màu xanh, có ai biết giải thích không?",
            "author": "Lê Văn Nam",
            "authorRole": "Học sinh",
            "subject": "Khoa học",
            "grade": "Lớp 4",
            "tags": ["khoa học", "thực vật", "màu sắc"],
            "answers": 2,
            "views": 32,
            "likes": 6,
            "createdAt": "6 giờ trước",
            "isAnswered": False,
            "isVip": True,
            "avatar": "👦"
        }
    ]
    
    # Filter by parameters
    filtered = mock_discussions
    if subject:
        filtered = [d for d in filtered if d["subject"] == subject]
    if answered is not None:
        filtered = [d for d in filtered if d["isAnswered"] == answered]
    if vip is not None:
        filtered = [d for d in filtered if d["isVip"] == vip]
    if search:
        filtered = [d for d in filtered if search.lower() in d["title"].lower() or search.lower() in d["content"].lower()]
    
    return filtered

@router.post("/", response_model=DiscussionThreadResponse)
async def create_discussion(
    thread_data: DiscussionThreadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tạo câu hỏi thảo luận mới
    """
    thread = DiscussionThread(
        title=thread_data.title,
        class_id=thread_data.class_id,
        created_by=current_user.id
    )
    
    db.add(thread)
    db.commit()
    db.refresh(thread)
    
    return {
        "id": thread.id,
        "class_id": thread.class_id,
        "title": thread.title,
        "created_by": thread.created_by,
        "created_at": thread.created_at,
        "post_count": 0,
        "latest_post": None
    }

@router.get("/{thread_id}", response_model=DiscussionThreadResponse)
async def get_discussion(
    thread_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một câu hỏi
    """
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu hỏi"
        )
    
    # Get post count
    post_count = db.query(func.count(DiscussionPost.id)).filter(
        DiscussionPost.thread_id == thread_id
    ).scalar()
    
    # Get latest post
    latest_post = db.query(DiscussionPost).filter(
        DiscussionPost.thread_id == thread_id
    ).order_by(desc(DiscussionPost.created_at)).first()
    
    return {
        "id": thread.id,
        "class_id": thread.class_id,
        "title": thread.title,
        "created_by": thread.created_by,
        "created_at": thread.created_at,
        "post_count": post_count,
        "latest_post": latest_post
    }

@router.get("/{thread_id}/posts", response_model=List[DiscussionPostResponse])
async def get_discussion_posts(
    thread_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách bình luận/trả lời của một câu hỏi
    """
    posts = db.query(DiscussionPost).filter(
        DiscussionPost.thread_id == thread_id
    ).order_by(DiscussionPost.created_at).offset(skip).limit(limit).all()
    
    return posts

@router.post("/{thread_id}/posts", response_model=DiscussionPostResponse)
async def create_discussion_post(
    thread_id: int,
    post_data: DiscussionPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trả lời/Bình luận vào một câu hỏi
    """
    # Check if thread exists
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu hỏi"
        )
    
    # Create post
    post = DiscussionPost(
        thread_id=thread_id,
        author_id=current_user.id,
        content=post_data.content,
        parent_post_id=post_data.parent_post_id
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    return {
        "id": post.id,
        "thread_id": post.thread_id,
        "author_id": post.author_id,
        "content": post.content,
        "parent_post_id": post.parent_post_id,
        "created_at": post.created_at,
        "author_name": current_user.full_name or current_user.username,
        "author_role": current_user.role.value,
        "author_avatar": current_user.avatar_url
    }

@router.delete("/{thread_id}")
async def delete_discussion(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xóa câu hỏi (chỉ người tạo mới có thể xóa)
    """
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu hỏi"
        )
    
    if thread.created_by != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa câu hỏi này"
        )
    
    db.delete(thread)
    db.commit()
    
    return {"message": "Đã xóa câu hỏi thành công"}
