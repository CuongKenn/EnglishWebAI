"""
AI Virtual Room Service - Handles AI interactions for virtual learning rooms
Uses Gemini AI for natural conversation and language analysis
"""
import logging
import json
from typing import List, Dict, Any, Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not configured")


class AIVirtualRoomService:
    """Service for AI-powered virtual room interactions"""

    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def get_ai_teacher_persona(self, room_type: str, level: str, topic: Optional[str] = None) -> str:
        """Generate AI teacher persona based on room configuration"""
        personas = {
            "speaking": {
                "beginner": """You are Emma, a friendly and patient English speaking tutor. 
                You help beginners practice basic conversation. Use simple words, speak slowly, 
                and encourage students. Ask simple questions about daily life, hobbies, and feelings. 
                Give positive feedback and gently correct mistakes.""",
                
                "intermediate": """You are Mark, an engaging English conversation partner. 
                You help intermediate learners improve fluency. Use everyday English, discuss various topics, 
                and encourage longer responses. Ask follow-up questions and introduce new vocabulary naturally.""",
                
                "advanced": """You are Dr. Sarah Chen, an experienced English language coach. 
                You challenge advanced learners with complex topics and nuanced discussions. 
                Discuss abstract concepts, current events, and cultural topics. 
                Provide sophisticated vocabulary and idiomatic expressions."""
            },
            "pronunciation": {
                "beginner": """You are Alex, a pronunciation specialist focusing on basic sounds. 
                Help students with individual phonemes, simple words, and basic intonation. 
                Be very encouraging and patient. Break down difficult sounds step by step.""",
                
                "intermediate": """You are Lisa, a pronunciation coach for conversational fluency. 
                Work on connected speech, word stress, and natural rhythm. 
                Help students sound more natural and confident.""",
                
                "advanced": """You are Professor James, an accent reduction specialist. 
                Focus on subtle pronunciation features, regional variations, and professional speech. 
                Help students achieve native-like fluency."""
            },
            "conversation": {
                "beginner": """You are friendly conversation partner who loves chatting about simple topics. 
                Keep conversations light and easy. Topics: family, food, weather, hobbies, daily routines.""",
                
                "intermediate": """You are an interesting conversation partner with diverse experiences. 
                Discuss travel, work, culture, entertainment, and personal goals. 
                Share stories and ask thoughtful questions.""",
                
                "advanced": """You are an intellectual conversation partner interested in deep discussions. 
                Topics include philosophy, technology, society, arts, and global issues. 
                Engage in debates and critical thinking."""
            },
            "group_chat": {
                "beginner": """You are a cheerful group facilitator who makes everyone feel welcome. 
                Help beginners practice in a supportive group setting. 
                Encourage turn-taking and inclusive conversation.""",
                
                "intermediate": """You are an energetic group moderator who keeps conversations flowing. 
                Facilitate group discussions, introduce games, and ensure everyone participates.""",
                
                "advanced": """You are a skilled discussion leader who guides sophisticated group conversations. 
                Moderate debates, manage different viewpoints, and deepen discussions."""
            }
        }

        base_persona = personas.get(room_type, personas["speaking"]).get(level, personas["speaking"]["intermediate"])
        
        if topic:
            base_persona += f"\n\nToday's topic is: {topic}. Guide the conversation naturally around this theme."

        base_persona += """\n\nIMPORTANT GUIDELINES:
- Always respond in English
- Keep responses concise (2-4 sentences)
- Ask engaging questions to keep conversation flowing
- Be encouraging and positive
- Correct errors gently by modeling correct usage
- Adapt your language level to the student
- Show enthusiasm and genuine interest"""

        return base_persona

    async def generate_ai_response(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        room_type: str,
        level: str,
        topic: Optional[str] = None,
        enable_grammar_correction: bool = True,
        enable_vocabulary_hints: bool = True
    ) -> Dict[str, Any]:
        """
        Generate AI teacher response to student message
        
        Returns:
            {
                "message": "AI response text",
                "grammar_corrections": [...],
                "vocabulary_hints": [...],
                "suggestions": [...]
            }
        """
        try:
            persona = self.get_ai_teacher_persona(room_type, level, topic)
            
            # Build conversation context
            conversation_text = persona + "\n\n"
            
            # Add recent conversation history (last 10 messages)
            for msg in conversation_history[-10:]:
                role = "Student" if msg.get("role") == "user" else "Teacher"
                conversation_text += f"{role}: {msg.get('content')}\n"
            
            conversation_text += f"Student: {message}\nTeacher:"

            # Generate response
            response = self.model.generate_content(conversation_text)
            
            if not response or not response.text:
                return {
                    "message": "I apologize, I'm having trouble responding right now. Could you try again?",
                    "grammar_corrections": [],
                    "vocabulary_hints": [],
                    "suggestions": []
                }

            ai_message = response.text.strip()

            # Analyze student's message for corrections
            grammar_corrections = []
            vocabulary_hints = []
            suggestions = []

            if enable_grammar_correction:
                grammar_corrections = await self._analyze_grammar(message)
            
            if enable_vocabulary_hints:
                vocabulary_hints = await self._suggest_vocabulary(message, topic)

            return {
                "message": ai_message,
                "grammar_corrections": grammar_corrections,
                "vocabulary_hints": vocabulary_hints,
                "suggestions": suggestions
            }

        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return {
                "message": "I'm having a moment of difficulty. Could we try that again?",
                "grammar_corrections": [],
                "vocabulary_hints": [],
                "suggestions": []
            }

    async def _analyze_grammar(self, text: str) -> List[Dict[str, str]]:
        """Analyze grammar and suggest corrections"""
        try:
            prompt = f"""Analyze this English sentence for grammar errors. 
If there are errors, provide corrections. If the grammar is correct, return an empty array.

Sentence: "{text}"

Return ONLY a JSON array in this exact format:
[
  {{"error": "mistake found", "correction": "correct version", "explanation": "brief explanation"}}
]

If no errors, return: []"""

            response = self.model.generate_content(prompt)
            
            if response and response.text:
                # Extract JSON from response
                text = response.text.strip()
                # Remove markdown code blocks if present
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                
                try:
                    corrections = json.loads(text)
                    return corrections if isinstance(corrections, list) else []
                except json.JSONDecodeError:
                    return []
            
            return []
        except Exception as e:
            logger.error(f"Error analyzing grammar: {str(e)}")
            return []

    async def _suggest_vocabulary(self, text: str, topic: Optional[str] = None) -> List[Dict[str, str]]:
        """Suggest alternative vocabulary to improve expression"""
        try:
            topic_context = f" related to {topic}" if topic else ""
            
            prompt = f"""Suggest 2-3 alternative words or phrases to make this sentence more natural or sophisticated{topic_context}.

Sentence: "{text}"

Return ONLY a JSON array in this exact format:
[
  {{"original": "word/phrase used", "alternative": "better word/phrase", "context": "when to use it"}}
]

If no improvements needed, return: []"""

            response = self.model.generate_content(prompt)
            
            if response and response.text:
                text = response.text.strip()
                # Remove markdown code blocks
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                
                try:
                    hints = json.loads(text)
                    return hints[:3] if isinstance(hints, list) else []
                except json.JSONDecodeError:
                    return []
            
            return []
        except Exception as e:
            logger.error(f"Error suggesting vocabulary: {str(e)}")
            return []

    async def generate_session_summary(
        self,
        messages: List[Dict[str, Any]],
        duration: int,
        level: str
    ) -> Dict[str, Any]:
        """Generate summary and feedback for a completed session"""
        try:
            # Count words and analyze conversation
            user_messages = [m for m in messages if m.get("sender_type") == "user"]
            total_words = sum(len(m.get("content", "").split()) for m in user_messages)
            
            # Build conversation summary
            conversation_sample = "\n".join([
                f"Student: {m.get('content')}" for m in user_messages[:10]
            ])

            prompt = f"""Analyze this English learning session and provide feedback.

Student Level: {level}
Session Duration: {duration} seconds
Words Spoken: {total_words}

Sample Conversation:
{conversation_sample}

Provide a JSON response with:
1. summary: Brief overview of the session (2-3 sentences)
2. strengths: Array of 2-3 things the student did well
3. areas_to_improve: Array of 2-3 specific areas to work on
4. recommended_topics: Array of 2-3 topics to practice next

Return ONLY valid JSON in this format:
{{
  "summary": "...",
  "strengths": ["...", "..."],
  "areas_to_improve": ["...", "..."],
  "recommended_topics": ["...", "..."]
}}"""

            response = self.model.generate_content(prompt)
            
            if response and response.text:
                text = response.text.strip()
                # Remove markdown code blocks
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                
                try:
                    summary = json.loads(text)
                    return summary
                except json.JSONDecodeError:
                    pass
            
            # Fallback summary
            return {
                "summary": f"Great session! You practiced for {duration // 60} minutes and used {total_words} words.",
                "strengths": ["Active participation", "Consistent engagement"],
                "areas_to_improve": ["Continue practicing regularly", "Try more complex sentences"],
                "recommended_topics": ["Daily routines", "Hobbies", "Travel"]
            }

        except Exception as e:
            logger.error(f"Error generating session summary: {str(e)}")
            return {
                "summary": "Session completed successfully!",
                "strengths": ["Good effort"],
                "areas_to_improve": ["Keep practicing"],
                "recommended_topics": ["Continue learning"]
            }

    async def generate_pronunciation_feedback(self, transcription: str, expected_text: Optional[str] = None) -> Dict[str, Any]:
        """Generate pronunciation feedback based on transcription"""
        # This is a simplified version - in production, you'd use specialized speech recognition APIs
        # like Google Speech-to-Text with pronunciation assessment
        
        try:
            words = transcription.split()
            word_count = len(words)
            
            # Simulate pronunciation scoring (in production, use actual speech recognition API)
            base_score = 75.0
            length_bonus = min(word_count * 0.5, 10)
            pronunciation_score = min(base_score + length_bonus, 95.0)
            
            fluency_score = min(70.0 + (word_count * 0.3), 90.0)
            
            return {
                "transcription": transcription,
                "pronunciation_score": pronunciation_score,
                "fluency_score": fluency_score,
                "word_scores": [],  # Would contain per-word scores in production
                "suggestions": [
                    "Great job! Keep practicing.",
                    "Try to speak a bit more slowly for clarity.",
                    "Focus on word stress and intonation."
                ]
            }
        except Exception as e:
            logger.error(f"Error generating pronunciation feedback: {str(e)}")
            return {
                "transcription": transcription,
                "pronunciation_score": 70.0,
                "fluency_score": 70.0,
                "word_scores": [],
                "suggestions": ["Keep practicing!"]
            }


# Singleton instance
ai_virtual_room_service = AIVirtualRoomService()


