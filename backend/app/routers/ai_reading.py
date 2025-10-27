"""
AI Reading Practice Router
Handles AI-powered reading comprehension practice
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
from app.schemas.ai_reading import (
    GenerateReadingRequest,
    GenerateReadingResponse,
    CheckAnswersRequest,
    CheckAnswersResponse,
    Question
)
from app.services.gemini_service import gemini_service
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.services.ai_analytics_service import AIAnalyticsService
from app.models.user import User

router = APIRouter()

# Store generated passages temporarily (in production, use Redis or database)
passage_cache: Dict[int, Dict] = {}


@router.post("/generate", response_model=GenerateReadingResponse)
async def generate_reading_passage(
    request: GenerateReadingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a reading passage with comprehension questions based on level and type
    
    - **level**: beginner, intermediate, or advanced
    - **reading_type**: story, article, news, essay, or letter
    - **topic**: (optional) specific topic for the passage
    """
    try:
        # Generate passage using Gemini AI
        result = await gemini_service.generate_reading_passage(
            reading_type=request.reading_type,
            level=request.level,
            topic=request.topic
        )
        
        # Store passage for answer checking (use user_id as key)
        passage_cache[current_user.id] = result
        
        # Convert to response model
        response = GenerateReadingResponse(
            title=result.get('title', ''),
            passage=result.get('passage', ''),
            questions=[
                Question(
                    question=q.get('question', ''),
                    question_format=q.get('question_format', 'multiple_choice'),
                    question_type=q.get('question_type'),
                    options=q.get('options'),
                    correct_answer=q.get('correct_answer'),
                    acceptable_answers=q.get('acceptable_answers')
                ) for q in result.get('questions', [])
            ],
            level=result.get('level', request.level),
            reading_type=result.get('reading_type', request.reading_type),
            word_count=result.get('word_count', 0),
            estimated_time=result.get('estimated_time', 5)
        )
        
        # Log usage (non-blocking)
        try:
            AIAnalyticsService.log_usage(db, user_id=current_user.id, feature="reading", metadata={"action": "generate", "reading_type": request.reading_type, "level": request.level})
        except Exception:
            pass

        return response
        
    except Exception as e:
        print(f"Error generating reading passage: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate reading passage: {str(e)}"
        )


@router.post("/check-answers", response_model=CheckAnswersResponse)
async def check_reading_answers(
    request: CheckAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check user's answers to reading comprehension questions
    
    - **answers**: List of answer indices (0-3 for A-D)
    """
    try:
        # Get the cached passage for this user
        cached_passage = passage_cache.get(current_user.id)
        
        if not cached_passage:
            raise HTTPException(
                status_code=404,
                detail="No reading passage found. Please generate a passage first."
            )
        
        questions = cached_passage.get('questions', [])
        
        if len(request.answers) != len(questions):
            raise HTTPException(
                status_code=400,
                detail=f"Expected {len(questions)} answers, but got {len(request.answers)}"
            )
        
        # Check answers using Gemini service
        result = await gemini_service.check_reading_answers(
            passage_title=cached_passage.get('title', ''),
            questions=questions,
            user_answers=request.answers
        )
        
        # Convert to response model
        response = CheckAnswersResponse(
            score=result.get('score', 0),
            total_questions=result.get('total_questions', 0),
            correct_answers=result.get('correct_answers', 0),
            results=result.get('results', []),
            level_recommendation=result.get('level_recommendation'),
            feedback=result.get('feedback', '')
        )
        
        # Log usage (non-blocking)
        try:
            AIAnalyticsService.log_usage(db, user_id=current_user.id, feature="reading", metadata={"action": "submit"})
        except Exception:
            pass

        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking answers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check answers. Please try again."
        )


@router.delete("/clear-cache")
async def clear_passage_cache(current_user: User = Depends(get_current_user)):
    """
    Clear the cached passage for the current user
    """
    if current_user.id in passage_cache:
        del passage_cache[current_user.id]
        return {"message": "Cache cleared successfully"}
    return {"message": "No cache to clear"}
