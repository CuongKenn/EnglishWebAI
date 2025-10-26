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
    
    async def check_writing(
        self,
        text: str,
        writing_type: str = "general",
        level: str = "intermediate"
    ) -> Dict:
        """
        Check and provide feedback on English writing
        
        Args:
            text: The writing text to check
            writing_type: Type of writing (essay, email, story, etc.)
            level: English level (beginner, intermediate, advanced)
            
        Returns:
            Dict with feedback including grammar, vocabulary, structure scores and suggestions
        """
        try:
            system_prompt = f"""You are an experienced English teacher checking a student's {writing_type} writing.
            The student's level is {level}.
            
            Analyze the writing and provide detailed feedback in JSON format with the following structure:
            {{
                "overall_score": <number 0-100>,
                "grammar_score": <number 0-100>,
                "vocabulary_score": <number 0-100>,
                "structure_score": <number 0-100>,
                "coherence_score": <number 0-100>,
                "grammar_errors": [
                    {{"error": "original text", "correction": "corrected text", "explanation": "why it's wrong"}}
                ],
                "vocabulary_suggestions": [
                    {{"original": "simple word", "suggestion": "better word", "reason": "why it's better"}}
                ],
                "strengths": ["strength 1", "strength 2"],
                "improvements": ["suggestion 1", "suggestion 2"],
                "corrected_text": "full corrected version of the text",
                "overall_comment": "encouraging feedback for the student"
            }}
            
            Be constructive, encouraging, and specific in your feedback."""
            
            prompt = f"{system_prompt}\n\nStudent's writing:\n{text}"
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Try to parse JSON from response
            import json
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            feedback = json.loads(result_text)
            return feedback
            
        except Exception as e:
            print(f"Error checking writing: {str(e)}")
            # Return fallback response
            return {
                "overall_score": 70,
                "grammar_score": 70,
                "vocabulary_score": 70,
                "structure_score": 70,
                "coherence_score": 70,
                "grammar_errors": [],
                "vocabulary_suggestions": [],
                "strengths": ["You're making a great effort!"],
                "improvements": ["Keep practicing regularly"],
                "corrected_text": text,
                "overall_comment": "I'm having trouble analyzing your writing right now. Please try again in a moment."
            }
    
    async def generate_writing_topic(
        self,
        writing_type: str = "general",
        level: str = "intermediate"
    ) -> Dict:
        """
        Generate a writing topic/prompt based on type and level
        
        Args:
            writing_type: Type of writing (essay, email, story, etc.)
            level: English level (beginner, intermediate, advanced)
            
        Returns:
            Dict with topic, prompt, and guidelines
        """
        try:
            level_guidelines = {
                "beginner": "simple vocabulary, basic grammar structures, 100-150 words",
                "intermediate": "varied vocabulary, compound sentences, 200-250 words",
                "advanced": "sophisticated vocabulary, complex structures, 300-400 words"
            }
            
            type_instructions = {
                "essay": "an argumentative or opinion essay topic",
                "email": "a formal or informal email scenario",
                "letter": "a formal or personal letter scenario",
                "story": "a creative story prompt",
                "article": "an article topic for publication",
                "general": "a general writing topic"
            }
            
            guideline = level_guidelines.get(level, level_guidelines["intermediate"])
            type_inst = type_instructions.get(writing_type, type_instructions["general"])
            
            prompt = f"""Generate a {level} level English writing prompt for {type_inst}.

Return a JSON object with this structure:
{{
    "title": "Short catchy title",
    "prompt": "Detailed writing instructions/question",
    "word_count": "recommended word count range",
    "tips": ["tip 1", "tip 2", "tip 3"]
}}

The topic should:
- Be appropriate for {level} level ({guideline})
- Be interesting and relevant to modern life
- Provide clear instructions
- Encourage creative or critical thinking

Type: {writing_type}
Level: {level}"""
            
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Try to parse JSON from response
            import json
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            topic_data = json.loads(result_text)
            return topic_data
            
        except Exception as e:
            print(f"Error generating topic: {str(e)}")
            # Return fallback topic based on type and level
            fallback_topics = {
                "essay": {
                    "beginner": {
                        "title": "My Favorite Hobby",
                        "prompt": "Write about your favorite hobby. Explain what it is, why you like it, and how often you do it.",
                        "word_count": "100-150 words",
                        "tips": ["Use simple present tense", "Give specific examples", "Explain your feelings"]
                    },
                    "intermediate": {
                        "title": "Technology in Education",
                        "prompt": "Do you think technology has a positive or negative impact on education? Give your opinion with reasons and examples.",
                        "word_count": "200-250 words",
                        "tips": ["State your opinion clearly", "Give at least 2 reasons", "Use linking words"]
                    },
                    "advanced": {
                        "title": "The Future of Work",
                        "prompt": "How do you think artificial intelligence will change the nature of work in the next decade? Discuss both opportunities and challenges.",
                        "word_count": "300-400 words",
                        "tips": ["Analyze both sides", "Use academic vocabulary", "Provide concrete examples"]
                    }
                },
                "email": {
                    "beginner": {
                        "title": "Email to a Friend",
                        "prompt": "Write an email to your friend inviting them to your birthday party. Include the date, time, and place.",
                        "word_count": "80-120 words",
                        "tips": ["Use friendly tone", "Include all details", "End with a nice closing"]
                    },
                    "intermediate": {
                        "title": "Job Application Email",
                        "prompt": "Write an email applying for a part-time job at a local bookstore. Introduce yourself and explain why you're interested.",
                        "word_count": "150-200 words",
                        "tips": ["Use formal language", "Be polite and professional", "Highlight your strengths"]
                    },
                    "advanced": {
                        "title": "Business Proposal Email",
                        "prompt": "Write an email to a potential business partner proposing a collaboration. Explain the benefits and suggest next steps.",
                        "word_count": "250-300 words",
                        "tips": ["Be professional and persuasive", "Use business terminology", "Include clear call-to-action"]
                    }
                }
            }
            
            # Get fallback or default
            type_fallbacks = fallback_topics.get(writing_type, fallback_topics["essay"])
            return type_fallbacks.get(level, type_fallbacks["intermediate"])


# Create a singleton instance
gemini_service = GeminiService()
