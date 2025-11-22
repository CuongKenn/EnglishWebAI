"""
ChatBot Router - Gemini AI Integration
Provides chatbot functionality using Google Gemini API
"""

import logging

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Gemini API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not configured")


class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[Message] | None = []


class ChatResponse(BaseModel):
    message: str
    conversation_id: str | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Chat with the AI assistant using Gemini API
    """
    try:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Chatbot service is not configured. Please contact administrator."
            )

        # Initialize the model
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        # Build conversation context
        context = """You are an AI assistant for EnglishWebAI, an English learning platform.
Your role is to:
- Help students with English learning questions
- Provide grammar explanations
- Assist with vocabulary
- Help with pronunciation tips
- Answer questions about the platform
- Be friendly, encouraging, and supportive

Always respond in a clear, educational manner. If asked about topics outside English learning,
politely redirect the conversation back to English education."""

        # Build conversation history for context
        conversation_text = context + "\n\n"
        if request.conversation_history:
            for msg in request.conversation_history[-10:]:  # Last 10 messages for context
                conversation_text += f"{msg.role.title()}: {msg.content}\n"

        conversation_text += f"User: {request.message}\nAssistant:"

        # Generate response
        response = model.generate_content(conversation_text)

        if not response or not response.text:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate response from AI"
            )

        return ChatResponse(
            message=response.text.strip(),
            conversation_id=None  # Can implement conversation tracking later
        )

    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        ) from None


@router.get("/chat/health")
async def chatbot_health():
    """
    Check if chatbot service is available
    """
    return {
        "status": "healthy" if settings.GEMINI_API_KEY else "unavailable",
        "model": settings.GEMINI_MODEL,
        "configured": bool(settings.GEMINI_API_KEY)
    }
