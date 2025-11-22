from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class OTP(Base):
    """Model for storing OTP codes"""
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(10), nullable=False)
    purpose = Column(String(50), nullable=False)  # verification, password_reset, etc.
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    user = relationship("User", backref="otps")

    def __repr__(self):
        return f"<OTP(id={self.id}, user_id={self.user_id}, purpose={self.purpose}, is_used={self.is_used})>"
