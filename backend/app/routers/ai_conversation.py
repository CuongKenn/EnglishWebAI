"""
AI Conversation Router
Handles AI-powered conversation endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import logging

logger = logging.getLogger(__name__)
from sqlalchemy.orm import Session
from typing import Optional
import tempfile
import os
from app.schemas.ai_conversation import (
    ConversationRequest,
    ConversationResponse,
    ConversationSuggestionsRequest,
    ConversationSuggestionsResponse
)
from app.services.openai_service import openai_service
from app.services.azure_speech_service import azure_speech_service
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.services.ai_analytics_service import AIAnalyticsService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Conversation"])


@router.post("/conversation", response_model=ConversationResponse)
async def chat_with_ai(
    request: ConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chat with AI using OpenAI (ChatGPT)
    
    - Requires authentication
    - Returns AI's response to user's message
    """
    try:
        # Convert chat history to dict format
        chat_history = None
        if request.chat_history:
            chat_history = [msg.dict() for msg in request.chat_history]
        
        # Get AI response
        ai_response = await openai_service.chat_conversation(
            message=request.message,
            chat_history=chat_history,
            system_prompt=request.system_prompt
        )
        
        # Log usage
        try:
            AIAnalyticsService.log_usage(db, user_id=current_user.id, feature="conversation", metadata={"action": "chat"})
        except Exception:
            # Do not block response on logging errors
            pass

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
        suggestions = await openai_service.get_conversation_suggestions(
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


@router.post("/speaking-practice/assess")
async def assess_speaking_practice(
    audio: UploadFile = File(...),
    reference_text: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assess speaking practice audio using Azure Speech + OpenAI
    
    - Receives audio recording and reference text
    - Returns pronunciation scores, transcription, and detailed AI feedback
    - Uses Azure for pronunciation assessment
    - Uses OpenAI for grammar/vocabulary analysis and feedback generation
    """
    temp_file = None
    try:
        # Save uploaded audio to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.webm')
        content = await audio.read()
        temp_file.write(content)
        temp_file.close()
        
        logger.info(f"[assess_speaking_practice] Audio saved: {temp_file.name}, ref: {reference_text[:50]}")
        
        # Get Azure pronunciation assessment
        assessment = azure_speech_service.assess_pronunciation(
            audio_file_path=temp_file.name,
            reference_text=reference_text,
            language="en-US"
        )
        
        if "error" in assessment:
            raise HTTPException(status_code=500, detail=assessment["error"])
        
        recognized_text = assessment.get('recognized_text', '')
        pronunciation_score = assessment.get('pronunciation_score', 0)
        fluency_score = assessment.get('fluency_score', 0)
        completeness_score = assessment.get('completeness_score', 0)
        accuracy_score = assessment.get('accuracy_score', 0)
        
        logger.info(f"[assess_speaking_practice] Azure scores - Pronunciation: {pronunciation_score}, Fluency: {fluency_score}")
        
        # Use OpenAI to analyze grammar, vocabulary, and generate detailed feedback
        openai_prompt = f"""Phân tích chi tiết bài nói tiếng Anh của học sinh:

**Nội dung yêu cầu:** {reference_text}
**Nội dung học sinh nói:** {recognized_text}

**Điểm số từ Azure Speech:**
- Phát âm (Pronunciation): {pronunciation_score:.1f}/100
- Độ trôi chảy (Fluency): {fluency_score:.1f}/100
- Hoàn thiện (Completeness): {completeness_score:.1f}/100
- Chính xác (Accuracy): {accuracy_score:.1f}/100

Hãy phân tích và trả về kết quả theo định dạng JSON sau:

{{
  "grammar_score": <điểm ngữ pháp 0-10>,
  "vocabulary_score": <điểm từ vựng 0-10>,
  "grammar_errors": [
    {{"text": "lỗi ngữ pháp", "suggestion": "sửa đúng", "explanation": "giải thích"}}, ...
  ],
  "vocabulary_comments": [
    {{"text": "từ/cụm từ", "type": "good|error", "comment": "nhận xét"}}, ...
  ],
  "general_feedback": "Nhận xét chung về bài nói (2-3 câu)",
  "improvement_tips": ["Lời khuyên 1", "Lời khuyên 2", "Lời khuyên 3"]
}}

Chỉ trả về JSON, không có text khác."""

        try:
            openai_response = await openai_service.generate_text(openai_prompt)
            # Parse JSON from OpenAI response
            import json
            import re
            # Extract JSON from markdown code block if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', openai_response, re.DOTALL)
            if json_match:
                openai_data = json.loads(json_match.group(1))
            else:
                openai_data = json.loads(openai_response)
            
            logger.info(f"[assess_speaking_practice] OpenAI analysis complete")
        except Exception as e:
            logger.info(f"[assess_speaking_practice] OpenAI analysis failed: {e}")
            # Fallback values
            openai_data = {
                "grammar_score": round(accuracy_score / 10, 1),
                "vocabulary_score": round(completeness_score / 10, 1),
                "grammar_errors": [],
                "vocabulary_comments": [],
                "general_feedback": "Không thể phân tích chi tiết. Vui lòng thử lại.",
                "improvement_tips": []
            }
        
        # Calculate final detailed feedback from azure_speech_service
        score_result = azure_speech_service.calculate_speaking_score(assessment, max_score=10.0)
        
        # Aggregate all errors and good expressions
        detailed_feedback = []
        error_count = len(openai_data.get('grammar_errors', []))
        good_count = len([v for v in openai_data.get('vocabulary_comments', []) if v.get('type') == 'good'])
        
        # Add grammar errors
        for idx, error in enumerate(openai_data.get('grammar_errors', [])[:5]):  # Limit to 5
            detailed_feedback.append({
                "type": "error",
                "text": error.get('text', ''),
                "position": idx + 1,
                "suggestion": error.get('suggestion', ''),
                "explanation": error.get('explanation', '')
            })
        
        # Add vocabulary comments
        for idx, vocab in enumerate(openai_data.get('vocabulary_comments', [])[:5]):  # Limit to 5
            detailed_feedback.append({
                "type": vocab.get('type', 'good'),
                "text": vocab.get('text', ''),
                "position": len(detailed_feedback) + 1,
                "comment": vocab.get('comment', '')
            })
        
        # Log usage
        try:
            AIAnalyticsService.log_usage(
                db, 
                user_id=current_user.id, 
                feature="speaking_practice",
                metadata={"action": "assess", "reference_length": len(reference_text)}
            )
        except Exception:
            pass
        
        # Return comprehensive response
        return {
            "success": True,
            "transcription": recognized_text,
            "score": round((pronunciation_score + fluency_score + openai_data['grammar_score'] * 10 + openai_data['vocabulary_score'] * 10) / 4, 1),
            "feedback": {
                "generalComments": len(openai_data.get('improvement_tips', [])),
                "goodExpressions": good_count,
                "errors": error_count
            },
            "detailedFeedback": detailed_feedback,
            "pronunciation": round(pronunciation_score / 10, 1),
            "fluency": round(fluency_score / 10, 1),
            "grammar": openai_data['grammar_score'],
            "vocabulary": openai_data['vocabulary_score'],
            "aiGeneratedFeedback": score_result.get('detailed_feedback', ''),
            "improvementTips": openai_data.get('improvement_tips', [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"[assess_speaking_practice] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess speaking: {str(e)}"
        )
    finally:
        # Cleanup temp file
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except:
                pass

