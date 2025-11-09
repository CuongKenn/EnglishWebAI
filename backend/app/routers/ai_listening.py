import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.openai_service import OpenAIService

router = APIRouter()
logger = logging.getLogger(__name__)


# Schemas
class Question(BaseModel):
    question: str
    options: list[str]
    correct: int
    explanation: str | None = None


class ListeningLesson(BaseModel):
    id: int
    title: str
    level: str
    duration: str
    audio_url: str | None = None
    transcript: str
    questions: list[Question]


class SubmitAnswersRequest(BaseModel):
    lesson_id: int
    answers: dict  # {question_index: answer_index}


# ===================== Generate Listening Lesson =====================

@router.get("/generate", response_model=ListeningLesson)
async def generate_listening_lesson(
    level: str = "intermediate",
    db: Session = Depends(get_db),
):
    """
    Generate a listening lesson with AI
    Levels: beginner, intermediate, advanced
    """
    try:
        # Validate level
        if level not in ["beginner", "intermediate", "advanced"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid level. Must be: beginner, intermediate, or advanced"
            )

        try:
            openai_svc = OpenAIService()
        except Exception as e:
            logger.error(f"[AI-LISTENING] Failed to initialize OpenAI: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service is not available. Please contact administrator to configure OPENAI_API_KEY."
            )

        # Level-specific prompts
        level_specs = {
            "beginner": {
                "description": "A1-A2 level (basic vocabulary, simple grammar, short sentences)",
                "topics": "daily routine, ordering food, basic shopping, greetings",
                "duration": "2:00 - 3:00",
                "num_questions": 7
            },
            "intermediate": {
                "description": "B1-B2 level (moderate vocabulary, more complex grammar)",
                "topics": "work, travel, education, technology, health",
                "duration": "3:00 - 4:00",
                "num_questions": 8
            },
            "advanced": {
                "description": "C1-C2 level (advanced vocabulary, complex grammar, idiomatic expressions)",
                "topics": "business, science, environment, global issues, culture",
                "duration": "4:30 - 5:30",
                "num_questions": 10
            }
        }

        spec = level_specs[level]

        prompt = f"""
Generate a listening comprehension exercise for English learners at {level} level ({spec['description']}).

Requirements:
1. Create a realistic and engaging dialogue or monologue about one of these topics: {spec['topics']}
2. The transcript should be appropriate for {level} learners with natural conversational flow
3. Duration: approximately {spec['duration']} minutes with detailed content
   - Beginner: 400-500 words (more detailed than basic)
   - Intermediate: 600-800 words (rich in details, vocabulary, and context)
   - Advanced: 900-1200 words (comprehensive with complex ideas and nuanced language)
4. Include EXACTLY {spec['num_questions']} multiple-choice comprehension questions
5. Each question should have 4 options (A, B, C, D) with only ONE correct answer
6. Make sure questions test different aspects: main idea, specific details, inference, vocabulary in context
7. Include specific details in the transcript such as names, numbers, dates, locations, and facts that can be tested

Return ONLY valid JSON in this exact format:
{{
    "title": "Engaging title for the lesson",
    "transcript": "Full dialogue or monologue text with rich details. For dialogues, format as:\\nSpeaker1: Text...\\nSpeaker2: Text...",
    "duration": "X:XX format",
    "questions": [
        {{
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Detailed explanation why the correct answer is right and why other options are wrong"
        }}
    ]
}}

Important:
- For 'correct', use index 0-3 (0=A, 1=B, 2=C, 3=D)
- Make dialogue natural, realistic, and long enough to support all questions
- Include varied sentence structures and authentic language use
- Questions should be clear and unambiguous
- Provide detailed explanation for EACH question:
  * Explain WHY the correct answer is right (reference specific part of transcript)
  * Explain WHY the wrong answers are incorrect
  * Keep explanation clear and educational
- No markdown, no code blocks, just pure JSON
"""

        logger.info(f"[AI-LISTENING] Generating lesson for level: {level}")

        # Call OpenAI
        try:
            response_text = openai_svc.generate_content(prompt)
        except ValueError as ve:
            logger.error(f"[AI-LISTENING] OpenAI not configured: {ve}")
            raise HTTPException(
                status_code=503,
                detail="AI service is not configured. Please add OPENAI_API_KEY to .env file. Get your API key at: https://platform.openai.com/api-keys"
            )
        except Exception as ge:
            logger.error(f"[AI-LISTENING] OpenAI API error: {ge}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to generate lesson with AI: {str(ge)}"
            )

        # Clean response
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse JSON
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"[AI-LISTENING] Failed to parse JSON: {e}")
            logger.error(f"[AI-LISTENING] Response: {response_text[:500]}")
            raise HTTPException(
                status_code=500,
                detail="AI response format invalid. Please try again."
            )

        # Validate required fields
        required_fields = ["title", "transcript", "duration", "questions"]
        for field in required_fields:
            if field not in result:
                raise HTTPException(
                    status_code=500,
                    detail=f"AI response missing required field: {field}"
                )

        # Validate questions
        if not result["questions"] or len(result["questions"]) == 0:
            raise HTTPException(
                status_code=500,
                detail="AI did not generate any questions"
            )

        for q in result["questions"]:
            if "question" not in q or "options" not in q or "correct" not in q:
                raise HTTPException(
                    status_code=500,
                    detail="Invalid question format from AI"
                )
            if len(q["options"]) != 4:
                raise HTTPException(
                    status_code=500,
                    detail="Each question must have exactly 4 options"
                )
            if not (0 <= q["correct"] <= 3):
                raise HTTPException(
                    status_code=500,
                    detail="Correct answer index must be 0-3"
                )
            # Add default explanation if missing
            if "explanation" not in q or not q["explanation"]:
                q["explanation"] = f"The correct answer is {chr(65 + q['correct'])}."

        logger.info(f"[AI-LISTENING] Successfully generated lesson: {result['title']}")

        # Generate unique ID (timestamp-based)
        import time
        lesson_id = int(time.time() * 1000)

        # Return lesson
        return ListeningLesson(
            id=lesson_id,
            title=result["title"],
            level=level.capitalize(),
            duration=result["duration"],
            audio_url=None,  # Can be implemented with Azure Speech later
            transcript=result["transcript"],
            questions=[
                Question(
                    question=q["question"],
                    options=q["options"],
                    correct=q["correct"],
                    explanation=q.get("explanation", f"The correct answer is {chr(65 + q['correct'])}.")
                )
                for q in result["questions"]
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AI-LISTENING] Error generating lesson: {e}")
        import traceback
        logger.error(f"[AI-LISTENING] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate listening lesson: {str(e)}"
        )


# ===================== Submit Answers =====================

@router.post("/submit")
async def submit_listening_answers(
    payload: SubmitAnswersRequest,
    db: Session = Depends(get_db),
):
    """
    Submit listening answers and get feedback
    For now, just logs the submission
    Can be extended to store results in database
    """
    try:
        logger.info(
            f"[AI-LISTENING] Submitted answers for lesson {payload.lesson_id}: "
            f"{len(payload.answers)} questions answered"
        )

        # TODO: Store in database if needed
        # For now, just return success
        return {
            "success": True,
            "message": "Answers submitted successfully",
            "answered_count": len(payload.answers)
        }

    except Exception as e:
        logger.error(f"[AI-LISTENING] Error submitting answers: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit answers"
        )


# ===================== Text to Speech (Optional) =====================

@router.post("/tts")
async def text_to_speech(
    text: str,
    voice: str = "female",
    speed: float = 1.0,
):
    """
    Convert text to speech using Azure Speech Service
    TODO: Implement Azure Speech integration
    """
    try:
        # This would integrate with Azure Speech Service
        # For now, return placeholder
        logger.info(f"[AI-LISTENING] TTS requested for {len(text)} characters")

        return {
            "audio_url": None,
            "message": "Text-to-Speech not yet implemented. Will use browser's built-in speech synthesis."
        }

    except Exception as e:
        logger.error(f"[AI-LISTENING] Error in TTS: {e}")
        raise HTTPException(
            status_code=500,
            detail="Text-to-Speech service unavailable"
        )

