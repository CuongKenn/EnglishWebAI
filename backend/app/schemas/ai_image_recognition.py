"""
AI Image Recognition Schemas
Schemas for ML-based image recognition and vocabulary learning
"""

from typing import Literal

from pydantic import BaseModel, Field


class ImageRecognitionRequest(BaseModel):
    """Request for image recognition"""
    level: Literal["beginner", "intermediate", "advanced"] = Field(
        default="beginner",
        description="English proficiency level for vocabulary complexity"
    )


class VocabularyItem(BaseModel):
    """Vocabulary word with pronunciation and examples"""
    word: str = Field(description="English word/phrase")
    word_type: str = Field(description="Part of speech (noun, verb, adjective, etc.)")
    ipa_us: str = Field(description="IPA pronunciation (US)")
    ipa_uk: str | None = Field(default=None, description="IPA pronunciation (UK)")
    definition: str = Field(description="Simple definition in English")
    example_sentence: str = Field(description="Example sentence using the word")
    example_translation: str | None = Field(
        default=None,
        description="Vietnamese translation of example (optional)"
    )
    synonyms: list[str] | None = Field(
        default_factory=list,
        description="Related/similar words"
    )


class RecognizedObject(BaseModel):
    """Single recognized object from image"""
    label: str = Field(description="English label for the object")
    confidence: float = Field(description="Confidence score (0-1)")
    vocabulary: VocabularyItem = Field(description="Detailed vocabulary information")


class ImageRecognitionResponse(BaseModel):
    """Response from image recognition"""
    success: bool = Field(description="Whether recognition was successful")
    primary_object: RecognizedObject | None = Field(
        default=None,
        description="Main object detected with full vocabulary info"
    )
    other_objects: list[RecognizedObject] = Field(
        default_factory=list,
        description="Other objects detected in the image"
    )
    scene_description: str | None = Field(
        default=None,
        description="Brief description of the scene (optional)"
    )
    level: str = Field(description="Proficiency level used")
    message: str | None = Field(
        default=None,
        description="Additional message or tips"
    )
