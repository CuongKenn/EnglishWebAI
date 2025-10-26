"""
AI Writing Router
Handles AI-powered writing check and feedback
"""

from fastapi import APIRouter, Depends
from app.schemas.ai_writing import (
    WritingCheckRequest, 
    WritingCheckResponse,
    WritingTopicRequest,
    WritingTopicResponse
)
from app.services.gemini_service import gemini_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/ai/writing")


@router.post("/check", response_model=WritingCheckResponse)
async def check_writing(
    request: WritingCheckRequest,
    current_user: User = Depends(get_current_user)
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
    # Get feedback from Gemini
    feedback = await gemini_service.check_writing(
        text=request.text,
        writing_type=request.writing_type,
        level=request.level
    )
    
    return WritingCheckResponse(**feedback)


@router.post("/generate-topic", response_model=WritingTopicResponse)
async def generate_topic(
    request: WritingTopicRequest,
    current_user: User = Depends(get_current_user)
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
    # Generate topic from Gemini
    topic_data = await gemini_service.generate_writing_topic(
        writing_type=request.writing_type,
        level=request.level
    )
    
    return WritingTopicResponse(**topic_data)
