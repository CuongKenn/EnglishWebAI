"""
AI Writing Router
Handles AI-powered writing check and feedback
"""

import contextlib

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_writing import WritingCheckRequest, WritingCheckResponse, WritingTopicRequest, WritingTopicResponse
from app.services.ai_analytics_service import AIAnalyticsService
from app.services.openai_service import openai_service

router = APIRouter(prefix="/api/v1/ai/writing")


@router.post("/check", response_model=WritingCheckResponse)
async def check_writing(
    request: WritingCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check English writing and provide detailed feedback

    Requires authentication.

    Args:
        request: Writing check request with text, type, and level
        current_user: Current authenticated user

    Returns:
        Detailed feedback including scores, errors, and suggestions
    """
    # Get feedback from OpenAI
    feedback = await openai_service.check_writing(
        text=request.text,
        writing_type=request.writing_type,
        level=request.level
    )
    # Log usage (non-blocking)
    with contextlib.suppress(Exception):
        AIAnalyticsService.log_usage(db, user_id=current_user.id, feature="writing", metadata={"action": "check", "writing_type": request.writing_type, "level": request.level})

    return WritingCheckResponse(**feedback)


@router.post("/generate-topic", response_model=WritingTopicResponse)
async def generate_topic(
    request: WritingTopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a writing topic/prompt based on type and level

    Requires authentication.

    Args:
        request: Topic generation request with type and level
        current_user: Current authenticated user

    Returns:
        Generated topic with title, prompt, word count, and tips
    """
    # Generate topic from OpenAI
    topic_data = await openai_service.generate_writing_topic(
        writing_type=request.writing_type,
        level=request.level
    )
    # Log usage (non-blocking)
    with contextlib.suppress(Exception):
        AIAnalyticsService.log_usage(db, user_id=current_user.id, feature="writing", metadata={"action": "generate_topic", "writing_type": request.writing_type, "level": request.level})

    return WritingTopicResponse(**topic_data)
