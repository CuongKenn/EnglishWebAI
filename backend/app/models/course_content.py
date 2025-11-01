"""
Models for rich course content (passages, prompts, audio, etc.)
Supports Reading, Writing, Listening, Speaking with detailed structure
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


# ============= READING CONTENT =============

class ReadingPassage(Base):
    """
    Reading passage with multiple paragraphs
    Used for Reading exercises with comprehension questions
    """
    __tablename__ = "reading_passages"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    subtitle = Column(Text, nullable=True)
    difficulty = Column(String, nullable=True)  # Beginner|Intermediate|Advanced
    estimated_time = Column(Integer, nullable=True)  # minutes
    total_questions = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    unit = relationship("CourseUnit", back_populates="reading_passages")
    paragraphs = relationship("ReadingParagraph", back_populates="passage", cascade="all, delete-orphan", order_by="ReadingParagraph.order_index")

    def __repr__(self):
        return f"<ReadingPassage(id={self.id}, title={self.title}, unit_id={self.unit_id})>"


class ReadingParagraph(Base):
    """
    Individual paragraph within a reading passage
    Each paragraph can have its own heading and questions
    """
    __tablename__ = "reading_paragraphs"

    id = Column(Integer, primary_key=True, index=True)
    passage_id = Column(Integer, ForeignKey("reading_passages.id", ondelete="CASCADE"), nullable=False, index=True)
    paragraph_id = Column(String, nullable=False)  # A, B, C, D, etc.
    heading = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    passage = relationship("ReadingPassage", back_populates="paragraphs")
    questions = relationship("ReadingQuestion", back_populates="paragraph", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReadingParagraph(id={self.id}, paragraph_id={self.paragraph_id}, passage_id={self.passage_id})>"


class ReadingQuestion(Base):
    """
    Question linked to a specific paragraph in a reading passage
    """
    __tablename__ = "reading_questions"

    id = Column(Integer, primary_key=True, index=True)
    paragraph_id = Column(Integer, ForeignKey("reading_paragraphs.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # multiple-choice|matching|true-false|short-answer
    instruction = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)  # JSON array for options
    correct_answer = Column(Integer, nullable=True)  # Index of correct answer
    points = Column(Integer, nullable=True, default=1)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    paragraph = relationship("ReadingParagraph", back_populates="questions")

    def __repr__(self):
        return f"<ReadingQuestion(id={self.id}, type={self.type}, paragraph_id={self.paragraph_id})>"


# ============= WRITING CONTENT =============

class WritingPrompt(Base):
    """
    Writing prompt with detailed instructions and rubric
    """
    __tablename__ = "writing_prompts"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # essay|paragraph|letter|email|story|description
    instruction = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    additional_instruction = Column(Text, nullable=True)
    min_words = Column(Integer, nullable=True, default=100)
    max_words = Column(Integer, nullable=True, default=300)
    time_limit = Column(Integer, nullable=True)  # minutes
    difficulty = Column(String, nullable=True)
    sample_answer = Column(Text, nullable=True)
    hints_json = Column(Text, nullable=True)  # JSON array
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    unit = relationship("CourseUnit", back_populates="writing_prompts")
    rubrics = relationship("WritingRubric", back_populates="prompt", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WritingPrompt(id={self.id}, title={self.title}, type={self.type})>"


class WritingRubric(Base):
    """
    Grading rubric criteria for writing assignments
    """
    __tablename__ = "writing_rubrics"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("writing_prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False)  # Content|Grammar|Vocabulary|Organization|Mechanics
    description = Column(Text, nullable=False)
    max_points = Column(Integer, nullable=False, default=5)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prompt = relationship("WritingPrompt", back_populates="rubrics")

    def __repr__(self):
        return f"<WritingRubric(id={self.id}, category={self.category}, prompt_id={self.prompt_id})>"


# ============= LISTENING CONTENT =============

class ListeningAudio(Base):
    """
    Listening audio with transcript and questions
    """
    __tablename__ = "listening_audios"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    audio_url = Column(String, nullable=False)
    duration = Column(Integer, nullable=True)  # seconds
    difficulty = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    accent = Column(String, nullable=True)  # American|British|Australian|etc
    speed = Column(String, nullable=True)  # slow|normal|fast
    transcript = Column(Text, nullable=True)
    has_transcript = Column(Boolean, nullable=False, default=True)
    total_questions = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    unit = relationship("CourseUnit", back_populates="listening_audios")
    questions = relationship("ListeningQuestion", back_populates="audio", cascade="all, delete-orphan", order_by="ListeningQuestion.order_index")

    def __repr__(self):
        return f"<ListeningAudio(id={self.id}, title={self.title}, unit_id={self.unit_id})>"


class ListeningQuestion(Base):
    """
    Question for listening comprehension
    """
    __tablename__ = "listening_questions"

    id = Column(Integer, primary_key=True, index=True)
    audio_id = Column(Integer, ForeignKey("listening_audios.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # multiple-choice|fill-blank|matching|true-false
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)  # JSON array
    correct_answer = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)
    timestamp = Column(Float, nullable=True)  # When in audio this question relates to (seconds)
    points = Column(Integer, nullable=True, default=1)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    audio = relationship("ListeningAudio", back_populates="questions")

    def __repr__(self):
        return f"<ListeningQuestion(id={self.id}, type={self.type}, audio_id={self.audio_id})>"


# ============= SPEAKING CONTENT =============

class SpeakingPrompt(Base):
    """
    Speaking prompt with instructions and evaluation criteria
    """
    __tablename__ = "speaking_prompts"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # conversation|presentation|description|roleplay|discussion
    instruction = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    preparation_time = Column(Integer, nullable=True)  # seconds
    response_time = Column(Integer, nullable=True)  # seconds
    difficulty = Column(String, nullable=True)
    sample_response = Column(Text, nullable=True)
    sample_audio_url = Column(String, nullable=True)
    tips_json = Column(Text, nullable=True)  # JSON array
    vocabulary_json = Column(Text, nullable=True)  # Key vocabulary JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    unit = relationship("CourseUnit", back_populates="speaking_prompts")
    criteria = relationship("SpeakingCriteria", back_populates="prompt", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SpeakingPrompt(id={self.id}, title={self.title}, type={self.type})>"


class SpeakingCriteria(Base):
    """
    Evaluation criteria for speaking assessments
    """
    __tablename__ = "speaking_criteria"

    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("speaking_prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False)  # Fluency|Pronunciation|Vocabulary|Grammar|Coherence
    description = Column(Text, nullable=False)
    max_points = Column(Integer, nullable=False, default=5)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prompt = relationship("SpeakingPrompt", back_populates="criteria")

    def __repr__(self):
        return f"<SpeakingCriteria(id={self.id}, category={self.category}, prompt_id={self.prompt_id})>"

