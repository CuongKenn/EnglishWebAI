"""
Schemas for AI Conversation
"""


from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Single chat message"""
    role: str = Field(..., description="Role: 'user' or 'ai'")
    content: str = Field(..., description="Message content")


class ConversationRequest(BaseModel):
    """Request for AI conversation"""
    message: str = Field(..., description="User's message", min_length=1, max_length=1000)
    chat_history: list[ChatMessage] | None = Field(default=None, description="Previous chat history")
    system_prompt: str | None = Field(default=None, description="Custom system prompt")


class ConversationResponse(BaseModel):
    """Response from AI conversation"""
    response: str = Field(..., description="AI's response")
    success: bool = Field(default=True, description="Whether the request was successful")


class ConversationSuggestionsRequest(BaseModel):
    """Request for conversation suggestions"""
    topic: str | None = Field(default=None, description="Topic for suggestions")


class ConversationSuggestionsResponse(BaseModel):
    """Response with conversation suggestions"""
    suggestions: list[str] = Field(..., description="List of conversation starters")
