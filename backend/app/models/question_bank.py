from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QuestionBankItem(Base):
    __tablename__ = "question_bank_items"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    # Core categorization
    skill_type = Column(String(32), index=True)  # listening|speaking|reading|writing
    question_type = Column(String(32), index=True)  # multiple_choice|fill_blank|true_false|short_answer|task
    difficulty = Column(String(16), index=True)  # easy|medium|hard
    topic = Column(String(128), nullable=True)

    # Content fields
    question_text = Column(Text, nullable=True)
    options_json = Column(Text, nullable=True)  # JSON list of options
    correct_answer = Column(Text, nullable=True)  # allow string or index stored as str
    acceptable_answers_json = Column(Text, nullable=True)  # JSON list for fill_blank

    # Media / passages
    media_url = Column(String(512), nullable=True)  # audio or other media
    transcript = Column(Text, nullable=True)
    passage_text = Column(Text, nullable=True)
    passage_url = Column(String(512), nullable=True)

    # Writing specifics
    writing_type = Column(String(32), nullable=True)
    word_limit_min = Column(Integer, nullable=True)
    word_limit_max = Column(Integer, nullable=True)
    requirements_json = Column(Text, nullable=True)  # JSON list

    # Meta
    tags_json = Column(Text, nullable=True)  # JSON list of tags
    points = Column(Integer, nullable=True)
    times_used = Column(Integer, nullable=True, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", backref="question_bank_items")

