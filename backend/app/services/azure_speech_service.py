"""
Azure Speech Service
Handles speech-to-text and pronunciation assessment using Azure Cognitive Services Speech SDK
"""
import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import azure.cognitiveservices.speech as speechsdk
import openai

from app.core.config import settings

logger = logging.getLogger(__name__)


class AzureSpeechService:
    """Service for Azure Speech API - Pronunciation Assessment using Speech SDK"""

    def __init__(self):
        """Initialize Azure Speech Service"""
        self.speech_key = settings.AZURE_SPEECH_KEY if hasattr(settings, 'AZURE_SPEECH_KEY') else os.getenv('AZURE_SPEECH_KEY')
        self.speech_region = settings.AZURE_SPEECH_REGION if hasattr(settings, 'AZURE_SPEECH_REGION') else os.getenv('AZURE_SPEECH_REGION', 'eastus')

        logger.info(f"[AzureSpeechService.__init__] speech_key present: {bool(self.speech_key)}, region: {self.speech_region}")
        if not self.speech_key:
            logger.info("WARNING: AZURE_SPEECH_KEY not found. Speech grading will not work.")

        # Initialize Speech SDK config
        if self.speech_key:
            self.speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )
        else:
            self.speech_config = None

        # Initialize OpenAI for feedback generation
        self.openai_api_key = settings.OPENAI_API_KEY if hasattr(settings, 'OPENAI_API_KEY') else os.getenv('OPENAI_API_KEY')
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.openai_model = settings.OPENAI_MODEL if hasattr(settings, 'OPENAI_MODEL') else os.getenv('OPENAI_MODEL', 'gpt-5-nano')
            self.openai_transcription_model = os.getenv(
                "OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe"
            )
        else:
            self.openai_model = None
            self.openai_transcription_model = None
            logger.info("WARNING: OPENAI_API_KEY not found. Will use template feedback.")

    def transcribe_audio(self, audio_file_path: str, language: str = "en-US") -> dict:
        """
        Transcribe audio without reference text (for spontaneous speech)

        Args:
            audio_file_path: Path to audio file (wav, mp3, webm, etc.)
            language: Language code (en-US, vi-VN, etc.)

        Returns:
            dict: Transcription results
        """
        logger.info(f"[transcribe_audio] START - audio: {audio_file_path}, language: {language}")

        if not self.speech_config:
            logger.error("[transcribe_audio] ERROR: No Azure key configured")
            return self._transcribe_with_openai(audio_file_path, language)

        wav_path = None
        try:
            # Convert audio to 16kHz mono PCM WAV for Azure Speech SDK
            src_path = Path(audio_file_path)
            fd, wav_path = tempfile.mkstemp(suffix='.wav')
            os.close(fd)

            try:
                # ffmpeg conversion
                cmd = [
                    'ffmpeg', '-y',
                    '-i', str(src_path),
                    '-ac', '1',           # mono
                    '-ar', '16000',       # 16kHz
                    '-f', 'wav',
                    '-acodec', 'pcm_s16le',
                    wav_path
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                logger.info(f"[transcribe_audio] Audio converted to WAV: {wav_path}")
            except Exception as conv_err:
                logger.warning(f"[transcribe_audio] ffmpeg conversion failed: {conv_err}")
                # Try using original file
                if os.path.exists(wav_path):
                    os.unlink(wav_path)
                wav_path = str(src_path)

            # Configure audio input from file
            audio_config = speechsdk.audio.AudioConfig(filename=wav_path)

            # Create speech recognizer (NO pronunciation assessment for spontaneous speech)
            self.speech_config.speech_recognition_language = language

            # Set longer timeout for initial silence (15 seconds instead of default 5)
            self.speech_config.set_property(
                speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
                "15000"
            )

            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            logger.info("[transcribe_audio] Calling Azure Speech SDK recognize_once()...")

            # Perform recognition
            result = recognizer.recognize_once()

            logger.info(f"[transcribe_audio] Recognition result reason: {result.reason}")

            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                logger.info(f"[transcribe_audio] Recognized text: {result.text}")
                return {
                    "success": True,
                    "transcription": result.text,
                    "pronunciation_assessment": None  # No assessment for spontaneous speech
                }

            if result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning(f"[transcribe_audio] No speech recognized. Details: {result.no_match_details}")
                fallback = self._transcribe_with_openai(audio_file_path, language)
                if fallback["success"]:
                    return fallback
                fallback.setdefault("status_code", 422)
                return fallback

            if result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                logger.error(f"[transcribe_audio] Recognition canceled: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    logger.error(f"[transcribe_audio] Error details: {cancellation.error_details}")
                    fallback = self._transcribe_with_openai(audio_file_path, language)
                    if fallback["success"]:
                        return fallback
                    fallback.setdefault("status_code", 502)
                    return fallback
                fallback = self._transcribe_with_openai(audio_file_path, language)
                if fallback["success"]:
                    return fallback
                fallback.setdefault("status_code", 500)
                return fallback

            logger.error(f"[transcribe_audio] Recognition failed with reason: {result.reason}")
            fallback = self._transcribe_with_openai(audio_file_path, language)
            if fallback["success"]:
                return fallback
            fallback.setdefault("status_code", 500)
            fallback.setdefault("error", f"Recognition failed: {result.reason}")
            return fallback

        except Exception as e:
            logger.error(f"[transcribe_audio] Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            fallback = self._transcribe_with_openai(audio_file_path, language)
            if fallback["success"]:
                return fallback
            fallback.setdefault("status_code", 500)
            fallback.setdefault("error", str(e))
            return fallback
        finally:
            # Cleanup temp file
            try:
                if wav_path and wav_path != str(audio_file_path) and os.path.exists(wav_path):
                    os.unlink(wav_path)
            except Exception:
                pass

    def _transcribe_with_openai(self, audio_file_path: str, language: str) -> dict[str, Any]:
        """Fallback transcription using OpenAI Whisper/GPT audio models."""
        if not self.openai_api_key:
            logger.error("[transcribe_audio] No transcription service available (Azure & OpenAI unset)")
            return {
                "success": False,
                "error": "Speech transcription is not configured. Please set AZURE_SPEECH_KEY or OPENAI_API_KEY.",
                "transcription": "",
                "status_code": 503,
            }

        model_name = self.openai_transcription_model or "gpt-4o-mini-transcribe"
        logger.info(
            f"[transcribe_audio] Using OpenAI fallback transcription with model: {model_name}"
        )

        try:
            language_code = language.split("-")[0] if language else None
            with open(audio_file_path, "rb") as audio_file:
                response = openai.audio.transcriptions.create(
                    model=model_name,
                    file=audio_file,
                    language=language_code,
                )

            text = getattr(response, "text", None)
            if text is None and isinstance(response, dict):
                text = response.get("text")

            if text is None:
                logger.warning("[transcribe_audio] OpenAI returned no text; defaulting to empty string")
                text = ""

            return {
                "success": True,
                "transcription": text,
                "pronunciation_assessment": None,
                "status_code": 200,
            }

        except Exception as openai_error:
            logger.error(f"[transcribe_audio] OpenAI fallback failed: {openai_error}")
            return {
                "success": False,
                "error": f"OpenAI transcription failed: {openai_error}",
                "transcription": "",
                "status_code": 502,
            }

    def assess_pronunciation(self, audio_file_path: str, reference_text: str, language: str = "en-US") -> dict:
        """
        Assess pronunciation using Azure Speech SDK

        Args:
            audio_file_path: Path to audio file (wav, mp3, webm, etc.)
            reference_text: The text that should be spoken
            language: Language code (en-US, vi-VN, etc.)

        Returns:
            dict: Assessment results with scores
        """
        logger.info(f"[assess_pronunciation] START - audio: {audio_file_path}, ref: {reference_text[:50] if reference_text else None}")

        if not self.speech_config:
            logger.info("[assess_pronunciation] ERROR: No Azure key configured")
            return {
                "error": "Azure Speech API key not configured",
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }

        wav_path = None
        try:
            # Convert audio to 16kHz mono PCM WAV for Azure Speech SDK
            src_path = Path(audio_file_path)
            fd, wav_path = tempfile.mkstemp(suffix='.wav')
            os.close(fd)

            try:
                # ffmpeg conversion
                cmd = [
                    'ffmpeg', '-y',
                    '-i', str(src_path),
                    '-ac', '1',           # mono
                    '-ar', '16000',       # 16kHz
                    '-f', 'wav',
                    '-acodec', 'pcm_s16le',
                    wav_path
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                logger.info(f"[assess_pronunciation] Audio converted to WAV: {wav_path}")
            except Exception as conv_err:
                logger.info(f"[assess_pronunciation] ffmpeg conversion failed: {conv_err}")
                # Try using original file
                if os.path.exists(wav_path):
                    os.unlink(wav_path)
                wav_path = str(src_path)

            # Configure audio input from file
            audio_config = speechsdk.audio.AudioConfig(filename=wav_path)

            # Configure pronunciation assessment
            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text or "",
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )

            # Create speech recognizer
            self.speech_config.speech_recognition_language = language
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )

            # Apply pronunciation config to recognizer
            pronunciation_config.apply_to(recognizer)

            logger.info("[assess_pronunciation] Calling Azure Speech SDK recognize_once()...")

            # Perform recognition
            result = recognizer.recognize_once()

            logger.info(f"[assess_pronunciation] Recognition result reason: {result.reason}")

            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                logger.info(f"[assess_pronunciation] Recognized text: {result.text}")

                # Get pronunciation assessment result
                pronunciation_result = speechsdk.PronunciationAssessmentResult(result)

                logger.info(f"[assess_pronunciation] Pronunciation scores - "
                      f"Accuracy: {pronunciation_result.accuracy_score}, "
                      f"Fluency: {pronunciation_result.fluency_score}, "
                      f"Completeness: {pronunciation_result.completeness_score}, "
                      f"Pronunciation: {pronunciation_result.pronunciation_score}")

                # Get detailed JSON result
                json_result = json.loads(
                    result.properties.get(speechsdk.PropertyId.SpeechServiceResponse_JsonResult)
                )

                return {
                    "recognized_text": result.text,
                    "reference_text": reference_text,  # Store reference for feedback
                    "accuracy_score": pronunciation_result.accuracy_score,
                    "fluency_score": pronunciation_result.fluency_score,
                    "completeness_score": pronunciation_result.completeness_score,
                    "pronunciation_score": pronunciation_result.pronunciation_score,
                    "words": json_result.get('NBest', [{}])[0].get('Words', []),
                    "fallback_freeform": False,
                    "json_result": json_result
                }

            if result.reason == speechsdk.ResultReason.NoMatch:
                logger.info(f"[assess_pronunciation] No speech recognized. Details: {result.no_match_details}")
                return {
                    "error": "No speech could be recognized",
                    "accuracy_score": 0,
                    "fluency_score": 0,
                    "completeness_score": 0,
                    "pronunciation_score": 0
                }

            if result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                logger.info(f"[assess_pronunciation] Recognition canceled: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    logger.info(f"[assess_pronunciation] Error details: {cancellation.error_details}")
                    return {
                        "error": f"Recognition error: {cancellation.error_details}",
                        "accuracy_score": 0,
                        "fluency_score": 0,
                        "completeness_score": 0,
                        "pronunciation_score": 0
                    }
                return {
                    "error": f"Recognition canceled: {cancellation.reason}",
                    "accuracy_score": 0,
                    "fluency_score": 0,
                    "completeness_score": 0,
                    "pronunciation_score": 0
                }

            logger.info(f"[assess_pronunciation] Recognition failed with reason: {result.reason}")
            return {
                "error": f"Recognition failed: {result.reason}",
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }

        except Exception as e:
            logger.info(f"[assess_pronunciation] Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }
        finally:
            # Cleanup temp file
            try:
                if wav_path and wav_path != str(audio_file_path) and os.path.exists(wav_path):
                    os.unlink(wav_path)
            except Exception:
                pass

    def calculate_speaking_score(self, assessment_result: dict, max_score: float = 10.0) -> dict:
        """
        Calculate final speaking score from Azure assessment

        Scoring breakdown:
        - Pronunciation (40%): How accurately words are pronounced
        - Fluency (30%): How smoothly and naturally spoken
        - Completeness (20%): How complete the response is
        - Accuracy (10%): Speech recognition accuracy
        """
        if "error" in assessment_result:
            return {
                "score": 0,
                "max_score": max_score,
                "breakdown": {
                    "pronunciation": 0,
                    "fluency": 0,
                    "completeness": 0,
                    "accuracy": 0
                },
                "feedback": f"Lỗi: {assessment_result['error']}"
            }

        # Get scores (0-100 scale from Azure)
        pronunciation = assessment_result.get('pronunciation_score', 0)
        fluency = assessment_result.get('fluency_score', 0)
        completeness = assessment_result.get('completeness_score', 0)
        accuracy = assessment_result.get('accuracy_score', 0)

        # Calculate weighted score
        weighted_score = (
            pronunciation * 0.4 +
            fluency * 0.3 +
            completeness * 0.2 +
            accuracy * 0.1
        )

        # Convert to max_score scale
        final_score = (weighted_score / 100) * max_score

        # Generate feedback
        feedback_parts = []

        if pronunciation >= 80:
            feedback_parts.append("✅ Phát âm rất tốt")
        elif pronunciation >= 60:
            feedback_parts.append("⚠️ Phát âm cần cải thiện")
        else:
            feedback_parts.append("❌ Phát âm cần luyện tập nhiều hơn")

        if fluency >= 80:
            feedback_parts.append("✅ Nói trôi chảy tự nhiên")
        elif fluency >= 60:
            feedback_parts.append("⚠️ Cần nói tự nhiên hơn")
        else:
            feedback_parts.append("❌ Cần luyện tập để nói trôi chảy hơn")

        if completeness >= 80:
            feedback_parts.append("✅ Hoàn thành đầy đủ nội dung")
        elif completeness >= 60:
            feedback_parts.append("⚠️ Thiếu một số phần")
        else:
            feedback_parts.append("❌ Nội dung chưa đầy đủ")

        return {
            "score": round(final_score, 2),
            "max_score": max_score,
            "breakdown": {
                "pronunciation": round(pronunciation, 1),
                "fluency": round(fluency, 1),
                "completeness": round(completeness, 1),
                "accuracy": round(accuracy, 1)
            },
            "recognized_text": assessment_result.get('recognized_text', ''),
            "used_freeform": bool(assessment_result.get('fallback_freeform', False)),
            "feedback": " | ".join(feedback_parts),
            "detailed_feedback": self._generate_detailed_feedback(
                pronunciation,
                fluency,
                completeness,
                accuracy,
                reference_text=assessment_result.get('reference_text', ''),
                recognized_text=assessment_result.get('recognized_text', ''),
                words_detail=assessment_result.get('words', [])
            )
        }

    def _generate_detailed_feedback(self, pronunciation: float, fluency: float, completeness: float, accuracy: float, reference_text: str = "", recognized_text: str = "", words_detail: list = None) -> str:
        """Generate detailed feedback using OpenAI based on Azure pronunciation scores"""

        # If OpenAI not available, use template feedback
        if not self.openai_model:
            return self._generate_template_feedback(pronunciation, fluency, completeness, accuracy)

        try:
            # Prepare detailed context for OpenAI
            prompt = f"""Bạn là giáo viên tiếng Anh đang chấm bài nói của học sinh. Hãy đưa ra nhận xét chi tiết bằng tiếng Việt dựa trên kết quả đánh giá phát âm từ Azure Speech API.

**Thông tin đánh giá:**
- Điểm phát âm (Pronunciation): {pronunciation:.1f}/100
- Điểm độ trôi chảy (Fluency): {fluency:.1f}/100
- Điểm hoàn thiện (Completeness): {completeness:.1f}/100
- Điểm chính xác (Accuracy): {accuracy:.1f}/100

**Nội dung yêu cầu:** {reference_text if reference_text else "Không có"}
**Nội dung học sinh nói:** {recognized_text if recognized_text else "Không nhận diện được"}

Hãy đưa ra nhận xét chi tiết với cấu trúc sau:

1. **Tổng quan**: Đánh giá chung về bài nói (2-3 câu)

2. **Phát âm (Pronunciation {pronunciation:.1f}/100)**:
   - Điểm mạnh
   - Điểm cần cải thiện (nếu có)
   - Lời khuyên cụ thể

3. **Độ trôi chảy (Fluency {fluency:.1f}/100)**:
   - Nhận xét về nhịp điệu, tốc độ nói
   - Gợi ý cải thiện

4. **Tính hoàn chỉnh (Completeness {completeness:.1f}/100)**:
   - Đánh giá mức độ hoàn thành nội dung
   - Những phần còn thiếu (nếu có)

5. **Lời khuyên**: 2-3 lời khuyên thiết thực để cải thiện kỹ năng nói

Viết theo phong cách động viên, khích lệ học sinh. Dùng emoji phù hợp. Giới hạn khoảng 200-300 từ."""

            logger.info("[_generate_detailed_feedback] Calling OpenAI for feedback...")
            response = openai.chat.completions.create(
                model=self.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            feedback = response.choices[0].message.content.strip()
            logger.info(f"[_generate_detailed_feedback] OpenAI feedback generated: {len(feedback)} chars")
            return feedback

        except Exception as e:
            logger.info(f"[_generate_detailed_feedback] OpenAI error: {e}")
            # Fallback to template
            return self._generate_template_feedback(pronunciation, fluency, completeness, accuracy)

    def _generate_template_feedback(self, pronunciation: float, fluency: float, completeness: float, accuracy: float) -> str:
        """Generate template feedback when OpenAI is not available"""
        feedback = []

        feedback.append(f"**Phát âm (Pronunciation):** {pronunciation:.1f}/100")
        if pronunciation >= 80:
            feedback.append("- Phát âm chuẩn xác, rõ ràng")
        elif pronunciation >= 60:
            feedback.append("- Cần chú ý phát âm một số từ cho chuẩn hơn")
        else:
            feedback.append("- Nên luyện tập phát âm các từ khó, nghe và lặp lại nhiều lần")

        feedback.append(f"\n**Độ trôi chảy (Fluency):** {fluency:.1f}/100")
        if fluency >= 80:
            feedback.append("- Nói trôi chảy, tự nhiên")
        elif fluency >= 60:
            feedback.append("- Có thể ngắt quãng ở một số chỗ, cần luyện tập để tự nhiên hơn")
        else:
            feedback.append("- Nên đọc to nhiều lần để quen với nhịp điệu và tốc độ nói")

        feedback.append(f"\n**Tính hoàn chỉnh (Completeness):** {completeness:.1f}/100")
        if completeness >= 80:
            feedback.append("- Hoàn thành đầy đủ nội dung yêu cầu")
        elif completeness >= 60:
            feedback.append("- Thiếu một số phần, hãy đảm bảo đọc/nói hết nội dung")
        else:
            feedback.append("- Chưa hoàn thành đủ nội dung, cần đọc/nói đầy đủ hơn")

        feedback.append(f"\n**Độ chính xác (Accuracy):** {accuracy:.1f}/100")

        return "\n".join(feedback)


# Initialize service
azure_speech_service = AzureSpeechService()
