"""
Azure Speech Service
Handles speech-to-text and pronunciation assessment using Azure Cognitive Services
"""
import os
import json
import requests
from app.core.config import settings

class AzureSpeechService:
    """Service for Azure Speech API - Pronunciation Assessment"""
    
    def __init__(self):
        """Initialize Azure Speech Service"""
        self.speech_key = settings.AZURE_SPEECH_KEY if hasattr(settings, 'AZURE_SPEECH_KEY') else os.getenv('AZURE_SPEECH_KEY')
        self.speech_region = settings.AZURE_SPEECH_REGION if hasattr(settings, 'AZURE_SPEECH_REGION') else os.getenv('AZURE_SPEECH_REGION', 'eastus')
        
        if not self.speech_key:
            print("WARNING: AZURE_SPEECH_KEY not found. Speech grading will not work.")
        
        self.endpoint = f"https://{self.speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
    
    async def assess_pronunciation(self, audio_file_path: str, reference_text: str, language: str = "en-US") -> dict:
        """
        Assess pronunciation using Azure Speech API
        
        Args:
            audio_file_path: Path to audio file (wav, mp3)
            reference_text: The text that should be spoken
            language: Language code (en-US, vi-VN, etc.)
        
        Returns:
            dict: Assessment results with scores
        """
        if not self.speech_key:
            return {
                "error": "Azure Speech API key not configured",
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }
        
        try:
            # Read audio file
            with open(audio_file_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Prepare headers
            headers = {
                'Ocp-Apim-Subscription-Key': self.speech_key,
                'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                'Accept': 'application/json'
            }
            
            # Pronunciation assessment parameters
            pronunciation_params = {
                "ReferenceText": reference_text,
                "GradingSystem": "HundredMark",
                "Granularity": "Phoneme",
                "Dimension": "Comprehensive",
                "EnableMiscue": True
            }
            
            # URL parameters
            params = {
                'language': language,
                'format': 'detailed',
                'pronunciationAssessment': json.dumps(pronunciation_params)
            }
            
            # Make API request
            response = requests.post(
                self.endpoint,
                headers=headers,
                params=params,
                data=audio_data,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"Azure Speech API Error: {response.status_code} - {response.text}")
                return {
                    "error": f"API Error: {response.status_code}",
                    "accuracy_score": 0,
                    "fluency_score": 0,
                    "completeness_score": 0,
                    "pronunciation_score": 0
                }
            
            result = response.json()
            
            # Extract pronunciation assessment
            if 'NBest' in result and len(result['NBest']) > 0:
                best_result = result['NBest'][0]
                assessment = best_result.get('PronunciationAssessment', {})
                
                return {
                    "recognized_text": best_result.get('Display', ''),
                    "accuracy_score": assessment.get('AccuracyScore', 0),
                    "fluency_score": assessment.get('FluencyScore', 0),
                    "completeness_score": assessment.get('CompletenessScore', 0),
                    "pronunciation_score": assessment.get('PronScore', 0),
                    "words": best_result.get('Words', []),
                    "raw_result": result
                }
            else:
                return {
                    "error": "No recognition result",
                    "accuracy_score": 0,
                    "fluency_score": 0,
                    "completeness_score": 0,
                    "pronunciation_score": 0
                }
                
        except FileNotFoundError:
            return {
                "error": f"Audio file not found: {audio_file_path}",
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }
        except Exception as e:
            print(f"Azure Speech Assessment Error: {str(e)}")
            return {
                "error": str(e),
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "pronunciation_score": 0
            }
    
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
            "feedback": " | ".join(feedback_parts),
            "detailed_feedback": self._generate_detailed_feedback(pronunciation, fluency, completeness, accuracy)
        }
    
    def _generate_detailed_feedback(self, pronunciation: float, fluency: float, completeness: float, accuracy: float) -> str:
        """Generate detailed feedback based on scores"""
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
