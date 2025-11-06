from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    grade = Column(Integer, nullable=False)  # 1..12
    skill = Column(String, nullable=False)   # listening|speaking|reading|writing|vocabulary|grammar
    # Back-compat: some DBs already have a NOT NULL 'category' column
    # Keep it in the model and mirror the same value as 'skill'
    category = Column(String, nullable=True)
    # Back-compat: some DBs have NOT NULL total_cups; keep it with a safe default
    total_cups = Column(Integer, nullable=False, default=0, server_default="0")
    # Back-compat: some DBs have NOT NULL is_premium; include with default
    is_premium = Column(Boolean, nullable=False, default=False, server_default="0")
    level = Column(String, nullable=True)    # Beginner|Intermediate|Advanced...
    is_active = Column(Boolean, server_default="1", nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    exercises = relationship("CourseExercise", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Course(id={self.id}, title={self.title}, grade={self.grade}, skill={self.skill}, category={self.category})>"


class CourseExercise(Base):
    __tablename__ = "course_exercises"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content_json = Column(Text, nullable=True)  # JSON string storing question config
    type = Column(String, default="assignment", nullable=False)  # assignment | quiz
    max_score = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="exercises")
    submissions = relationship("CourseSubmission", back_populates="exercise", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CourseExercise(id={self.id}, title={self.title}, course_id={self.course_id})>"


class CourseSubmission(Base):
    __tablename__ = "course_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("course_exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_text = Column(Text, nullable=True)
    content_url = Column(String, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String, default="submitted", nullable=False)  # submitted | graded | late
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)
    time_spent = Column(Integer, nullable=True)  # Seconds spent on the lesson/test

    # Relationships
    exercise = relationship("CourseExercise", back_populates="submissions")

    def __repr__(self) -> str:
        return f"<CourseSubmission(id={self.id}, exercise_id={self.exercise_id}, student_id={self.student_id})>"


class CourseUnit(Base):
    __tablename__ = "course_units"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    week_index = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=True)
    unit_type = Column(String, nullable=False, default="lesson", server_default="lesson")  # lesson|quiz|practice
    max_cups = Column(Integer, nullable=False, default=2, server_default="2")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Rich content relationships
    reading_passages = relationship("ReadingPassage", back_populates="unit", cascade="all, delete-orphan")
    writing_prompts = relationship("WritingPrompt", back_populates="unit", cascade="all, delete-orphan")
    listening_audios = relationship("ListeningAudio", back_populates="unit", cascade="all, delete-orphan")
    speaking_prompts = relationship("SpeakingPrompt", back_populates="unit", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CourseUnit(id={self.id}, course_id={self.course_id}, title={self.title})>"


class CourseQuestion(Base):
    __tablename__ = "course_questions"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # mcq|fill-blank|short|mcq-audio|dictation|prompt|essay
    prompt = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)
    answer_json = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    points = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<CourseQuestion(id={self.id}, unit_id={self.unit_id}, type={self.type})>"
