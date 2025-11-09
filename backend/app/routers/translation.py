"""
Translation API Router
Provides translation endpoints using deep-translator library
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.translation import (
    BatchTranslationRequest,
    BatchTranslationResponse,
    BidirectionalTranslationRequest,
    LanguageDetectionRequest,
    LanguageDetectionResponse,
    TranslationRequest,
    TranslationResponse,
)
from app.services.translation_service import translation_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Translate text to target language

    - **text**: Text to translate
    - **target_language**: Target language code (e.g., 'vi', 'en', 'es')
    - **source_language**: Source language code or 'auto' for auto-detection
    - **engine**: Translation engine ('google' or 'mymemory')
    """
    try:
        result = translation_service.translate(
            text=request.text,
            target_lang=request.target_language,
            source_lang=request.source_language if request.source_language != 'auto' else None,
            engine=request.engine
        )

        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Translation failed'))

        return TranslationResponse(**result)

    except Exception as e:
        logger.error(f"Translation API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate/batch", response_model=BatchTranslationResponse)
async def translate_batch(
    request: BatchTranslationRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Translate multiple texts at once

    - **texts**: List of texts to translate
    - **target_language**: Target language code
    - **source_language**: Source language code or 'auto'
    - **engine**: Translation engine
    """
    try:
        results = translation_service.translate_batch(
            texts=request.texts,
            target_lang=request.target_language,
            source_lang=request.source_language if request.source_language != 'auto' else None,
            engine=request.engine
        )

        response_results = [TranslationResponse(**r) for r in results]

        return BatchTranslationResponse(
            success=True,
            results=response_results,
            total_count=len(response_results)
        )

    except Exception as e:
        logger.error(f"Batch translation API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate/bidirectional", response_model=TranslationResponse)
async def translate_bidirectional(
    request: BidirectionalTranslationRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Bidirectional translation - automatically detects source language
    and translates between two languages

    - **text**: Text to translate
    - **language1**: First language (e.g., 'en')
    - **language2**: Second language (e.g., 'vi')
    - **engine**: Translation engine
    """
    try:
        result = translation_service.translate_bidirectional(
            text=request.text,
            lang1=request.language1,
            lang2=request.language2,
            engine=request.engine
        )

        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Translation failed'))

        return TranslationResponse(
            success=True,
            original_text=result['original_text'],
            translated_text=result['translated_text'],
            source_language=result['original_language'],
            target_language=result['translated_language'],
            message=result.get('direction')
        )

    except Exception as e:
        logger.error(f"Bidirectional translation API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language(
    request: LanguageDetectionRequest,
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Detect the language of given text

    - **text**: Text to detect language
    """
    try:
        detected_lang = translation_service.detect_language(request.text)
        lang_name = translation_service.SUPPORTED_LANGUAGES.get(detected_lang, 'Unknown')

        return LanguageDetectionResponse(
            success=True,
            text=request.text,
            detected_language=detected_lang,
            language_name=lang_name
        )

    except Exception as e:
        logger.error(f"Language detection API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-languages")
async def get_supported_languages(
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Get list of supported languages
    """
    try:
        languages = translation_service.get_supported_languages()
        return {
            'success': True,
            'languages': languages,
            'total_count': len(languages)
        }

    except Exception as e:
        logger.error(f"Get languages API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def translation_health_check():
    """
    Check if translation service is working
    """
    try:
        # Test translation
        test_result = translation_service.translate(
            text="Hello",
            target_lang="vi",
            source_lang="en"
        )

        return {
            'status': 'healthy' if test_result.get('success') else 'unhealthy',
            'service': 'translation',
            'engines': ['google', 'mymemory'],
            'test_translation': test_result.get('translated_text') if test_result.get('success') else None
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'service': 'translation',
            'error': str(e)
        }
