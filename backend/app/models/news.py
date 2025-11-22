from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class NewsPost(Base):
    __tablename__ = "news_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # Short description
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Metadata fields
    category = Column(String, default="Thông báo", nullable=False)
    icon = Column(String, default="📰", nullable=True)
    type = Column(String, default="announcement", nullable=False)  # announcement, promotion, tips, guide, event, feature
    image = Column(String, nullable=True)  # URL to image

    # Engagement fields
    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    reading_time = Column(Integer, default=5, nullable=False)  # in minutes

    # Status and dates
    status = Column(String, default="published", nullable=False)  # draft | published | archived
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    def __repr__(self) -> str:
        return f"<NewsPost(id={self.id}, title={self.title})>"
