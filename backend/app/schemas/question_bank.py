from typing import Any, Literal

from pydantic import BaseModel, Field

SkillType = Literal["listening", "speaking", "reading", "writing"]
QuestionType = Literal["multiple_choice", "fill_blank", "true_false", "short_answer", "task"]
Difficulty = Literal["easy", "medium", "hard"]


class QuestionBankBase(BaseModel):
    skill_type: SkillType
    question_type: QuestionType
    difficulty: Difficulty = "medium"
    topic: str | None = None
    question_text: str | None = None
    options: list[str] | None = None
    correct_answer: Any | None = None
    acceptable_answers: list[str] | None = None
    media_url: str | None = None
    transcript: str | None = None
    passage_text: str | None = None
    passage_url: str | None = None
    writing_type: str | None = None
    word_limit_min: int | None = None
    word_limit_max: int | None = None
    requirements: list[str] | None = None
    tags: list[str] | None = None
    points: int | None = 1


class QuestionBankCreate(QuestionBankBase):
    pass


class QuestionBankUpdate(BaseModel):
    skill_type: SkillType | None = None
    question_type: QuestionType | None = None
    difficulty: Difficulty | None = None
    topic: str | None = None
    question_text: str | None = None
    options: list[str] | None = None
    correct_answer: Any | None = None
    acceptable_answers: list[str] | None = None
    media_url: str | None = None
    transcript: str | None = None
    passage_text: str | None = None
    passage_url: str | None = None
    writing_type: str | None = None
    word_limit_min: int | None = None
    word_limit_max: int | None = None
    requirements: list[str] | None = None
    tags: list[str] | None = None
    points: int | None = None
    times_used: int | None = None


class QuestionBankItemOut(QuestionBankBase):
    id: int
    times_used: int | None = 0
    created_at: str | None = None

    class Config:
        from_attributes = True


class QuestionBankListResponse(BaseModel):
    items: list[QuestionBankItemOut]
    total: int


class ImportResult(BaseModel):
    imported: int
    failed: int
    errors: list[str] = Field(default_factory=list)


class GenerateTestConfig(BaseModel):
    testName: str | None = None
    totalQuestions: int = 10
    timeLimit: int = 60
    skillDistribution: dict = Field(default_factory=lambda: {"listening": 25, "speaking": 25, "reading": 25, "writing": 25})
    topics: list[str] | None = None
    difficultyDistribution: dict | None = None
    aiOnly: bool | None = True
    avoidDuplicates: bool | None = True  # Try to avoid duplicates vs bank
    maxAIAttempts: int | None = 5       # Retry AI up to N times to reach targets


class GeneratedTestQuestion(BaseModel):
    question_text: str
    question_type: QuestionType
    skill_type: SkillType
    options: list[str] | None = None
    correct_answer: Any | None = None
    difficulty: Difficulty = "medium"
    topic: str | None = None
    tags: list[str] | None = None
    points: int = 1
    # Optional rich fields for certain skills
    transcript: str | None = None  # For listening
    passage_text: str | None = None  # For reading


class GeneratedTestResponse(BaseModel):
    name: str
    questions: list[GeneratedTestQuestion]
    timeLimit: int
    totalPoints: int
    skillDistribution: dict
    createdAt: str


class ExportDocxRequest(BaseModel):
    name: str
    timeLimit: int | None = None
    totalPoints: int | None = None
    questions: list[GeneratedTestQuestion]


class SaveFromTestRequest(BaseModel):
    name: str | None = None
    timeLimit: int | None = None
    totalPoints: int | None = None
    # Accept any question shape to avoid 422; router will coerce
    questions: list[Any]
