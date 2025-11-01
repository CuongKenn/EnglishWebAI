"""
AI Grading Service
Auto-grade student submissions using AI (ChatGPT + Azure Speech)
"""
from openai import OpenAI
from app.core.config import settings
import os
import json
import logging
from typing import Dict, List, Optional
import azure.cognitiveservices.speech as speechsdk

logger = logging.getLogger(__name__)


class AIGradingService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        # OpenAI client (optional). Only required for writing/speaking content grading.
        self.client = OpenAI(api_key=self.openai_key) if self.openai_key else None
        # OpenAI model from environment/config
        self.model = settings.OPENAI_MODEL

        # Azure Speech for pronunciation assessment (optional)
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.speech_region = os.getenv("AZURE_SPEECH_REGION", "eastasia")
    
    async def grade_multiple_choice(self, question: Dict, student_answer: str) -> Dict:
        """Grade multiple choice question"""
        correct = question.get("correct_answer", "")
        
        # Handle None/empty values
        if student_answer is None or student_answer == "":
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": question.get("points", 0.25),
                "feedback": f"Chưa trả lời. Đáp án đúng là: {correct}"
            }
        
        # Normalize answers for comparison (trim whitespace, collapse spaces, uppercase)
        def normalize(text):
            if text is None:
                return ""
            return " ".join(str(text).strip().upper().split())
        
        student_normalized = normalize(student_answer)
        correct_normalized = normalize(correct)
        
        is_correct = student_normalized == correct_normalized
        points_earned = question.get("points", 0.25) if is_correct else 0
        
        logger.debug(f"[GRADE_MC] Q{question.get('id')}: Student='{student_normalized}' vs Correct='{correct_normalized}' => {is_correct}")
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 0.25),
            "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng là: {correct}"
        }
    
    async def grade_fill_blank(self, question: Dict, student_answer: str) -> Dict:
        """Grade fill in the blank using code-based string matching (no AI)."""
        from difflib import SequenceMatcher
        import string
        
        correct_answer = question.get("correct_answer", "")

        def _normalize(text: str) -> str:
            # Trim, lowercase, and collapse multiple spaces
            if text is None:
                return ""
            return " ".join(str(text).strip().lower().split())
        
        def _normalize_advanced(text: str) -> str:
            """Advanced normalize: remove articles, punctuation, trim, lowercase"""
            if text is None:
                return ""
            
            # Remove punctuation
            text = text.translate(str.maketrans('', '', string.punctuation))
            
            # Lowercase and split into words
            words = text.lower().split()
            
            # Remove common English articles
            articles = {'a', 'an', 'the'}
            words = [w for w in words if w not in articles]
            
            return " ".join(words)
        
        def is_fuzzy_match(s1: str, s2: str, threshold: float = 0.9) -> bool:
            """Check if two strings are similar enough (allows 1-2 typos)"""
            if not s1 or not s2:
                return False
            ratio = SequenceMatcher(None, s1, s2).ratio()
            return ratio >= threshold

        # Handle None/empty values
        if student_answer is None or student_answer == "":
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": question.get("points", 0.25),
                "feedback": f"Chưa trả lời. Đáp án đúng: {correct_answer}"
            }

        student_norm = _normalize(student_answer)
        correct_norm = _normalize(correct_answer)

        # Check exact match first (with basic normalize)
        is_correct = (student_norm == correct_norm)
        feedback_type = "exact"  # Track match type for feedback
        
        # If not exact match, check if correct_answer contains multiple acceptable answers separated by | or /
        if not is_correct and ('|' in correct_answer or '/' in correct_answer):
            # Split by | or / to get multiple acceptable answers
            separators = ['|', '/']
            acceptable_answers = [correct_answer]
            for sep in separators:
                if sep in correct_answer:
                    acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                    break
            
            # Check if student answer matches any acceptable answer
            for acceptable in acceptable_answers:
                if _normalize(acceptable) == student_norm:
                    is_correct = True
                    feedback_type = "exact"
                    break
        
        # If still not correct, try advanced normalize (strip articles & punctuation)
        if not is_correct:
            student_advanced = _normalize_advanced(student_answer)
            correct_advanced = _normalize_advanced(correct_answer)
            
            if student_advanced == correct_advanced:
                is_correct = True
                feedback_type = "advanced"
            # Also check against multiple acceptable answers
            elif '|' in correct_answer or '/' in correct_answer:
                separators = ['|', '/']
                acceptable_answers = [correct_answer]
                for sep in separators:
                    if sep in correct_answer:
                        acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                        break
                
                for acceptable in acceptable_answers:
                    if _normalize_advanced(acceptable) == student_advanced:
                        is_correct = True
                        feedback_type = "advanced"
                        break
        
        # If still not correct, try fuzzy matching (allows typos)
        if not is_correct:
            # Try fuzzy match with main correct answer
            if is_fuzzy_match(student_norm, correct_norm, threshold=0.9):
                is_correct = True
                feedback_type = "fuzzy"
            # Also try fuzzy match with acceptable answers if they exist
            elif '|' in correct_answer or '/' in correct_answer:
                separators = ['|', '/']
                acceptable_answers = [correct_answer]
                for sep in separators:
                    if sep in correct_answer:
                        acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                        break
                
                for acceptable in acceptable_answers:
                    if is_fuzzy_match(student_norm, _normalize(acceptable), threshold=0.9):
                        is_correct = True
                        feedback_type = "fuzzy"
                        break

        max_points = question.get("points", 0.25)
        points_earned = max_points if is_correct else 0
        
        # Generate feedback based on match type
        if is_correct:
            if feedback_type == "fuzzy":
                feedback = "Gần đúng! Có thể có lỗi chính tả nhỏ."
            elif feedback_type == "advanced":
                feedback = "Chính xác! (Bỏ qua dấu câu và mạo từ)"
            else:
                feedback = "Chính xác!"
        else:
            feedback = f"Sai. Đáp án đúng: {correct_answer}"

        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": max_points,
            "feedback": feedback
        }
    
    async def grade_true_false(self, question: Dict, student_answer: str) -> Dict:
        """Grade true/false question"""
        correct_raw = question.get("correct_answer", "")
        
        # Debug: log raw values
        logger.debug(f"[GRADE_TF] ===== START =====")
        logger.debug(f"[GRADE_TF] Question ID: {question.get('id')}")
        logger.debug(f"[GRADE_TF] Correct answer RAW: '{correct_raw}' (type: {type(correct_raw)})")
        logger.debug(f"[GRADE_TF] Student answer RAW: '{student_answer}' (type: {type(student_answer)})")
        
        # Convert to string and normalize
        correct = str(correct_raw).strip().lower()
        logger.debug(f"[GRADE_TF] Correct answer normalized: '{correct}'")
        
        # Handle None/empty values
        if student_answer is None or student_answer == "":
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": question.get("points", 0.25),
                "feedback": f"Chưa trả lời. Đáp án đúng: {'Đúng' if correct in ['true', '1', 'yes', 'đúng'] else 'Sai'}"
            }
        
        student = str(student_answer).strip().lower()
        logger.debug(f"[GRADE_TF] Student answer normalized: '{student}'")
        
        # Normalize true values
        true_values = ['true', '1', 'yes', 'đúng', 't', 'y']
        false_values = ['false', '0', 'no', 'sai', 'f', 'n']
        
        # Map student answer to true/false
        student_normalized = None
        if student in true_values:
            student_normalized = 'true'
        elif student in false_values:
            student_normalized = 'false'
        else:
            # Invalid answer
            logger.debug(f"[GRADE_TF] ERROR: Invalid student answer '{student}' not in accepted values")
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": question.get("points", 0.25),
                "feedback": f"Đáp án không hợp lệ. Đáp án đúng: {'Đúng' if correct in true_values else 'Sai'}"
            }
        
        # Map correct answer to true/false
        correct_normalized = 'true' if correct in true_values else 'false'
        
        is_correct = student_normalized == correct_normalized
        points_earned = question.get("points", 0.25) if is_correct else 0
        
        logger.debug(f"[GRADE_TF] Student normalized: '{student_normalized}' vs Correct normalized: '{correct_normalized}'")
        logger.debug(f"[GRADE_TF] Result: {is_correct} - Points: {points_earned}/{question.get('points', 0.25)}")
        logger.debug(f"[GRADE_TF] ===== END =====")
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 0.25),
            "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng: {'Đúng' if correct_normalized == 'true' else 'Sai'}"
        }
    
    async def grade_matching(self, question: Dict, student_answer: Dict) -> Dict:
        """Grade matching question - supports both index-based and content-based keys"""
        correct_pairs = question.get("correct_answer", {})
        pairs = question.get("pairs", [])  # Get pairs array for index-based matching
        
        # Normalize function for case-insensitive matching
        def normalize(text):
            """Normalize text: lowercase, trim, collapse multiple spaces"""
            if text is None:
                return ""
            return " ".join(str(text).strip().lower().split())
        
        logger.debug(f"[GRADE_MATCHING] ===== START =====")
        logger.debug(f"[GRADE_MATCHING] Question ID: {question.get('id')}")
        logger.debug(f"[GRADE_MATCHING] Correct pairs: {correct_pairs} (type: {type(correct_pairs)})")
        logger.debug(f"[GRADE_MATCHING] Pairs array: {pairs}")
        logger.debug(f"[GRADE_MATCHING] Student answer: {student_answer} (type: {type(student_answer)})")
        
        # Handle None/empty values
        if not student_answer or not isinstance(student_answer, dict):
            logger.debug(f"[GRADE_MATCHING] ERROR: Invalid student answer - not dict or empty")
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": question.get("points", 0.25),
                "feedback": "Chưa trả lời hoặc định dạng không đúng. Ghép đúng 0 cặp."
            }
        
        correct_count = 0
        total_pairs = 0
        
        # Determine matching format: index-based (0,1,2...) or content-based (left values)
        # Check if correct_answer uses numeric string keys or if pairs array exists
        is_index_based = False
        if pairs and len(pairs) > 0:
            # If pairs array exists, use index-based matching
            is_index_based = True
            total_pairs = len(pairs)
            logger.debug(f"[GRADE_MATCHING] Using INDEX-BASED matching with {total_pairs} pairs")
            
            for idx, pair in enumerate(pairs):
                if not isinstance(pair, dict) or 'left' not in pair or 'right' not in pair:
                    logger.debug(f"[GRADE_MATCHING] WARNING: Invalid pair format at index {idx}: {pair}")
                    continue
                
                correct_right = pair['right']
                
                # Try multiple key formats for student answer
                student_right = None
                for key_format in [idx, str(idx), int(idx) if isinstance(idx, str) and idx.isdigit() else None]:
                    if key_format is not None and key_format in student_answer:
                        student_right = student_answer[key_format]
                        break
                
                # Normalize and compare (case-insensitive, trim spaces)
                student_right_norm = normalize(student_right) if student_right else ""
                correct_right_norm = normalize(correct_right)
                is_match = student_right_norm == correct_right_norm
                
                logger.debug(f"[GRADE_MATCHING] Pair {idx} '{pair['left']}' → student: '{student_right_norm}' vs correct: '{correct_right_norm}' => {is_match}")
                
                if is_match:
                    correct_count += 1
        
        else:
            # Fallback to content-based matching (old format)
            total_pairs = len(correct_pairs)
            logger.debug(f"[GRADE_MATCHING] Using CONTENT-BASED matching with {total_pairs} pairs")
            
            if total_pairs == 0:
                logger.debug(f"[GRADE_MATCHING] ERROR: No correct pairs defined in question")
                return {
                    "is_correct": False,
                    "points_earned": 0,
                    "max_points": question.get("points", 0.25),
                    "feedback": "Câu hỏi không có đáp án đúng"
                }
            
            logger.debug(f"[GRADE_MATCHING] Correct answer keys: {list(correct_pairs.keys())}")
            logger.debug(f"[GRADE_MATCHING] Student answer keys: {list(student_answer.keys())}")
            
            for left, right in correct_pairs.items():
                student_right = student_answer.get(left)
                # Also try string/int conversion of key
                if student_right is None and isinstance(left, int):
                    student_right = student_answer.get(str(left))
                elif student_right is None and isinstance(left, str) and left.isdigit():
                    student_right = student_answer.get(int(left))
                
                # Normalize both for comparison (case-insensitive, trim spaces)
                student_right_norm = normalize(student_right) if student_right else ""
                right_norm = normalize(right) if right else ""
                is_match = student_right_norm == right_norm
                logger.debug(f"[GRADE_MATCHING] Checking '{left}': student='{student_right_norm}' vs correct='{right_norm}' => {is_match}")
                if is_match:
                    correct_count += 1
        
        # Validate for duplicate answers (same right value used multiple times)
        right_values = [v for v in student_answer.values() if v is not None and str(v).strip() != ""]
        normalized_right_values = [normalize(v) for v in right_values]
        unique_normalized = set(normalized_right_values)
        
        duplicate_warning = ""
        if len(normalized_right_values) != len(unique_normalized):
            duplicate_count = len(normalized_right_values) - len(unique_normalized)
            duplicate_warning = f" ⚠️ Phát hiện {duplicate_count} câu trả lời trùng lặp."
            logger.debug(f"[GRADE_MATCHING] WARNING: Duplicate answers detected - {duplicate_count} duplicates")
            logger.debug(f"[GRADE_MATCHING] All answers: {normalized_right_values}")
            logger.debug(f"[GRADE_MATCHING] Unique answers: {unique_normalized}")
        
        score_percentage = (correct_count / total_pairs * 100) if total_pairs > 0 else 0
        max_points = question.get("points", 0.25)
        points_earned = max_points * (correct_count / total_pairs) if total_pairs > 0 else 0
        
        logger.debug(f"[GRADE_MATCHING] Result: {correct_count}/{total_pairs} correct, {points_earned}/{max_points} points")
        logger.debug(f"[GRADE_MATCHING] ===== END =====")
        
        return {
            "is_correct": correct_count == total_pairs,
            "points_earned": round(points_earned, 2),
            "max_points": max_points,
            "feedback": f"Ghép đúng {correct_count}/{total_pairs} cặp ({score_percentage:.0f}%){duplicate_warning}"
        }
    
    async def grade_writing(self, question: Dict, student_text: str, prompt: str) -> Dict:
        """Grade writing essay using AI"""
        rubric = question.get("rubric", {})
        max_points = question.get("points", 2.5)
        
        # Check if OpenAI client is available
        if not self.client:
            return {
                "points_earned": 0,
                "max_points": max_points,
                "feedback": {},
                "overall_comment": "OpenAI API key chưa được cấu hình. Không thể chấm tự động.",
                "needs_review": True,
                "error": "OpenAI client not initialized"
            }
        
        try:
            rubric_str = "\n".join([f"- {key}: {value}" for key, value in rubric.items()])
            
            prompt_text = f"""You are an English teacher grading a student's essay.

Essay prompt: {prompt}
Student's essay:
{student_text}

Grading rubric:
{rubric_str}

Please grade the essay and provide:
1. Score out of {max_points} points
2. Detailed feedback in Vietnamese for each rubric criterion
3. Overall strengths and areas for improvement
4. Suggestions for improvement

Respond with JSON:
{{
    "score": 0-{max_points},
    "feedback": {{
        "content": "feedback on content",
        "grammar": "feedback on grammar",
        "vocabulary": "feedback on vocabulary",
        "structure": "feedback on structure"
    }},
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["area 1", "area 2"],
    "overall_comment": "Overall comment in Vietnamese"
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an experienced English teacher grading essays."},
                    {"role": "user", "content": prompt_text}
                ],
                temperature=0.5,
                max_tokens=800,
                response_format={"type": "json_object"}  # Force JSON response
            )
            
            content = response.choices[0].message.content
            
            # Check if content is None or empty
            if not content or content.strip() == "":
                logger.debug(f"[GRADE_WRITING] Empty response from OpenAI")
                return {
                    "points_earned": 0,
                    "max_points": max_points,
                    "feedback": {},
                    "overall_comment": "Lỗi: API không trả về kết quả. Vui lòng thử lại.",
                    "needs_review": True,
                    "error": "Empty API response"
                }
            
            content = content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Validate JSON before parsing
            if not content:
                logger.debug(f"[GRADE_WRITING] Content is empty after cleanup")
                return {
                    "points_earned": 0,
                    "max_points": max_points,
                    "feedback": {},
                    "overall_comment": "Lỗi: Không thể phân tích kết quả. Vui lòng thử lại.",
                    "needs_review": True,
                    "error": "Invalid JSON format"
                }
            
            result = json.loads(content)
            
            return {
                "points_earned": result.get("score", 0),
                "max_points": max_points,
                "feedback": result.get("feedback", {}),
                "strengths": result.get("strengths", []),
                "improvements": result.get("improvements", []),
                "overall_comment": result.get("overall_comment", ""),
                "needs_review": True  # Always needs teacher review
            }
            
        except json.JSONDecodeError as je:
            logger.info(f"Error grading writing - JSON decode error: {je}")
            logger.info(f"Raw content that failed to parse: {content if 'content' in locals() else 'N/A'}")
            return {
                "points_earned": 0,
                "max_points": max_points,
                "feedback": {},
                "overall_comment": "Lỗi khi phân tích kết quả từ AI. Giáo viên sẽ chấm thủ công.",
                "needs_review": True,
                "error": f"JSON decode error: {str(je)}"
            }
        except Exception as e:
            logger.info(f"Error grading writing: {e}")
            import traceback
            traceback.print_exc()
            return {
                "points_earned": 0,
                "max_points": max_points,
                "feedback": {},
                "overall_comment": "Lỗi khi chấm bài. Giáo viên sẽ chấm thủ công.",
                "needs_review": True,
                "error": str(e)
            }
    
    async def grade_speaking_pronunciation(self, audio_file_path: str, reference_text: str) -> Dict:
        """Grade speaking pronunciation using Azure Speech Assessment"""
        if not self.speech_key:
            return {
                "pronunciation_score": 0,
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "error": "Azure Speech key not configured",
                "success": False
            }
        
        try:
            import subprocess
            import os
            
            # Convert audio to WAV if needed (Azure Speech SDK requires WAV format)
            wav_path = audio_file_path
            if not audio_file_path.lower().endswith('.wav'):
                wav_path = audio_file_path.rsplit('.', 1)[0] + '_converted.wav'
                
                # Use ffmpeg to convert to 16kHz mono WAV
                try:
                    subprocess.run([
                        'ffmpeg', '-y',
                        '-i', audio_file_path,
                        '-ar', '16000',
                        '-ac', '1',
                        '-c:a', 'pcm_s16le',
                        wav_path
                    ], check=True, capture_output=True)
                    logger.debug(f"[GRADE_speaking_pronunciation] Audio converted to WAV: {wav_path}")
                except subprocess.CalledProcessError as conv_err:
                    logger.debug(f"[GRADE_speaking_pronunciation] ffmpeg conversion failed: {conv_err}")
                    return {
                        "pronunciation_score": 0,
                        "accuracy_score": 0,
                        "fluency_score": 0,
                        "completeness_score": 0,
                        "error": f"Audio conversion failed: {conv_err}",
                        "success": False
                    }
            
            # Configure speech recognition
            speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )
            
            # Configure pronunciation assessment
            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )
            
            # Audio input from file
            audio_config = speechsdk.audio.AudioConfig(filename=wav_path)
            
            # Create recognizer
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config,
                audio_config=audio_config,
                language="en-US"
            )
            
            # Apply pronunciation assessment config
            pronunciation_config.apply_to(speech_recognizer)
            
            # Recognize
            result = speech_recognizer.recognize_once_async().get()
            
            # Clean up converted file
            if wav_path != audio_file_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except:
                    pass
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
                
                return {
                    "pronunciation_score": pronunciation_result.pronunciation_score,
                    "accuracy_score": pronunciation_result.accuracy_score,
                    "fluency_score": pronunciation_result.fluency_score,
                    "completeness_score": pronunciation_result.completeness_score,
                    "recognized_text": result.text,
                    "success": True
                }
            else:
                return {
                    "pronunciation_score": 0,
                    "accuracy_score": 0,
                    "fluency_score": 0,
                    "completeness_score": 0,
                    "error": f"Recognition failed: {result.reason}",
                    "success": False
                }
                
        except Exception as e:
            logger.info(f"Error in pronunciation assessment: {e}")
            import traceback
            traceback.print_exc()
            return {
                "pronunciation_score": 0,
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "error": str(e),
                "success": False
            }
    
    async def grade_speaking_content(self, audio_transcript: str, question: str, rubric: Dict) -> Dict:
        """Grade speaking content using ChatGPT with detailed feedback"""
        max_points = rubric.get("points", 0.83)
        
        # Check if OpenAI client is available
        if not self.client:
            return {
                "content_score": 0,
                "content_feedback": "OpenAI API key chưa được cấu hình",
                "grammar_feedback": "",
                "vocabulary_feedback": "",
                "pronunciation_note": "",
                "strengths": [],
                "improvements": [],
                "suggestions": [],
                "overall_comment": "Không thể chấm tự động. Cần giáo viên chấm thủ công.",
                "error": "OpenAI client not initialized"
            }
        
        try:
            rubric_str = "\n".join([f"- {key}: {value}" for key, value in rubric.items() if key != "points"])
            
            prompt = f"""Bạn là một giáo viên tiếng Anh đang chấm bài nói của học sinh. Hãy đánh giá và đưa ra nhận xét chi tiết.

Câu hỏi/Đề bài: {question}
Câu trả lời của học sinh (đã chuyển thành văn bản): {audio_transcript}

Tiêu chí đánh giá:
{rubric_str}

Hãy đánh giá dựa trên:
1. Nội dung: Độ liên quan và đầy đủ của câu trả lời
2. Ngữ pháp: Sử dụng cấu trúc câu và thì đúng
3. Từ vựng: Sự phong phú và chính xác
4. Độ mạch lạc: Tổ chức ý và sự liên kết

QUAN TRỌNG: 
- Sử dụng xưng hô "cô" (giáo viên) và "em" (học sinh)
- Đưa ra nhận xét cụ thể, chi tiết
- Chỉ ra điểm tốt và điểm cần cải thiện
- Gợi ý cách cải thiện cụ thể

Trả về JSON với format:
{{
    "score": 0-{max_points} (điểm số),
    "content_feedback": "Nhận xét chi tiết về nội dung (80-120 từ)",
    "grammar_feedback": "Nhận xét chi tiết về ngữ pháp với ví dụ cụ thể (80-120 từ)",
    "vocabulary_feedback": "Nhận xét về từ vựng và cách dùng từ (60-100 từ)",
    "pronunciation_note": "Ghi chú về phát âm dựa trên văn bản nhận dạng (40-60 từ)",
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2", "Điểm mạnh 3"],
    "improvements": ["Cần cải thiện 1", "Cần cải thiện 2", "Cần cải thiện 3"],
    "suggestions": ["Gợi ý cụ thể 1", "Gợi ý cụ thể 2"],
    "overall_comment": "Nhận xét tổng quan và động viên (100-150 từ)"
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Bạn là giáo viên tiếng Anh giàu kinh nghiệm, nhiệt tình và tận tâm. Bạn luôn đưa ra nhận xét chi tiết, cụ thể và xây dựng để giúp học sinh tiến bộ."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1200,
                response_format={"type": "json_object"}  # Force JSON response
            )
            
            content = response.choices[0].message.content
            
            # Check if content is None or empty
            if not content or content.strip() == "":
                logger.debug(f"[GRADE_SPEAKING] Empty response from OpenAI")
                return {
                    "content_score": 0,
                    "content_feedback": "Lỗi: API không trả về kết quả",
                    "grammar_feedback": "",
                    "vocabulary_feedback": "",
                    "pronunciation_note": "",
                    "strengths": [],
                    "improvements": [],
                    "suggestions": [],
                    "overall_comment": "Không thể chấm điểm. Vui lòng thử lại.",
                    "error": "Empty API response"
                }
            
            content = content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Validate JSON before parsing
            if not content:
                logger.debug(f"[GRADE_SPEAKING] Content is empty after cleanup")
                return {
                    "content_score": 0,
                    "content_feedback": "Lỗi: Không thể phân tích kết quả",
                    "grammar_feedback": "",
                    "vocabulary_feedback": "",
                    "pronunciation_note": "",
                    "strengths": [],
                    "improvements": [],
                    "suggestions": [],
                    "overall_comment": "Không thể chấm điểm. Vui lòng thử lại.",
                    "error": "Invalid JSON format"
                }
            
            # Debug: print raw content
            logger.debug(f"[GRADE_SPEAKING] Raw API response (first 200 chars): {content[:200]}")
            
            result = json.loads(content)
            
            return {
                "content_score": result.get("score", 0),
                "content_feedback": result.get("content_feedback", ""),
                "grammar_feedback": result.get("grammar_feedback", ""),
                "vocabulary_feedback": result.get("vocabulary_feedback", ""),
                "pronunciation_note": result.get("pronunciation_note", ""),
                "strengths": result.get("strengths", []),
                "improvements": result.get("improvements", []),
                "suggestions": result.get("suggestions", []),
                "overall_comment": result.get("overall_comment", "")
            }
            
        except json.JSONDecodeError as je:
            logger.info(f"Error grading speaking content - JSON decode error: {je}")
            logger.info(f"Raw content that failed to parse: {content if 'content' in locals() else 'N/A'}")
            return {
                "content_score": 0,
                "content_feedback": "Lỗi khi phân tích kết quả từ AI",
                "grammar_feedback": "",
                "vocabulary_feedback": "",
                "pronunciation_note": "",
                "strengths": [],
                "improvements": [],
                "suggestions": [],
                "overall_comment": "Không thể chấm điểm. Cần giáo viên chấm thủ công.",
                "error": f"JSON decode error: {str(je)}"
            }
        except Exception as e:
            logger.info(f"Error grading speaking content: {e}")
            import traceback
            traceback.print_exc()
            return {
                "content_score": 0,
                "content_feedback": "Lỗi khi chấm nội dung",
                "grammar_feedback": "",
                "vocabulary_feedback": "",
                "pronunciation_note": "",
                "strengths": [],
                "improvements": [],
                "suggestions": [],
                "overall_comment": "Không thể chấm điểm. Cần giáo viên chấm thủ công.",
                "error": str(e)
            }
    
    async def grade_comprehensive_submission(
        self, 
        exercise_content: Dict, 
        student_answers: Dict,
        audio_file_path: Optional[str] = None
    ) -> Dict:
        """
        Grade entire comprehensive test submission
        Returns detailed grading for all sections
        """
        results = {
            "listening": {"questions": [], "total_points": 0, "max_points": 2.5},
            "reading": {"questions": [], "total_points": 0, "max_points": 2.5},
            "writing": {"points_earned": 0, "max_points": 2.5, "feedback": {}, "needs_review": True},
            "speaking": {"points_earned": 0, "max_points": 2.5, "feedback": {}, "needs_review": True},
            "total_score": 0,
            "max_score": 10
        }
        
        logger.debug(f"[GRADE_COMPREHENSIVE] Exercise content keys: {exercise_content.keys()}")
        logger.debug(f"[GRADE_COMPREHENSIVE] Student answers keys: {student_answers.keys()}")
        
        # Grade Listening questions
        # Check both locations: content.listening.questions AND content.questions with skill="listening"
        listening_questions = []
        if "listening" in exercise_content and "questions" in exercise_content["listening"]:
            listening_questions = exercise_content["listening"]["questions"]
            logger.debug(f"[GRADE_COMPREHENSIVE] Found {len(listening_questions)} listening questions in content.listening.questions")
        else:
            listening_questions = [q for q in exercise_content.get("questions", []) if q.get("skill") == "listening"]
            logger.debug(f"[GRADE_COMPREHENSIVE] Found {len(listening_questions)} listening questions in content.questions")
        
        for q in listening_questions:
            # Try multiple key formats: "listening_X", "X", X (int)
            q_id = q["id"]
            student_ans = (
                student_answers.get(f"listening_{q_id}", "") or 
                student_answers.get(str(q_id), "") or 
                student_answers.get(q_id, "")
            )
            q_type = q.get("type", "multiple_choice")
            
            if q_type == "multiple_choice":
                grade_result = await self.grade_multiple_choice(q, student_ans)
            elif q_type == "fill_blank":
                grade_result = await self.grade_fill_blank(q, student_ans)
            elif q_type == "true_false":
                grade_result = await self.grade_true_false(q, student_ans)
            else:
                grade_result = {"points_earned": 0, "max_points": q.get("points", 0.5), "feedback": "Unknown question type"}
            
            results["listening"]["questions"].append({
                "question_id": q["id"],
                "question": q.get("question", ""),
                "student_answer": student_ans,
                "correct_answer": q.get("correct_answer", ""),
                **grade_result
            })
            results["listening"]["total_points"] += grade_result.get("points_earned", 0)
        
        logger.debug(f"[GRADE_COMPREHENSIVE] Listening graded: {results['listening']['total_points']}/2.5")
        
        # Grade Reading questions
        # Check both locations: content.reading.questions AND content.questions with skill="reading"
        reading_questions = []
        if "reading" in exercise_content and "questions" in exercise_content["reading"]:
            reading_questions = exercise_content["reading"]["questions"]
            logger.debug(f"[GRADE_COMPREHENSIVE] Found {len(reading_questions)} reading questions in content.reading.questions")
        else:
            reading_questions = [q for q in exercise_content.get("questions", []) if q.get("skill") == "reading"]
            logger.debug(f"[GRADE_COMPREHENSIVE] Found {len(reading_questions)} reading questions in content.questions")
        
        for q in reading_questions:
            # Try multiple key formats: "reading_X", "X", X (int)
            q_id = q["id"]
            student_ans = (
                student_answers.get(f"reading_{q_id}", "") or 
                student_answers.get(str(q_id), "") or 
                student_answers.get(q_id, "")
            )
            q_type = q.get("type", "multiple_choice")
            
            if q_type == "multiple_choice":
                grade_result = await self.grade_multiple_choice(q, student_ans)
            elif q_type == "fill_blank":
                grade_result = await self.grade_fill_blank(q, student_ans)
            elif q_type == "matching":
                # Parse student answer as JSON if it's a string
                if isinstance(student_ans, str):
                    try:
                        if student_ans.strip():  # Only parse if not empty
                            student_ans = json.loads(student_ans)
                        else:
                            student_ans = {}
                    except json.JSONDecodeError as e:
                        logger.info(f"Error grading fill blank: {e}")
                        logger.info(f"Failed to parse matching answer: '{student_ans}'")
                        student_ans = {}
                    except Exception as e:
                        logger.info(f"Error grading fill blank: {e}")
                        student_ans = {}
                grade_result = await self.grade_matching(q, student_ans)
            else:
                grade_result = {"points_earned": 0, "max_points": q.get("points", 0.5), "feedback": "Unknown question type"}
            
            results["reading"]["questions"].append({
                "question_id": q["id"],
                "question": q.get("question", ""),
                "student_answer": student_ans,
                "correct_answer": q.get("correct_answer", ""),
                **grade_result
            })
            results["reading"]["total_points"] += grade_result.get("points_earned", 0)
        
        logger.debug(f"[GRADE_COMPREHENSIVE] Reading graded: {results['reading']['total_points']}/2.5")
        
        # Grade Writing
        writing_text = student_answers.get("writing_main", "")
        if writing_text:
            writing_prompt = exercise_content.get("writing", {}).get("prompt", "")
            writing_rubric = exercise_content.get("writing", {}).get("rubric", {})
            writing_result = await self.grade_writing(
                {"rubric": writing_rubric, "points": 2.5},
                writing_text,
                writing_prompt
            )
            results["writing"] = writing_result
        
        # Grade Speaking
        if audio_file_path and os.path.exists(audio_file_path):
            speaking_prompt = exercise_content.get("speaking", {}).get("prompt", "")
            
            # Step 1: Azure pronunciation assessment
            pronunciation_result = await self.grade_speaking_pronunciation(
                audio_file_path,
                speaking_prompt
            )
            
            # Step 2: ChatGPT content grading
            recognized_text = pronunciation_result.get("recognized_text", "")
            speaking_rubric = exercise_content.get("speaking", {}).get("rubric", {})
            
            if recognized_text:
                content_result = await self.grade_speaking_content(
                    recognized_text,
                    speaking_prompt,
                    {"points": 2.5, **speaking_rubric}
                )
            else:
                content_result = {
                    "content_score": 0,
                    "overall_comment": "Không thể nhận diện giọng nói"
                }
            
            # Combine scores: 50% pronunciation, 50% content
            pronunciation_score = pronunciation_result.get("pronunciation_score", 0) / 100 * 1.25
            content_score = content_result.get("content_score", 0)
            total_speaking_score = pronunciation_score + content_score
            
            results["speaking"] = {
                "points_earned": round(min(total_speaking_score, 2.5), 2),
                "max_points": 2.5,
                "pronunciation": pronunciation_result,
                "content": content_result,
                "feedback": {
                    "pronunciation": f"Phát âm: {pronunciation_result.get('pronunciation_score', 0)}/100",
                    "content": content_result.get("overall_comment", "")
                },
                "needs_review": True
            }
        
        # Calculate total
        results["total_score"] = round(
            results["listening"]["total_points"] +
            results["reading"]["total_points"] +
            results["writing"].get("points_earned", 0) +
            results["speaking"].get("points_earned", 0),
            2
        )
        
        return results
