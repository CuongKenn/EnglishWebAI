"""
Pydantic schemas for rich course content API
"""
from datetime import datetime

from pydantic import BaseModel

# ============= READING SCHEMAS =============

class ReadingQuestionBase(BaseModel):
    type: str  # multiple-choice|matching|true-false|short-answer
    instruction: str
    options: list[str] | None = None
    correct_answer: int | None = None
    points: int | None = 1
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
    heading: str | None = None
    content: str
    order_index: int = 0


class ReadingParagraphCreate(ReadingParagraphBase):
    questions: list[ReadingQuestionCreate] = []


class ReadingParagraphResponse(ReadingParagraphBase):
    id: int
    passage_id: int
    questions: list[ReadingQuestionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ReadingPassageBase(BaseModel):
    title: str
    subtitle: str | None = None
    difficulty: str | None = None
    estimated_time: int | None = None  # minutes
    total_questions: int | None = None


class ReadingPassageCreate(ReadingPassageBase):
    paragraphs: list[ReadingParagraphCreate] = []


class ReadingPassageUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    difficulty: str | None = None
    estimated_time: int | None = None


class ReadingPassageResponse(ReadingPassageBase):
    id: int
    unit_id: int
    paragraphs: list[ReadingParagraphResponse] = []
    created_at: datetime
    updated_at: datetime | None

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
    additional_instruction: str | None = None
    min_words: int | None = 100
    max_words: int | None = 300
    time_limit: int | None = None
    difficulty: str | None = None
    sample_answer: str | None = None
    hints: list[str] | None = None


class WritingPromptCreate(WritingPromptBase):
    rubrics: list[WritingRubricCreate] = []


class WritingPromptUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    instruction: str | None = None
    prompt: str | None = None
    additional_instruction: str | None = None
    min_words: int | None = None
    max_words: int | None = None
    time_limit: int | None = None
    difficulty: str | None = None
    sample_answer: str | None = None
    hints: list[str] | None = None


class WritingPromptResponse(WritingPromptBase):
    id: int
    unit_id: int
    rubrics: list[WritingRubricResponse] = []
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


# ============= LISTENING SCHEMAS =============

class ListeningQuestionBase(BaseModel):
    type: str  # multiple-choice|fill-blank|matching|true-false
    question_text: str
    options: list[str] | None = None
    correct_answer: str | None = None
    explanation: str | None = None
    timestamp: float | None = None
    points: int | None = 1
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
    description: str | None = None
    audio_url: str
    duration: int | None = None
    difficulty: str | None = None
    topic: str | None = None
    accent: str | None = None
    speed: str | None = None
    transcript: str | None = None
    has_transcript: bool = True
    total_questions: int | None = None


class ListeningAudioCreate(ListeningAudioBase):
    questions: list[ListeningQuestionCreate] = []


class ListeningAudioUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    audio_url: str | None = None
    duration: int | None = None
    difficulty: str | None = None
    topic: str | None = None
    accent: str | None = None
    speed: str | None = None
    transcript: str | None = None
    has_transcript: bool | None = None


class ListeningAudioResponse(ListeningAudioBase):
    id: int
    unit_id: int
    questions: list[ListeningQuestionResponse] = []
    created_at: datetime
    updated_at: datetime | None

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
    context: str | None = None
    preparation_time: int | None = None
    response_time: int | None = None
    difficulty: str | None = None
    sample_response: str | None = None
    sample_audio_url: str | None = None
    tips: list[str] | None = None
    vocabulary: dict | None = None


class SpeakingPromptCreate(SpeakingPromptBase):
    criteria: list[SpeakingCriteriaCreate] = []


class SpeakingPromptUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    instruction: str | None = None
    prompt: str | None = None
    context: str | None = None
    preparation_time: int | None = None
    response_time: int | None = None
    difficulty: str | None = None
    sample_response: str | None = None
    sample_audio_url: str | None = None
    tips: list[str] | None = None
    vocabulary: dict | None = None


class SpeakingPromptResponse(SpeakingPromptBase):
    id: int
    unit_id: int
    criteria: list[SpeakingCriteriaResponse] = []
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

