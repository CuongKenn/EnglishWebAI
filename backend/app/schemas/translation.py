"""
Pydantic schemas for Translation API
"""


from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    """Request schema for single translation"""
    text: str = Field(..., min_length=1, description="Text to translate")
    target_language: str = Field('vi', description="Target language code (e.g., 'vi', 'en')")
    source_language: str | None = Field('auto', description="Source language code or 'auto' for detection")
    engine: str = Field('google', description="Translation engine: 'google' or 'mymemory'")


class BatchTranslationRequest(BaseModel):
    """Request schema for batch translation"""
    texts: list[str] = Field(..., min_items=1, description="List of texts to translate")
    target_language: str = Field('vi', description="Target language code")
    source_language: str | None = Field('auto', description="Source language code or 'auto'")
    engine: str = Field('google', description="Translation engine")


class BidirectionalTranslationRequest(BaseModel):
    """Request schema for bidirectional translation"""
    text: str = Field(..., min_length=1, description="Text to translate")
    language1: str = Field('en', description="First language code")
    language2: str = Field('vi', description="Second language code")
    engine: str = Field('google', description="Translation engine")


class TranslationResponse(BaseModel):
    """Response schema for translation"""
    success: bool
    original_text: str
    translated_text: str | None = None
    source_language: str | None = None
    target_language: str | None = None
    engine: str | None = None
    detected_language: str | None = None
    error: str | None = None
    message: str | None = None


class BatchTranslationResponse(BaseModel):
    """Response schema for batch translation"""
    success: bool
    results: list[TranslationResponse]
    total_count: int


class LanguageDetectionRequest(BaseModel):
    """Request schema for language detection"""
    text: str = Field(..., min_length=1, description="Text to detect language")


class LanguageDetectionResponse(BaseModel):
    """Response schema for language detection"""
    success: bool
    text: str
    detected_language: str | None = None
    language_name: str | None = None
    error: str | None = None
