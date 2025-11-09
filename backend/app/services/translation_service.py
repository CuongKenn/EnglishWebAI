"""
Translation Service using deep-translator library
Supports multiple translation engines: Google, Microsoft, DeepL, etc.
"""

import logging

from deep_translator import GoogleTranslator, MyMemoryTranslator
from langdetect import DetectorFactory, detect

# Set seed for consistent language detection
DetectorFactory.seed = 0

logger = logging.getLogger(__name__)


class TranslationService:
    """Service for translating text between languages"""

    # Supported language codes
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'vi': 'Vietnamese',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'zh-CN': 'Chinese (Simplified)',
        'zh-TW': 'Chinese (Traditional)',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ru': 'Russian',
        'ar': 'Arabic',
        'pt': 'Portuguese',
        'it': 'Italian',
        'th': 'Thai',
        'hi': 'Hindi'
    }

    def __init__(self):
        self.translator = None

    def detect_language(self, text: str) -> str:
        """
        Detect the language of the given text

        Args:
            text: Text to detect language

        Returns:
            Language code (e.g., 'en', 'vi')
        """
        try:
            if not text or len(text.strip()) < 3:
                return 'en'  # Default to English

            return detect(text)
        except Exception as e:
            logger.error(f"Error detecting language: {e}")
            return 'en'

    def translate(
        self,
        text: str,
        target_lang: str = 'vi',
        source_lang: str | None = None,
        engine: str = 'google'
    ) -> dict[str, any]:
        """
        Translate text to target language

        Args:
            text: Text to translate
            target_lang: Target language code (default: 'vi')
            source_lang: Source language code (auto-detect if None)
            engine: Translation engine ('google', 'mymemory', 'pons')

        Returns:
            Dict with translation result and metadata
        """
        try:
            if not text or not text.strip():
                return {
                    'success': False,
                    'error': 'Empty text provided'
                }

            # Auto-detect source language if not provided
            if not source_lang or source_lang == 'auto':
                detected_lang = self.detect_language(text)
                source_lang = detected_lang

            # If source and target are the same, no translation needed
            if source_lang == target_lang:
                return {
                    'success': True,
                    'original_text': text,
                    'translated_text': text,
                    'source_language': source_lang,
                    'target_language': target_lang,
                    'engine': engine,
                    'message': 'Source and target languages are the same'
                }

            # Choose translation engine
            translated_text = None

            if engine == 'google':
                translator = GoogleTranslator(source=source_lang, target=target_lang)
                translated_text = translator.translate(text)

            elif engine == 'mymemory':
                translator = MyMemoryTranslator(source=source_lang, target=target_lang)
                translated_text = translator.translate(text)

            else:
                # Default to Google
                translator = GoogleTranslator(source=source_lang, target=target_lang)
                translated_text = translator.translate(text)

            return {
                'success': True,
                'original_text': text,
                'translated_text': translated_text,
                'source_language': source_lang,
                'target_language': target_lang,
                'engine': engine,
                'detected_language': source_lang if not source_lang else None
            }

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return {
                'success': False,
                'error': str(e),
                'original_text': text
            }

    def translate_batch(
        self,
        texts: list[str],
        target_lang: str = 'vi',
        source_lang: str | None = None,
        engine: str = 'google'
    ) -> list[dict[str, any]]:
        """
        Translate multiple texts

        Args:
            texts: List of texts to translate
            target_lang: Target language code
            source_lang: Source language code (auto-detect if None)
            engine: Translation engine

        Returns:
            List of translation results
        """
        results = []
        for text in texts:
            result = self.translate(
                text=text,
                target_lang=target_lang,
                source_lang=source_lang,
                engine=engine
            )
            results.append(result)

        return results

    def get_supported_languages(self) -> dict[str, str]:
        """
        Get list of supported languages

        Returns:
            Dict of language codes and names
        """
        return self.SUPPORTED_LANGUAGES

    def translate_bidirectional(
        self,
        text: str,
        lang1: str = 'en',
        lang2: str = 'vi',
        engine: str = 'google'
    ) -> dict[str, any]:
        """
        Translate text both ways (useful for language learning)

        Args:
            text: Text to translate
            lang1: First language
            lang2: Second language
            engine: Translation engine

        Returns:
            Dict with both translations
        """
        try:
            # Detect which language the text is in
            detected_lang = self.detect_language(text)

            if detected_lang == lang1:
                # Translate from lang1 to lang2
                result = self.translate(text, target_lang=lang2, source_lang=lang1, engine=engine)
                return {
                    'success': True,
                    'original_text': text,
                    'original_language': lang1,
                    'translated_text': result.get('translated_text'),
                    'translated_language': lang2,
                    'direction': f'{lang1} -> {lang2}'
                }
            # Translate from lang2 to lang1
            result = self.translate(text, target_lang=lang1, source_lang=lang2, engine=engine)
            return {
                'success': True,
                'original_text': text,
                'original_language': lang2,
                'translated_text': result.get('translated_text'),
                'translated_language': lang1,
                'direction': f'{lang2} -> {lang1}'
            }
        except Exception as e:
            logger.error(f"Bidirectional translation error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
translation_service = TranslationService()
