"""
Schemas for AI Speaking Practice and Emotion Detection
"""

from typing import Any

from pydantic import BaseModel, Field

# ============ Emotion Detection Schemas ============


class EmotionAnalyzeRequest(BaseModel):
    """Request to analyze emotion from image"""

    image: str = Field(..., description="Base64 encoded image")


class EmotionAnalyzeResponse(BaseModel):
    """Response from emotion analysis"""

    emotion: str = Field(..., description="Dominant emotion detected")
    confidence: float = Field(..., description="Confidence score (0-1)")
    all_emotions: dict[str, float] = Field(
        default_factory=dict, description="All emotion scores"
    )
    feedback: str = Field(..., description="Feedback message for user")
    icon: str = Field(..., description="Emoji icon representing emotion")
    color: str = Field(..., description="Color code for UI display")
    face_detected: bool = Field(..., description="Whether a face was detected")
    error: str | None = Field(None, description="Error message if any")


class EmotionSessionSummary(BaseModel):
    """Summary of emotions throughout a session"""

    dominant_emotion: str
    average_confidence: float
    emotion_distribution: dict[str, float]
    total_frames: int
    valid_detections: int
    feedback: str
    icon: str


class EmotionLogEntry(BaseModel):
    """Log entry for emotion detection"""

    timestamp: float | None = Field(
        None, description="Timestamp of emotion detection if available"
    )
    emotion: str = Field(..., description="Detected emotion")
    confidence: float = Field(..., description="Confidence score (0-1)")
    all_emotions: dict[str, float] = Field(
        default_factory=dict, description="All emotion scores"
    )
    face_detected: bool = Field(True, description="Whether a face was detected")


# ============ Speaking Practice Schemas ============


class GenerateSpeakingTopicRequest(BaseModel):
    """Request to generate speaking topic"""

    level: str = Field(
        ...,
        description="Speaking level: beginner, intermediate, or advanced",
        pattern="^(beginner|intermediate|advanced)$",
    )
    category: str | None = Field(
        None, description="Topic category (e.g., Travel, Education)"
    )
    duration: int = Field(
        2, description="Duration in minutes (1-5)", ge=1, le=5
    )
    custom_prompt: str | None = Field(
        None, description="Custom instructions for topic generation"
    )


class GenerateSpeakingTopicResponse(BaseModel):
    """Response with generated speaking topic"""

    success: bool
    topic: str
    description: str
    questions: list[str]
    key_vocabulary: list[str]
    tips: list[str]
    level: str
    category: str
    duration: int
    error: str | None = None


class SpeakingGradingRequest(BaseModel):
    """Request to grade speaking performance"""

    audio_url: str = Field(..., description="URL to uploaded audio file")
    transcription: str = Field(..., description="Transcribed text")
    topic: str = Field(..., description="Speaking topic")
    questions: list[str] = Field(..., description="Guiding questions")
    level: str = Field(..., description="Expected level")
    emotion_summary: dict[str, Any] | None = Field(
        None, description="Emotion analysis summary"
    )
    pronunciation_assessment: dict[str, Any] | None = Field(
        None, description="Azure pronunciation assessment result"
    )


class SpeakingScoreDetail(BaseModel):
    """Detailed score for a specific criterion"""

    score: float = Field(..., ge=0, le=25)
    feedback: str


class SpeakingGradingResult(BaseModel):
    """Detailed grading result"""

    overall_score: float = Field(..., ge=0, le=100)
    pronunciation_fluency: SpeakingScoreDetail
    grammar_accuracy: SpeakingScoreDetail
    vocabulary: SpeakingScoreDetail
    content_relevance: SpeakingScoreDetail
    strengths: list[str]
    areas_for_improvement: list[str]
    overall_feedback: str
    suggested_next_steps: list[str]
    emotion_analysis: dict[str, Any] | None = None


class SpeakingGradingResponse(BaseModel):
    """Response from speaking grading"""

    success: bool
    grading: SpeakingGradingResult | dict[str, Any]
    transcription: str | None = None
    audio_url: str | None = None
    error: str | None = None


# ============ Available Options ============


class SpeakingOptionsResponse(BaseModel):
    """Available options for speaking practice"""

    levels: dict[str, str]
    categories: list[str]
    duration_range: dict[str, int]
