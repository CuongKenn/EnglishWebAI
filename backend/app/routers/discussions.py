from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.discussion import DiscussionThread, DiscussionPost
from app.models.discussion_like import DiscussionLike
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách câu hỏi thảo luận từ database
    """
    # Query discussions from database
    query = db.query(DiscussionThread)
    
    # Apply filters
    if search:
        query = query.filter(DiscussionThread.title.ilike(f"%{search}%"))
    
    # Order by created_at desc and apply pagination
    threads = query.order_by(desc(DiscussionThread.created_at)).offset(skip).limit(limit).all()
    
    # Format response with user and post count
    result = []
    for thread in threads:
        # Get post count (answers)
        post_count = db.query(func.count(DiscussionPost.id)).filter(
            DiscussionPost.thread_id == thread.id
        ).scalar() or 0
        
        # Get creator info
        creator = db.query(User).filter(User.id == thread.created_by).first()
        
        # Get class info if available
        from app.models.classroom import Classroom
        classroom = None
        if thread.class_id:
            classroom = db.query(Classroom).filter(Classroom.id == thread.class_id).first()
        
        # Get real like count
        like_count = db.query(func.count(DiscussionLike.id)).filter(
            DiscussionLike.thread_id == thread.id
        ).scalar() or 0
        
        # Check if current user liked this thread
        user_liked = False
        if current_user:
            user_liked = db.query(DiscussionLike).filter(
                DiscussionLike.thread_id == thread.id,
                DiscussionLike.user_id == current_user.id
            ).first() is not None
        
        result.append({
            "id": thread.id,
            "title": thread.title,
            "content": "",  # Not stored in thread, only in posts
            "author": creator.full_name or creator.username if creator else "Unknown",
            "authorUsername": creator.username if creator else "Unknown",  # For comparison in frontend
            "authorRole": creator.role.value if creator else "user",
            "subject": classroom.subject if classroom else "Chung",
            "grade": classroom.name if classroom else "",
            "tags": [],  # Can be added later if needed
            "answers": post_count,
            "views": 0,  # Can be added later with a views tracking system
            "likes": like_count,
            "isLiked": user_liked,  # Flag to check if current user liked
            "createdAt": thread.created_at.strftime("%Y-%m-%d %H:%M") if thread.created_at else "",
            "isAnswered": post_count > 0,
            "isVip": False,  # Can be added later
            "avatar": "👤"
        })
    
    return result

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
    
    # Format response with author info
    result = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        result.append({
            "id": post.id,
            "thread_id": post.thread_id,
            "author_id": post.author_id,
            "content": post.content,
            "parent_post_id": post.parent_post_id,
            "created_at": post.created_at,
            "author_name": author.full_name or author.username if author else "Unknown",
            "author_role": author.role.value if author else "user",
            "author_avatar": author.avatar_url if author else None
        })
    
    return result

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

@router.post("/{thread_id}/like")
async def like_discussion(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Like một câu hỏi
    """
    # Check if thread exists
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu hỏi"
        )
    
    # Check if already liked
    existing_like = db.query(DiscussionLike).filter(
        DiscussionLike.thread_id == thread_id,
        DiscussionLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã thích câu hỏi này rồi"
        )
    
    # Create like
    like = DiscussionLike(
        thread_id=thread_id,
        user_id=current_user.id
    )
    
    db.add(like)
    db.commit()
    
    # Get total likes
    total_likes = db.query(func.count(DiscussionLike.id)).filter(
        DiscussionLike.thread_id == thread_id
    ).scalar()
    
    return {
        "message": "Đã thích câu hỏi",
        "likes": total_likes
    }

@router.delete("/{thread_id}/like")
async def unlike_discussion(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlike một câu hỏi
    """
    # Check if like exists
    existing_like = db.query(DiscussionLike).filter(
        DiscussionLike.thread_id == thread_id,
        DiscussionLike.user_id == current_user.id
    ).first()
    
    if not existing_like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bạn chưa thích câu hỏi này"
        )
    
    db.delete(existing_like)
    db.commit()
    
    # Get total likes
    total_likes = db.query(func.count(DiscussionLike.id)).filter(
        DiscussionLike.thread_id == thread_id
    ).scalar()
    
    return {
        "message": "Đã bỏ thích câu hỏi",
        "likes": total_likes
    }
