"""
AI Writing Schemas
Pydantic models for AI writing check requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class GrammarError(BaseModel):
    """Grammar error detail"""
    error: str = Field(..., description="Original text with error")
    correction: str = Field(..., description="Corrected text")
    explanation: str = Field(..., description="Explanation of the error")


class VocabularySuggestion(BaseModel):
    """Vocabulary improvement suggestion"""
    original: str = Field(..., description="Original word/phrase")
    suggestion: str = Field(..., description="Better word/phrase")
    reason: str = Field(..., description="Why the suggestion is better")


class WritingCheckRequest(BaseModel):
    """Request to check writing"""
    text: str = Field(..., min_length=10, max_length=5000, description="Text to check")
    writing_type: Optional[str] = Field(
        default="general",
        description="Type of writing: essay, email, story, letter, article"
    )
    level: Optional[str] = Field(
        default="intermediate",
        description="English level: beginner, intermediate, advanced"
    )


class WritingCheckResponse(BaseModel):
    """Response with writing feedback"""
    overall_score: int = Field(..., ge=0, le=100, description="Overall score out of 100")
    grammar_score: int = Field(..., ge=0, le=100, description="Grammar score")
    vocabulary_score: int = Field(..., ge=0, le=100, description="Vocabulary score")
    structure_score: int = Field(..., ge=0, le=100, description="Structure/organization score")
    coherence_score: int = Field(..., ge=0, le=100, description="Coherence and cohesion score")
    
    grammar_errors: List[GrammarError] = Field(default_factory=list, description="List of grammar errors")
    vocabulary_suggestions: List[VocabularySuggestion] = Field(
        default_factory=list,
        description="Vocabulary improvement suggestions"
    )
    
    strengths: List[str] = Field(default_factory=list, description="Writing strengths")
    improvements: List[str] = Field(default_factory=list, description="Areas for improvement")
    
    corrected_text: str = Field(..., description="Fully corrected version of the text")
    overall_comment: str = Field(..., description="Overall encouraging feedback")


class WritingTopicRequest(BaseModel):
    """Request to generate a writing topic"""
    writing_type: Optional[str] = Field(
        default="general",
        description="Type of writing: essay, email, story, letter, article"
    )
    level: Optional[str] = Field(
        default="intermediate",
        description="English level: beginner, intermediate, advanced"
    )


class WritingTopicResponse(BaseModel):
    """Response with generated writing topic"""
    title: str = Field(..., description="Topic title")
    prompt: str = Field(..., description="Writing prompt/instructions")
    word_count: str = Field(..., description="Recommended word count")
    tips: List[str] = Field(default_factory=list, description="Writing tips")
