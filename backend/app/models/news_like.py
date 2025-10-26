from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class NewsLike(Base):
    __tablename__ = "news_likes"

    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('news_id', 'user_id', name='unique_news_user_like'),
    )

