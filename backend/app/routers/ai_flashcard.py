"""
AI Flashcard Router
Handles AI-powered vocabulary flashcards generation
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import logging
import json
import random
import time

from app.core.database import get_db
from app.services.openai_service import OpenAIService
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


# ===================== Schemas =====================

class Flashcard(BaseModel):
    id: int
    word: str
    pronunciation: str
    meaning: str
    example: str
    category: str
    level: str


class FlashcardProgressRequest(BaseModel):
    flashcard_id: int
    known: bool


# ===================== Endpoints =====================

@router.get("/flashcards", response_model=List[Flashcard])
async def get_flashcards(
    level: str = Query("B1", regex="^(A1|A2|B1|B2|C1|C2)$"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Generate vocabulary flashcards using AI
    
    - **level**: CEFR level (A1, A2, B1, B2, C1, C2)
    - **limit**: Number of flashcards to generate (1-50)
    """
    try:
        try:
            openai_svc = OpenAIService()
        except Exception as e:
            logger.error(f"[AI-FLASHCARD] Failed to initialize OpenAI: {e}")
            raise HTTPException(
                status_code=503,
                detail="AI service is not available. Please contact administrator to configure OPENAI_API_KEY."
            )
        
        # Level specifications
        level_specs = {
            "A1": {
                "description": "Beginner (A1) - Basic everyday words",
                "topics": "greetings, family, numbers, colors, food, basic actions",
                "complexity": "simple, common words"
            },
            "A2": {
                "description": "Elementary (A2) - Common phrases and expressions",
                "topics": "shopping, directions, daily routines, hobbies, weather",
                "complexity": "everyday vocabulary"
            },
            "B1": {
                "description": "Intermediate (B1) - Work, school, and leisure vocabulary",
                "topics": "work, education, travel, technology, health, environment",
                "complexity": "common descriptive and action words"
            },
            "B2": {
                "description": "Upper-Intermediate (B2) - Abstract concepts and opinions",
                "topics": "business, science, culture, social issues, academic topics",
                "complexity": "more sophisticated vocabulary"
            },
            "C1": {
                "description": "Advanced (C1) - Fluent and sophisticated language",
                "topics": "advanced academic, professional, nuanced expressions",
                "complexity": "advanced vocabulary with subtle meanings"
            },
            "C2": {
                "description": "Proficiency (C2) - Near-native vocabulary",
                "topics": "specialized terms, idioms, formal expressions, literary language",
                "complexity": "highly sophisticated vocabulary"
            }
        }
        
        spec = level_specs[level]
        
        # Add randomization to ensure varied vocabulary each time
        random_seed = int(time.time() * 1000) % 10000
        random_topics = random.sample(spec['topics'].split(', '), min(3, len(spec['topics'].split(', '))))
        random_focus = random.choice([
            "focus on verbs and actions",
            "focus on nouns and objects",
            "focus on descriptive adjectives",
            "mix of different word types",
            "include some phrasal verbs",
            "include common expressions"
        ])
        
        prompt = f"""
Generate {limit} UNIQUE and DIVERSE vocabulary flashcards for English learners at {level} level ({spec['description']}).

🎲 Random Seed: {random_seed}
📚 Primary Topics: {', '.join(random_topics)}
🎯 Special Focus: {random_focus}

Requirements:
1. Create VARIED vocabulary from these topics: {spec['topics']}
2. Use {spec['complexity']}
3. Each word should be appropriate for {level} learners
4. Include proper IPA pronunciation
5. Provide accurate Vietnamese translation
6. Give a clear, natural example sentence
7. Categorize each word (e.g., Verbs, Nouns, Adjectives, Phrases, Technology, Business, etc.)

⚠️ IMPORTANT VARIATION RULES:
- Generate COMPLETELY DIFFERENT words each time
- Avoid the most obvious/common words (unless it's A1 level)
- Mix different word types and categories
- Use diverse topics and contexts
- Make each flashcard unique and useful
- Don't repeat words from previous generations

Return ONLY valid JSON array in this exact format:
[
    {{
        "word": "accomplish",
        "pronunciation": "/əˈkʌmplɪʃ/",
        "meaning": "Hoàn thành, đạt được",
        "example": "She accomplished all her goals this year.",
        "category": "Verbs"
    }},
    ...
]

Technical Requirements:
- Generate EXACTLY {limit} flashcards
- Use proper IPA notation for pronunciation (e.g., /həˈloʊ/, /θæŋk/)
- Keep examples natural and relevant to real-life situations
- Vietnamese translation should be accurate and clear
- No markdown, no code blocks, just pure JSON array
- Ensure JSON is valid and properly formatted
"""
        
        logger.info(f"[AI-FLASHCARD] Generating {limit} flashcards for level: {level}")
        
        # Call OpenAI
        try:
            response_text = openai_svc.generate_content(prompt)
        except ValueError as ve:
            logger.error(f"[AI-FLASHCARD] OpenAI not configured: {ve}")
            raise HTTPException(
                status_code=503,
                detail="AI service is not configured. Please add OPENAI_API_KEY to .env file."
            )
        except Exception as ge:
            logger.error(f"[AI-FLASHCARD] OpenAI API error: {ge}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to generate flashcards with AI: {str(ge)}"
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
            logger.error(f"[AI-FLASHCARD] Failed to parse JSON: {e}")
            logger.error(f"[AI-FLASHCARD] Response: {response_text[:500]}")
            raise HTTPException(
                status_code=500,
                detail="AI response format invalid. Please try again."
            )
        
        # Validate result is array
        if not isinstance(result, list):
            raise HTTPException(
                status_code=500,
                detail="AI did not return a list of flashcards"
            )
        
        if len(result) == 0:
            raise HTTPException(
                status_code=500,
                detail="AI did not generate any flashcards"
            )
        
        # Validate and build flashcard list
        flashcards = []
        for idx, card in enumerate(result):
            # Validate required fields
            required_fields = ["word", "pronunciation", "meaning", "example", "category"]
            for field in required_fields:
                if field not in card:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Flashcard {idx} missing required field: {field}"
                    )
            
            flashcards.append(
                Flashcard(
                    id=idx + 1,  # Generate ID based on index
                    word=card["word"],
                    pronunciation=card["pronunciation"],
                    meaning=card["meaning"],
                    example=card["example"],
                    category=card["category"],
                    level=level
                )
            )
        
        logger.info(f"[AI-FLASHCARD] Successfully generated {len(flashcards)} flashcards for level {level}")
        
        return flashcards
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AI-FLASHCARD] Error generating flashcards: {e}")
        import traceback
        logger.error(f"[AI-FLASHCARD] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate flashcards: {str(e)}"
        )


@router.post("/flashcards/progress")
async def save_flashcard_progress(
    payload: FlashcardProgressRequest,
    db: Session = Depends(get_db),
):
    """
    Save user's flashcard learning progress
    
    For now, just logs the progress. Can be extended to store in database.
    """
    try:
        logger.info(
            f"[AI-FLASHCARD] Flashcard progress: flashcard_id={payload.flashcard_id}, "
            f"known={payload.known}"
        )
        
        # TODO: Store in database if needed
        # For example, create a FlashcardProgress model and save to DB
        
        return {
            "success": True,
            "message": "Progress saved successfully",
            "flashcard_id": payload.flashcard_id,
            "known": payload.known
        }
        
    except Exception as e:
        logger.error(f"[AI-FLASHCARD] Error saving progress: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save progress"
        )

