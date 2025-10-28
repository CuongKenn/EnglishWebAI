from typing import List, Optional, Literal, Any
from pydantic import BaseModel, Field


SkillType = Literal["listening", "speaking", "reading", "writing"]
QuestionType = Literal["multiple_choice", "fill_blank", "true_false", "short_answer", "task"]
Difficulty = Literal["easy", "medium", "hard"]


class QuestionBankBase(BaseModel):
    skill_type: SkillType
    question_type: QuestionType
    difficulty: Difficulty = "medium"
    topic: Optional[str] = None
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[Any] = None
    acceptable_answers: Optional[List[str]] = None
    media_url: Optional[str] = None
    transcript: Optional[str] = None
    passage_text: Optional[str] = None
    passage_url: Optional[str] = None
    writing_type: Optional[str] = None
    word_limit_min: Optional[int] = None
    word_limit_max: Optional[int] = None
    requirements: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    points: Optional[int] = 1


class QuestionBankCreate(QuestionBankBase):
    pass


class QuestionBankUpdate(BaseModel):
    skill_type: Optional[SkillType] = None
    question_type: Optional[QuestionType] = None
    difficulty: Optional[Difficulty] = None
    topic: Optional[str] = None
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[Any] = None
    acceptable_answers: Optional[List[str]] = None
    media_url: Optional[str] = None
    transcript: Optional[str] = None
    passage_text: Optional[str] = None
    passage_url: Optional[str] = None
    writing_type: Optional[str] = None
    word_limit_min: Optional[int] = None
    word_limit_max: Optional[int] = None
    requirements: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    points: Optional[int] = None
    times_used: Optional[int] = None


class QuestionBankItemOut(QuestionBankBase):
    id: int
    times_used: Optional[int] = 0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionBankListResponse(BaseModel):
    items: List[QuestionBankItemOut]
    total: int


class ImportResult(BaseModel):
    imported: int
    failed: int
    errors: List[str] = Field(default_factory=list)


class GenerateTestConfig(BaseModel):
    testName: Optional[str] = None
    totalQuestions: int = 10
    timeLimit: int = 60
    skillDistribution: dict = Field(default_factory=lambda: {"listening": 25, "speaking": 25, "reading": 25, "writing": 25})
    topics: Optional[List[str]] = None
    difficultyDistribution: Optional[dict] = None
    aiOnly: Optional[bool] = True
    avoidDuplicates: Optional[bool] = True  # Try to avoid duplicates vs bank
    maxAIAttempts: Optional[int] = 5       # Retry AI up to N times to reach targets


class GeneratedTestQuestion(BaseModel):
    question_text: str
    question_type: QuestionType
    skill_type: SkillType
    options: Optional[List[str]] = None
    correct_answer: Optional[Any] = None
    difficulty: Difficulty = "medium"
    topic: Optional[str] = None
    tags: Optional[List[str]] = None
    points: int = 1
    # Optional rich fields for certain skills
    transcript: Optional[str] = None  # For listening
    passage_text: Optional[str] = None  # For reading


class GeneratedTestResponse(BaseModel):
    name: str
    questions: List[GeneratedTestQuestion]
    timeLimit: int
    totalPoints: int
    skillDistribution: dict
    createdAt: str


class ExportDocxRequest(BaseModel):
    name: str
    timeLimit: Optional[int] = None
    totalPoints: Optional[int] = None
    questions: List[GeneratedTestQuestion]


class SaveFromTestRequest(BaseModel):
    name: Optional[str] = None
    timeLimit: Optional[int] = None
    totalPoints: Optional[int] = None
    # Accept any question shape to avoid 422; router will coerce
    questions: List[Any]
