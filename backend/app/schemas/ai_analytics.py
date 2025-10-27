from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal, Any


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
    metadata: Optional[Dict[str, Any]] = None


class RequestsByDayItem(BaseModel):
    date: str
    count: int


class AIAnalyticsResponse(BaseModel):
    totalRequests: int = Field(..., ge=0)
    requestsByFeature: Dict[str, int]
    requestsByDay: List[RequestsByDayItem]
    activeUsers: int = Field(..., ge=0)


class TimeRange(BaseModel):
    range: Literal["7d", "30d", "90d"] = "30d"

