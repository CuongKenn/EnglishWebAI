"""
Gemini AI Service
Handles interactions with Google Gemini API for AI conversation
"""

import google.generativeai as genai
from typing import List, Dict
import os
from app.core.config import settings


class GeminiService:
    """Service for handling Gemini AI conversations"""
    
    def __init__(self):
        """Initialize Gemini with API key"""
        api_key = settings.GEMINI_API_KEY if hasattr(settings, 'GEMINI_API_KEY') else os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in settings or environment variables")
        
        model_name = settings.GEMINI_MODEL if hasattr(settings, 'GEMINI_MODEL') else os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
    
    async def chat_conversation(
        self, 
        message: str, 
        chat_history: List[Dict[str, str]] = None,
        system_prompt: str = None
    ) -> str:
        """
        Send a message to Gemini and get a response
        
        Args:
            message: User's message
            chat_history: List of previous messages [{"role": "user/ai", "content": "..."}]
            system_prompt: Optional system instructions for the AI
            
        Returns:
            AI's response text
        """
        try:
            # Build conversation history for Gemini
            if system_prompt is None:
                system_prompt = """You are a friendly English conversation partner. 
                Your role is to help users practice English conversation naturally.
                - Always respond in English
                - Keep responses conversational and engaging
                - Correct grammar mistakes gently
                - Ask follow-up questions to keep the conversation going
                - Be encouraging and supportive"""
            
            # Start a chat session
            chat = self.model.start_chat(history=[])
            
            # Add system context as first message if provided
            if system_prompt:
                chat.send_message(f"[SYSTEM INSTRUCTION]: {system_prompt}")
            
            # Add chat history if exists
            if chat_history:
                for msg in chat_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    if role == "user":
                        chat.send_message(content)
                    # AI messages are already in history, no need to re-send
            
            # Send the current message
            response = chat.send_message(message)
            
            return response.text
            
        except Exception as e:
            # Log error and return a friendly message
            print(f"Gemini API Error: {str(e)}")
            return "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
    
    async def get_conversation_suggestions(self, topic: str = None) -> List[str]:
        """
        Get conversation starter suggestions
        
        Args:
            topic: Optional topic for suggestions
            
        Returns:
            List of conversation starter suggestions
        """
        try:
            prompt = f"""Generate 5 interesting English conversation starters"""
            if topic:
                prompt += f""" about {topic}"""
            prompt += """. Return only the questions, one per line, without numbering."""
            
            response = self.model.generate_content(prompt)
            suggestions = response.text.strip().split('\n')
            
            # Clean up suggestions
            suggestions = [s.strip() for s in suggestions if s.strip()]
            
            return suggestions[:5]  # Return max 5 suggestions
            
        except Exception as e:
            print(f"Error generating suggestions: {str(e)}")
            return [
                "What did you do today?",
                "What are your hobbies?",
                "Tell me about your favorite book or movie.",
                "What's your dream vacation destination?",
                "What do you like to do in your free time?"
            ]


# Create a singleton instance
gemini_service = GeminiService()
