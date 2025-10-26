"""
AI Conversation Router
Handles AI-powered conversation endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from app.schemas.ai_conversation import (
    ConversationRequest,
    ConversationResponse,
    ConversationSuggestionsRequest,
    ConversationSuggestionsResponse
)
from app.services.gemini_service import gemini_service
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/ai", tags=["AI Conversation"])


@router.post("/conversation", response_model=ConversationResponse)
async def chat_with_ai(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Chat with AI using Gemini
    
    - Requires authentication
    - Returns AI's response to user's message
    """
    try:
        # Convert chat history to dict format
        chat_history = None
        if request.chat_history:
            chat_history = [msg.dict() for msg in request.chat_history]
        
        # Get AI response
        ai_response = await gemini_service.chat_conversation(
            message=request.message,
            chat_history=chat_history,
            system_prompt=request.system_prompt
        )
        
        return ConversationResponse(
            response=ai_response,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get AI response: {str(e)}"
        )


@router.post("/conversation/suggestions", response_model=ConversationSuggestionsResponse)
async def get_conversation_suggestions(
    request: ConversationSuggestionsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get conversation starter suggestions
    
    - Requires authentication
    - Returns list of conversation starters
    """
    try:
        suggestions = await gemini_service.get_conversation_suggestions(
            topic=request.topic
        )
        
        return ConversationSuggestionsResponse(
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get suggestions: {str(e)}"
        )
