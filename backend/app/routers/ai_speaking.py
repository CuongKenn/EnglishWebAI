"""
AI Speaking Practice Router
Handles speaking topic generation and grading
Note: Emotion detection now runs locally in frontend using face-api.js
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_speaking import (
    GenerateSpeakingTopicRequest,
    GenerateSpeakingTopicResponse,
    SpeakingGradingRequest,
    SpeakingGradingResponse,
    SpeakingOptionsResponse,
)
from app.services.ai_speaking_service import AISpeakingService
from app.services.azure_speech_service import AzureSpeechService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai/speaking", tags=["AI Speaking"])

# Initialize services
speaking_service = AISpeakingService()
azure_speech_service = AzureSpeechService()


@router.get("/options", response_model=SpeakingOptionsResponse)
async def get_speaking_options(
    current_user: User = Depends(get_current_user),
):
    """
    Get available options for speaking practice

    Returns available levels, categories, and duration range
    """
    return SpeakingOptionsResponse(
        levels=AISpeakingService.LEVELS,
        categories=AISpeakingService.TOPIC_CATEGORIES,
        duration_range={"min": 1, "max": 5},
    )


@router.post("/generate-topic", response_model=GenerateSpeakingTopicResponse)
async def generate_speaking_topic(
    request: GenerateSpeakingTopicRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate speaking topic based on user preferences

    AI will create a customized speaking topic with questions,
    vocabulary suggestions, and tips based on level and category
    """
    try:
        result = await speaking_service.generate_speaking_topic(
            level=request.level,
            category=request.category,
            duration=request.duration,
            custom_prompt=request.custom_prompt,
        )
        return result

    except Exception as e:
        logger.error(f"Error generating speaking topic: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate speaking topic: {str(e)}",
        )


@router.post("/grade", response_model=SpeakingGradingResponse)
async def grade_speaking(
    request: SpeakingGradingRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Grade speaking performance using Azure Speech + OpenAI

    Provides detailed feedback on:
    - Pronunciation & Fluency
    - Grammar & Accuracy
    - Vocabulary Range
    - Content & Relevance
    - Emotion Analysis (if available)
    """
    try:
        result = await speaking_service.grade_speaking(
            audio_url=request.audio_url,
            transcription=request.transcription,
            topic=request.topic,
            questions=request.questions,
            level=request.level,
            emotion_summary=request.emotion_summary,
        )

        # Add pronunciation details if available
        if request.pronunciation_assessment:
            pronunciation_detail = speaking_service.calculate_pronunciation_score(
                request.pronunciation_assessment
            )
            if isinstance(result.get("grading"), dict):
                result["grading"]["pronunciation_detail"] = pronunciation_detail

        return result

    except Exception as e:
        logger.error(f"Error grading speaking: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to grade speaking: {str(e)}",
        )


# ============ Azure Speech Transcription Endpoint ============


@router.post("/transcribe")
async def transcribe_audio(
    audio_path: str,
    language: str = "en-US",
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe audio using Azure Speech Service

    Args:
        audio_path: Path to audio file (relative to media directory)
        language: Language code (default: en-US)

    Returns:
        Transcription text and pronunciation assessment
    """
    try:
        # Convert relative path to absolute path
        from pathlib import Path

        logger.info(f"Transcribe request - audio_path: {audio_path}, language: {language}")

        # Remove /media/ prefix properly (not using lstrip which removes chars, not prefix)
        if audio_path.startswith("/media/"):
            audio_path = audio_path[7:]  # Remove "/media/"
        elif audio_path.startswith("media/"):
            audio_path = audio_path[6:]  # Remove "media/"

        full_path = Path("./media") / audio_path
        logger.info(f"Resolved full path: {full_path}, exists: {full_path.exists()}")

        if not full_path.exists():
            logger.error(f"Audio file not found at: {full_path}")
            raise HTTPException(
                status_code=404,
                detail=f"Audio file not found: {audio_path}",
            )

        # Transcribe using Azure Speech (spontaneous speech - no reference text)
        result = azure_speech_service.transcribe_audio(
            audio_file_path=str(full_path),
            language=language,
        )

        if not result.get("success", False):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Transcription failed"),
            )

        return {
            "success": True,
            "transcription": result.get("transcription", ""),
            "pronunciation_assessment": result.get("pronunciation_assessment"),
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transcribe audio: {str(e)}",
        )



# ============ Emotion Detection Endpoints ============
# DEPRECATED: Emotion detection now runs locally in frontend using face-api.js
# These endpoints are no longer used but kept for backward compatibility

