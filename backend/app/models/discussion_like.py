from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class DiscussionLike(Base):
    __tablename__ = "discussion_likes"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("discussion_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure one user can only like a thread once
    __table_args__ = (
        UniqueConstraint('thread_id', 'user_id', name='unique_thread_user_like'),
    )
