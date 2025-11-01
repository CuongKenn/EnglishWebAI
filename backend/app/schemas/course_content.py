"""
Pydantic schemas for rich course content API
"""
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import json


# ============= READING SCHEMAS =============

class ReadingQuestionBase(BaseModel):
    type: str  # multiple-choice|matching|true-false|short-answer
    instruction: str
    options: Optional[List[str]] = None
    correct_answer: Optional[int] = None
    points: Optional[int] = 1
    order_index: int = 0


class ReadingQuestionCreate(ReadingQuestionBase):
    pass


class ReadingQuestionResponse(ReadingQuestionBase):
    id: int
    paragraph_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReadingParagraphBase(BaseModel):
    paragraph_id: str  # A, B, C, etc.
    heading: Optional[str] = None
    content: str
    order_index: int = 0


class ReadingParagraphCreate(ReadingParagraphBase):
    questions: List[ReadingQuestionCreate] = []


class ReadingParagraphResponse(ReadingParagraphBase):
    id: int
    passage_id: int
    questions: List[ReadingQuestionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ReadingPassageBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_time: Optional[int] = None  # minutes
    total_questions: Optional[int] = None


class ReadingPassageCreate(ReadingPassageBase):
    paragraphs: List[ReadingParagraphCreate] = []


class ReadingPassageUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_time: Optional[int] = None


class ReadingPassageResponse(ReadingPassageBase):
    id: int
    unit_id: int
    paragraphs: List[ReadingParagraphResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= WRITING SCHEMAS =============

class WritingRubricBase(BaseModel):
    category: str  # Content|Grammar|Vocabulary|Organization|Mechanics
    description: str
    max_points: int = 5
    order_index: int = 0


class WritingRubricCreate(WritingRubricBase):
    pass


class WritingRubricResponse(WritingRubricBase):
    id: int
    prompt_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WritingPromptBase(BaseModel):
    title: str
    type: str  # essay|paragraph|letter|email|story|description
    instruction: str
    prompt: str
    additional_instruction: Optional[str] = None
    min_words: Optional[int] = 100
    max_words: Optional[int] = 300
    time_limit: Optional[int] = None
    difficulty: Optional[str] = None
    sample_answer: Optional[str] = None
    hints: Optional[List[str]] = None


class WritingPromptCreate(WritingPromptBase):
    rubrics: List[WritingRubricCreate] = []


class WritingPromptUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    instruction: Optional[str] = None
    prompt: Optional[str] = None
    additional_instruction: Optional[str] = None
    min_words: Optional[int] = None
    max_words: Optional[int] = None
    time_limit: Optional[int] = None
    difficulty: Optional[str] = None
    sample_answer: Optional[str] = None
    hints: Optional[List[str]] = None


class WritingPromptResponse(WritingPromptBase):
    id: int
    unit_id: int
    rubrics: List[WritingRubricResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= LISTENING SCHEMAS =============

class ListeningQuestionBase(BaseModel):
    type: str  # multiple-choice|fill-blank|matching|true-false
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    timestamp: Optional[float] = None
    points: Optional[int] = 1
    order_index: int = 0


class ListeningQuestionCreate(ListeningQuestionBase):
    pass


class ListeningQuestionResponse(ListeningQuestionBase):
    id: int
    audio_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ListeningAudioBase(BaseModel):
    title: str
    description: Optional[str] = None
    audio_url: str
    duration: Optional[int] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    accent: Optional[str] = None
    speed: Optional[str] = None
    transcript: Optional[str] = None
    has_transcript: bool = True
    total_questions: Optional[int] = None


class ListeningAudioCreate(ListeningAudioBase):
    questions: List[ListeningQuestionCreate] = []


class ListeningAudioUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[int] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    accent: Optional[str] = None
    speed: Optional[str] = None
    transcript: Optional[str] = None
    has_transcript: Optional[bool] = None


class ListeningAudioResponse(ListeningAudioBase):
    id: int
    unit_id: int
    questions: List[ListeningQuestionResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= SPEAKING SCHEMAS =============

class SpeakingCriteriaBase(BaseModel):
    category: str  # Fluency|Pronunciation|Vocabulary|Grammar|Coherence
    description: str
    max_points: int = 5
    order_index: int = 0


class SpeakingCriteriaCreate(SpeakingCriteriaBase):
    pass


class SpeakingCriteriaResponse(SpeakingCriteriaBase):
    id: int
    prompt_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SpeakingPromptBase(BaseModel):
    title: str
    type: str  # conversation|presentation|description|roleplay|discussion
    instruction: str
    prompt: str
    context: Optional[str] = None
    preparation_time: Optional[int] = None
    response_time: Optional[int] = None
    difficulty: Optional[str] = None
    sample_response: Optional[str] = None
    sample_audio_url: Optional[str] = None
    tips: Optional[List[str]] = None
    vocabulary: Optional[dict] = None


class SpeakingPromptCreate(SpeakingPromptBase):
    criteria: List[SpeakingCriteriaCreate] = []


class SpeakingPromptUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    instruction: Optional[str] = None
    prompt: Optional[str] = None
    context: Optional[str] = None
    preparation_time: Optional[int] = None
    response_time: Optional[int] = None
    difficulty: Optional[str] = None
    sample_response: Optional[str] = None
    sample_audio_url: Optional[str] = None
    tips: Optional[List[str]] = None
    vocabulary: Optional[dict] = None


class SpeakingPromptResponse(SpeakingPromptBase):
    id: int
    unit_id: int
    criteria: List[SpeakingCriteriaResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

