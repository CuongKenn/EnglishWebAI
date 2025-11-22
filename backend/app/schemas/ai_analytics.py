from typing import Any, Literal

from pydantic import BaseModel, Field

AI_FEATURES = Literal[
    "translate",
    "conversation",
    "listening",
    "writing",
    "reading",
    "flashcard",
]


class AIUsageCreate(BaseModel):
    feature: AI_FEATURES
    metadata: dict[str, Any] | None = None


class RequestsByDayItem(BaseModel):
    date: str
    count: int


class AIAnalyticsResponse(BaseModel):
    totalRequests: int = Field(..., ge=0)
    requestsByFeature: dict[str, int]
    requestsByDay: list[RequestsByDayItem]
    activeUsers: int = Field(..., ge=0)


class TimeRange(BaseModel):
    range: Literal["7d", "30d", "90d"] = "30d"

