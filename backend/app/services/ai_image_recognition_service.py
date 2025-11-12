"""
AI Image Recognition Service
Handles ML-based image recognition for vocabulary learning
Uses OpenAI Vision API for robust object detection
"""

import base64
import logging

import openai

from app.core.config import settings
from app.schemas.ai_image_recognition import (
    ImageRecognitionResponse,
    RecognizedObject,
    VocabularyItem,
)

logger = logging.getLogger(__name__)


class AIImageRecognitionService:
    """Service for AI-powered image recognition and vocabulary learning"""

    def __init__(self):
        """Initialize OpenAI Vision API"""
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key or not self.api_key.strip():
            logger.warning("OPENAI_API_KEY not configured for image recognition")
            self.client = None
        else:
            openai.api_key = self.api_key
            self.client = openai
            self.model = "gpt-4o-mini"  # GPT-4o-mini supports vision

    async def recognize_image(
        self,
        image_data: bytes,
        level: str = "beginner",
    ) -> ImageRecognitionResponse:
        """
        Recognize objects in image and return vocabulary information

        Args:
            image_data: Image file bytes
            level: English proficiency level (beginner/intermediate/advanced)

        Returns:
            ImageRecognitionResponse with vocabulary details
        """
        if not self.client:
            raise ValueError(
                "OpenAI API is not configured. Please add OPENAI_API_KEY to .env"
            )

        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_data).decode("utf-8")

            # Create prompt based on level
            prompt = self._create_vocabulary_prompt(level)

            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "auto"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=1500,
                temperature=0.3,  # Lower temperature for more consistent vocabulary
            )

            # Log token usage for cost tracking
            usage = response.usage
            logger.info(
                f"[IMAGE-RECOGNITION] Tokens used: "
                f"input={usage.prompt_tokens}, output={usage.completion_tokens}, "
                f"total={usage.total_tokens} | "
                f"Estimated cost: ${(usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.60) / 1_000_000:.6f}"
            )

            # Parse response
            content = response.choices[0].message.content
            return self._parse_vocabulary_response(content, level)

        except Exception as e:
            logger.error(f"Error in image recognition: {str(e)}")
            raise

    def _create_vocabulary_prompt(self, level: str) -> str:
        """Create prompt for Vision API focused on vocabulary"""

        level_instructions = {
            "beginner": "Use basic vocabulary (A1-A2 level). Provide simple definitions and examples.",
            "intermediate": "Use intermediate vocabulary (B1-B2 level). Include more detailed explanations.",
            "advanced": "Use advanced vocabulary (C1-C2 level). Provide sophisticated definitions and examples.",
        }

        return f"""You are an English vocabulary teaching assistant. Analyze this image and identify objects to help students learn English vocabulary.

Instructions:
1. Identify the MAIN/PRIMARY object in the image (the most prominent or important item)
2. Identify 2-3 OTHER objects visible in the image
3. For EACH object, provide complete vocabulary information

Level: {level} - {level_instructions.get(level, level_instructions['beginner'])}

For each object, provide:
- **word**: The English word/phrase (e.g., "apple", "red apple", "coffee cup")
- **word_type**: Part of speech (noun, verb, adjective, etc.)
- **ipa_us**: IPA pronunciation (American English) - e.g., /ˈæp.əl/
- **ipa_uk**: IPA pronunciation (British English) - e.g., /ˈæp.əl/
- **definition**: Clear, simple definition in English
- **example_sentence**: A natural example sentence using the word
- **example_translation**: Vietnamese translation of the example sentence
- **synonyms**: 2-3 related or similar words (if applicable)

Format your response EXACTLY as JSON:
```json
{{
    "primary_object": {{
        "label": "main object name",
        "confidence": 0.95,
        "vocabulary": {{
            "word": "...",
            "word_type": "noun",
            "ipa_us": "/.../" ,
            "ipa_uk": "/.../",
            "definition": "...",
            "example_sentence": "...",
            "example_translation": "...",
            "synonyms": ["word1", "word2"]
        }}
    }},
    "other_objects": [
        {{
            "label": "object name",
            "confidence": 0.85,
            "vocabulary": {{
                "word": "...",
                "word_type": "noun",
                "ipa_us": "/.../" ,
                "ipa_uk": "/.../",
                "definition": "...",
                "example_sentence": "...",
                "example_translation": "...",
                "synonyms": ["word1", "word2"]
            }}
        }}
    ],
    "scene_description": "Brief description of the scene (1 sentence)"
}}
```

Important:
- Focus on concrete, visible objects
- Use accurate IPA notation
- Make examples natural and relevant to the object
- Provide helpful Vietnamese translations
- For beginners, use simpler words; for advanced, use more specific/technical terms
"""

    def _parse_vocabulary_response(
        self,
        content: str,
        level: str,
    ) -> ImageRecognitionResponse:
        """Parse Vision API response into vocabulary format"""

        try:
            import json
            import re

            # Find JSON in response
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    raise ValueError("No JSON found in response")

            data = json.loads(json_str)

            # Parse primary object
            primary_object = None
            if "primary_object" in data and data["primary_object"]:
                po_data = data["primary_object"]
                vocab_data = po_data.get("vocabulary", {})

                primary_object = RecognizedObject(
                    label=po_data.get("label", ""),
                    confidence=po_data.get("confidence", 0.9),
                    vocabulary=VocabularyItem(
                        word=vocab_data.get("word", po_data.get("label", "")),
                        word_type=vocab_data.get("word_type", "noun"),
                        ipa_us=vocab_data.get("ipa_us", ""),
                        ipa_uk=vocab_data.get("ipa_uk"),
                        definition=vocab_data.get("definition", ""),
                        example_sentence=vocab_data.get("example_sentence", ""),
                        example_translation=vocab_data.get("example_translation"),
                        synonyms=vocab_data.get("synonyms", []),
                    )
                )

            # Parse other objects
            other_objects = []
            for obj_data in data.get("other_objects", []):
                vocab_data = obj_data.get("vocabulary", {})

                other_objects.append(RecognizedObject(
                    label=obj_data.get("label", ""),
                    confidence=obj_data.get("confidence", 0.8),
                    vocabulary=VocabularyItem(
                        word=vocab_data.get("word", obj_data.get("label", "")),
                        word_type=vocab_data.get("word_type", "noun"),
                        ipa_us=vocab_data.get("ipa_us", ""),
                        ipa_uk=vocab_data.get("ipa_uk"),
                        definition=vocab_data.get("definition", ""),
                        example_sentence=vocab_data.get("example_sentence", ""),
                        example_translation=vocab_data.get("example_translation"),
                        synonyms=vocab_data.get("synonyms", []),
                    )
                ))

            return ImageRecognitionResponse(
                success=True,
                primary_object=primary_object,
                other_objects=other_objects,
                scene_description=data.get("scene_description"),
                level=level,
                message="Recognition successful! Learn the vocabulary below." if primary_object else None,
            )

        except Exception as e:
            logger.error(f"Error parsing vocabulary response: {str(e)}")
            logger.error(f"Response content: {content}")

            # Return fallback response
            return ImageRecognitionResponse(
                success=False,
                primary_object=None,
                other_objects=[],
                scene_description=None,
                level=level,
                message="Unable to recognize objects in the image. Please try a clearer photo.",
            )
