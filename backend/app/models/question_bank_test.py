from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QuestionBankTest(Base):
    __tablename__ = "question_bank_tests"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    name = Column(String(255), nullable=False)
    time_limit = Column(Integer, nullable=True)
    total_points = Column(Integer, nullable=True)
    skill_distribution_json = Column(Text, nullable=True)
    questions_json = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", backref="question_bank_tests")

