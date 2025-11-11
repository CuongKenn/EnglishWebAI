"""
AI Speaking Practice Service
Generates speaking topics and provides detailed grading using Azure Speech + OpenAI
"""

import json
import logging
from typing import Any

from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class AISpeakingService:
    """Service for AI-powered speaking practice"""

    def __init__(self):
        """Initialize with OpenAI service instance"""
        self.openai_service = OpenAIService()

    # Speaking levels
    LEVELS = {
        "beginner": "A1-A2 (Basic vocabulary, simple sentences)",
        "intermediate": "B1-B2 (Everyday topics, more complex grammar)",
        "advanced": "C1-C2 (Academic/professional topics, nuanced expression)",
    }

    # Topic categories
    TOPIC_CATEGORIES = [
        "Daily Life",
        "Travel & Tourism",
        "Education",
        "Work & Career",
        "Technology",
        "Health & Wellness",
        "Environment",
        "Food & Cooking",
        "Entertainment",
        "Social Issues",
        "Culture & Traditions",
        "Hobbies & Interests",
    ]

    async def generate_speaking_topic(
        self,
        level: str,
        category: str | None = None,
        duration: int = 2,
        custom_prompt: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate speaking topic based on user preferences

        Args:
            level: Speaking level (beginner/intermediate/advanced)
            category: Topic category (optional)
            duration: Duration in minutes (1-5)
            custom_prompt: Custom instructions from user (optional)

        Returns:
            Dictionary with topic, questions, and guidelines
        """
        try:
            level_desc = AISpeakingService.LEVELS.get(level, AISpeakingService.LEVELS["intermediate"])

            system_prompt = f"""You are an English speaking exam creator.
Generate a speaking practice topic suitable for {level_desc} level.
The speaking duration is approximately {duration} minute(s).

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON.

Return EXACTLY this JSON structure:
{{
    "topic": "Main topic title",
    "description": "Brief description of what to talk about",
    "questions": [
        "Question 1 to guide the speaker",
        "Question 2...",
        "Question 3..."
    ],
    "key_vocabulary": ["word1", "word2", "word3"],
    "tips": ["Tip 1 for better performance", "Tip 2..."],
    "level": "{level}",
    "category": "{category or 'General'}"
}}

Respond with ONLY the JSON object, no additional text."""

            user_prompt = f"Generate a {level} level speaking topic"
            if category:
                user_prompt += f" about {category}"
            if custom_prompt:
                user_prompt += f". Additional requirements: {custom_prompt}"
            user_prompt += f". Duration: {duration} minute(s). Respond with JSON only."

            # Call OpenAI to generate topic
            response = await self.openai_service.chat_conversation(
                message=user_prompt,
                system_prompt=system_prompt,
            )

            # Try to parse JSON response
            try:
                # Strip markdown code blocks if present
                response_text = response.strip()
                if response_text.startswith("```"):
                    # Remove ```json and ``` markers
                    lines = response_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].strip() == "```":
                        lines = lines[:-1]
                    response_text = "\n".join(lines)

                result = json.loads(response_text)
            except json.JSONDecodeError as e:
                # If response is not JSON, extract manually
                logger.warning(f"OpenAI response was not valid JSON: {e}. Response: {response[:500]}")
                result = {
                    "topic": "Speaking Practice",
                    "description": response[:200] if len(response) > 200 else response,
                    "questions": ["What would you like to talk about?"],
                    "key_vocabulary": [],
                    "tips": ["Speak clearly and naturally"],
                }

            return {
                "success": True,
                "topic": result.get("topic", "Speaking Practice"),
                "description": result.get("description", ""),
                "questions": result.get("questions", []),
                "key_vocabulary": result.get("key_vocabulary", []),
                "tips": result.get("tips", []),
                "level": level,
                "category": category or result.get("category", "General"),
                "duration": duration,
            }

        except Exception as e:
            logger.error(f"Error generating speaking topic: {e}")
            return {
                "success": False,
                "error": str(e),
                "topic": "Describe your daily routine",
                "description": "Talk about your typical day",
                "questions": [
                    "What time do you usually wake up?",
                    "What do you do in your free time?",
                    "What is your favorite part of the day?",
                ],
                "key_vocabulary": ["routine", "schedule", "activities"],
                "tips": ["Speak clearly", "Use complete sentences"],
                "level": level,
                "category": category or "Daily Life",
                "duration": duration,
            }

    async def grade_speaking(
        self,
        audio_url: str,
        transcription: str,
        topic: str,
        questions: list[str],
        level: str,
        emotion_summary: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Grade speaking performance using Azure Speech + OpenAI

        Args:
            audio_url: URL to recorded audio file
            transcription: Transcribed text from Azure Speech
            topic: Speaking topic
            questions: Guiding questions
            level: Expected level
            emotion_summary: Summary of emotions during speaking (optional)

        Returns:
            Detailed grading with scores and feedback
        """
        try:
            # Prepare grading prompt
            system_prompt = """You are an expert English speaking examiner.
Evaluate the speaking performance based on:
1. **Pronunciation & Fluency** (0-25 points)
2. **Grammar & Accuracy** (0-25 points)
3. **Vocabulary Range** (0-25 points)
4. **Content & Relevance** (0-25 points)

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text.

Return EXACTLY this JSON structure:
{
    "overall_score": 0-100,
    "pronunciation_fluency": {
        "score": 0-25,
        "feedback": "Detailed feedback..."
    },
    "grammar_accuracy": {
        "score": 0-25,
        "feedback": "..."
    },
    "vocabulary": {
        "score": 0-25,
        "feedback": "..."
    },
    "content_relevance": {
        "score": 0-25,
        "feedback": "..."
    },
    "strengths": ["strength 1", "strength 2"],
    "areas_for_improvement": ["area 1", "area 2"],
    "overall_feedback": "Summary feedback...",
    "suggested_next_steps": ["suggestion 1", "suggestion 2"]
}

Respond with ONLY the JSON object."""

            user_prompt = f"""Topic: {topic}
Level: {level}
Questions: {', '.join(questions)}

Transcription:
{transcription}

Evaluate this speaking performance."""

            # Add emotion context if available
            if emotion_summary:
                dominant_emotion = emotion_summary.get("dominant_emotion", "neutral")
                confidence_level = "high" if emotion_summary.get("average_confidence", 0) > 0.7 else "moderate"
                user_prompt += f"\n\nNote: Speaker showed mostly {dominant_emotion} emotion with {confidence_level} confidence during speaking."

            # Call OpenAI for grading
            response = await self.openai_service.chat_conversation(
                message=user_prompt,
                system_prompt=system_prompt,
            )

            # Parse JSON response with markdown stripping
            try:
                response_text = response.strip()

                # Strip markdown code blocks if present
                if response_text.startswith("```"):
                    lines = response_text.split("\n")
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].strip() == "```":
                        lines = lines[:-1]
                    response_text = "\n".join(lines)

                result = json.loads(response_text)
                logger.info(f"Successfully parsed grading JSON. Score: {result.get('overall_score', 'N/A')}")

            except json.JSONDecodeError as e:
                logger.warning(f"OpenAI grading response was not valid JSON: {str(e)}")
                logger.warning(f"Response preview: {response[:500]}")
                result = {
                    "overall_score": 70,
                    "pronunciation_fluency": {"score": 18, "feedback": "Good effort"},
                    "grammar_accuracy": {"score": 17, "feedback": "Needs improvement"},
                    "vocabulary": {"score": 17, "feedback": "Adequate range"},
                    "content_relevance": {"score": 18, "feedback": "Relevant content"},
                    "strengths": ["Clear speaking"],
                    "areas_for_improvement": ["Grammar accuracy"],
                    "overall_feedback": response[:500] if len(response) > 500 else response,
                    "suggested_next_steps": ["Keep practicing"],
                }

            # Add emotion analysis to result
            if emotion_summary:
                result["emotion_analysis"] = {
                    "dominant_emotion": emotion_summary.get("dominant_emotion"),
                    "confidence": emotion_summary.get("average_confidence"),
                    "distribution": emotion_summary.get("emotion_distribution", {}),
                    "feedback": emotion_summary.get("feedback"),
                }

            return {
                "success": True,
                "grading": result,
                "transcription": transcription,
                "audio_url": audio_url,
            }

        except Exception as e:
            logger.error(f"Error grading speaking: {e}")
            return {
                "success": False,
                "error": str(e),
                "grading": {
                    "overall_score": 0,
                    "overall_feedback": "Unable to grade automatically. Please review manually.",
                },
            }

    def calculate_pronunciation_score(
        self,
        pronunciation_assessment: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Calculate detailed pronunciation score from Azure Speech assessment

        Args:
            pronunciation_assessment: Azure pronunciation assessment result

        Returns:
            Detailed pronunciation scores and feedback
        """
        try:
            accuracy_score = pronunciation_assessment.get("AccuracyScore", 0)
            fluency_score = pronunciation_assessment.get("FluencyScore", 0)
            completeness_score = pronunciation_assessment.get("CompletenessScore", 0)
            pronunciation_score = pronunciation_assessment.get("PronScore", 0)

            # Word-level analysis
            words = pronunciation_assessment.get("Words", [])
            mispronounced_words = [
                w["Word"]
                for w in words
                if w.get("PronunciationAssessment", {}).get("AccuracyScore", 100) < 60
            ]

            feedback_parts = []

            if accuracy_score < 60:
                feedback_parts.append("Focus on pronouncing words more accurately.")
            elif accuracy_score < 80:
                feedback_parts.append("Good pronunciation, but some words need improvement.")
            else:
                feedback_parts.append("Excellent pronunciation accuracy!")

            if fluency_score < 60:
                feedback_parts.append("Try to speak more smoothly without long pauses.")
            elif fluency_score < 80:
                feedback_parts.append("Good fluency, keep practicing to sound more natural.")
            else:
                feedback_parts.append("Very fluent speaking!")

            if mispronounced_words:
                feedback_parts.append(
                    f"Pay attention to: {', '.join(mispronounced_words[:5])}"
                )

            return {
                "accuracy_score": round(accuracy_score, 1),
                "fluency_score": round(fluency_score, 1),
                "completeness_score": round(completeness_score, 1),
                "pronunciation_score": round(pronunciation_score, 1),
                "mispronounced_words": mispronounced_words[:10],
                "feedback": " ".join(feedback_parts),
            }

        except Exception as e:
            logger.error(f"Error calculating pronunciation score: {e}")
            return {
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0,
                "mispronounced_words": [],
                "feedback": "Unable to assess pronunciation.",
            }
