"""
AI Image Recognition Router
Handles ML-based image recognition for vocabulary learning
"""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_image_recognition import (
    ImageRecognitionResponse,
)
from app.services.ai_image_recognition_service import AIImageRecognitionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai/image-recognition", tags=["AI Image Recognition"])

# Initialize service
image_service = AIImageRecognitionService()


@router.post("/recognize", response_model=ImageRecognitionResponse)
async def recognize_image(
    file: UploadFile = File(..., description="Image file to recognize"),
    level: str = Form(default="beginner", description="English proficiency level"),
    current_user: User = Depends(get_current_user),
):
    """
    Recognize objects in uploaded image and return vocabulary information

    **Parameters:**
    - **file**: Image file (JPEG, PNG, etc.)
    - **level**: beginner | intermediate | advanced

    **Returns:**
    - Primary object with full vocabulary details (word, IPA, definition, example, synonyms)
    - Other objects detected in the image
    - Scene description
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file."
        )

    # Validate level
    if level not in ["beginner", "intermediate", "advanced"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid level. Must be: beginner, intermediate, or advanced."
        )

    try:
        # Read image data
        image_data = await file.read()

        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(image_data) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {max_size / 1024 / 1024}MB."
            )

        # Perform recognition
        result = await image_service.recognize_image(
            image_data=image_data,
            level=level,
        )

        logger.info(f"Image recognition for user {current_user.id}: {result.primary_object.label if result.primary_object else 'none'}")

        return result

    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        ) from e


@router.get("/health")
async def health_check():
    """
    Check if image recognition service is available

    **Returns:**
    - Service status and configuration
    """
    is_configured = image_service.client is not None

    return {
        "status": "available" if is_configured else "not_configured",
        "openai_configured": is_configured,
        "message": "Service ready" if is_configured else "OpenAI API key not configured",
        "supported_levels": ["beginner", "intermediate", "advanced"],
        "features": [
            "Object recognition",
            "IPA pronunciation (US & UK)",
            "Vocabulary definitions",
            "Example sentences",
            "Vietnamese translations",
            "Synonyms"
        ]
    }
