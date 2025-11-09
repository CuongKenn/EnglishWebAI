from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ReadingLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class ReadingType(str, Enum):
    story = "story"
    article = "article"
    news = "news"
    essay = "essay"
    letter = "letter"


class QuestionFormat(str, Enum):
    multiple_choice = "multiple_choice"  # A/B/C/D
    true_false = "true_false"  # True/False
    fill_blank = "fill_blank"  # Điền từ vào chỗ trống
    short_answer = "short_answer"  # Trả lời ngắn


class Question(BaseModel):
    question: str
    question_format: str = "multiple_choice"  # Format: multiple_choice, true_false, fill_blank
    question_type: str | None = None  # Content type: main_idea, detail, inference, etc.
    options: list[str] | None = None  # For multiple_choice and true_false
    correct_answer: int | str | None = None  # int for MC/TF, str for fill_blank
    acceptable_answers: list[str] | None = None  # For fill_blank - multiple correct answers


class GenerateReadingRequest(BaseModel):
    level: ReadingLevel
    reading_type: ReadingType
    topic: str | None = None

    @field_validator('level')
    @classmethod
    def validate_level(cls, v):
        if v not in [level.value for level in ReadingLevel]:
            raise ValueError('Invalid reading level')
        return v

    @field_validator('reading_type')
    @classmethod
    def validate_type(cls, v):
        if v not in [rt.value for rt in ReadingType]:
            raise ValueError('Invalid reading type')
        return v


class GenerateReadingResponse(BaseModel):
    title: str
    passage: str
    questions: list[Question]
    level: str
    reading_type: str
    word_count: int
    estimated_time: int  # minutes

    @field_validator('word_count', 'estimated_time', mode='before')
    @classmethod
    def convert_to_int(cls, v):
        """Convert float to int by rounding"""
        if isinstance(v, (int, float)):
            return int(round(v))
        return v


class CheckAnswersRequest(BaseModel):
    answers: list[int | str]  # Can be int (for MC/TF) or str (for fill_blank)

    @field_validator('answers')
    @classmethod
    def validate_answers(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Answers cannot be empty')
        if len(v) > 20:
            raise ValueError('Too many answers')
        return v


class AnswerResult(BaseModel):
    question_index: int
    is_correct: bool
    user_answer: int | str
    correct_answer: int | str
    explanation: str
    acceptable_answers: list[str] | None = None  # For fill_blank questions


class CheckAnswersResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    total_questions: int
    correct_answers: int
    results: list[AnswerResult]
    level_recommendation: str | None = None
    feedback: str
