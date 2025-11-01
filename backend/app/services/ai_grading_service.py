"""
AI Grading Service
Auto-grade student submissions using AI (ChatGPT + Azure Speech)
"""
from openai import OpenAI
import os
import json
from typing import Dict, List, Optional
import azure.cognitiveservices.speech as speechsdk


class AIGradingService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_key:
            raise ValueError("OPENAI_API_KEY not found")
        self.client = OpenAI(api_key=self.openai_key)
        
        # Azure Speech for pronunciation assessment
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.speech_region = os.getenv("AZURE_SPEECH_REGION", "eastasia")
    
    async def grade_multiple_choice(self, question: Dict, student_answer: str) -> Dict:
        """Grade multiple choice question"""
        correct = question.get("correct_answer", "")
        
        # Normalize answers for comparison (trim whitespace, uppercase)
        student_normalized = str(student_answer).strip().upper()
        correct_normalized = str(correct).strip().upper()
        
        is_correct = student_normalized == correct_normalized
        points_earned = question.get("points", 0.5) if is_correct else 0
        
        print(f"[GRADE_MC] Q{question.get('id')}: Student='{student_normalized}' vs Correct='{correct_normalized}' => {is_correct}")
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 0.5),
            "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng là: {correct}"
        }
    
    async def grade_fill_blank(self, question: Dict, student_answer: str) -> Dict:
        """Grade fill in the blank using AI to check semantic similarity"""
        correct_answer = question.get("correct_answer", "")
        
        try:
            prompt = f"""You are grading a fill-in-the-blank English question.

Question: {question.get('question', '')}
Correct answer: {correct_answer}
Student's answer: {student_answer}

Is the student's answer correct or semantically similar enough?
Consider:
- Exact match
- Synonyms
- Different word forms (e.g., "run" vs "running")
- Minor spelling errors

Respond with JSON:
{{
    "is_correct": true/false,
    "score_percentage": 0-100,
    "feedback": "Brief explanation in Vietnamese"
}}"""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an English teacher grading student answers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            result = json.loads(content)
            
            max_points = question.get("points", 0.5)
            points_earned = max_points * (result.get("score_percentage", 0) / 100)
            
            return {
                "is_correct": result.get("is_correct", False),
                "points_earned": round(points_earned, 2),
                "max_points": max_points,
                "feedback": result.get("feedback", "")
            }
            
        except Exception as e:
            print(f"Error grading fill blank: {e}")
            # Fallback: exact match
            is_correct = student_answer.strip().lower() == correct_answer.strip().lower()
            return {
                "is_correct": is_correct,
                "points_earned": question.get("points", 0.5) if is_correct else 0,
                "max_points": question.get("points", 0.5),
                "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng: {correct_answer}"
            }
    
    async def grade_true_false(self, question: Dict, student_answer: str) -> Dict:
        """Grade true/false question"""
        correct = str(question.get("correct_answer", "")).strip().lower()
        student = str(student_answer).strip().lower()
        
        is_correct = student == correct
        points_earned = question.get("points", 0.5) if is_correct else 0
        
        print(f"[GRADE_TF] Q{question.get('id')}: Student='{student}' vs Correct='{correct}' => {is_correct}")
        
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "max_points": question.get("points", 0.5),
            "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng: {'Đúng' if correct == 'true' else 'Sai'}"
        }
    
    async def grade_matching(self, question: Dict, student_answer: Dict) -> Dict:
        """Grade matching question"""
        correct_pairs = question.get("correct_answer", {})
        
        correct_count = 0
        total_pairs = len(correct_pairs)
        
        for left, right in correct_pairs.items():
            if student_answer.get(left) == right:
                correct_count += 1
        
        score_percentage = (correct_count / total_pairs * 100) if total_pairs > 0 else 0
        max_points = question.get("points", 0.5)
        points_earned = max_points * (score_percentage / 100)
        
        return {
            "is_correct": correct_count == total_pairs,
            "points_earned": round(points_earned, 2),
            "max_points": max_points,
            "feedback": f"Ghép đúng {correct_count}/{total_pairs} cặp"
        }
    
    async def grade_writing(self, question: Dict, student_text: str, prompt: str) -> Dict:
        """Grade writing essay using AI"""
        rubric = question.get("rubric", {})
        max_points = question.get("points", 2.5)
        
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
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an experienced English teacher grading essays."},
                    {"role": "user", "content": prompt_text}
                ],
                temperature=0.5,
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
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
            
        except Exception as e:
            print(f"Error grading writing: {e}")
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
                "error": "Azure Speech key not configured"
            }
        
        try:
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
            audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)
            
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
            print(f"Error in pronunciation assessment: {e}")
            return {
                "pronunciation_score": 0,
                "accuracy_score": 0,
                "fluency_score": 0,
                "completeness_score": 0,
                "error": str(e),
                "success": False
            }
    
    async def grade_speaking_content(self, audio_transcript: str, question: str, rubric: Dict) -> Dict:
        """Grade speaking content using ChatGPT"""
        max_points = rubric.get("points", 0.83)
        
        try:
            rubric_str = "\n".join([f"- {key}: {value}" for key, value in rubric.items() if key != "points"])
            
            prompt = f"""You are an English teacher grading a speaking response.

Question: {question}
Student's response (transcribed): {audio_transcript}

Rubric:
{rubric_str}

Grade the response based on:
- Content relevance and completeness
- Grammar usage
- Vocabulary appropriateness
- Coherence and organization

Respond with JSON:
{{
    "score": 0-{max_points},
    "content_feedback": "feedback on content",
    "grammar_feedback": "feedback on grammar",
    "vocabulary_feedback": "feedback on vocabulary",
    "overall_comment": "Overall comment in Vietnamese"
}}"""

            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an English teacher grading speaking responses."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            result = json.loads(content)
            
            return {
                "content_score": result.get("score", 0),
                "content_feedback": result.get("content_feedback", ""),
                "grammar_feedback": result.get("grammar_feedback", ""),
                "vocabulary_feedback": result.get("vocabulary_feedback", ""),
                "overall_comment": result.get("overall_comment", "")
            }
            
        except Exception as e:
            print(f"Error grading speaking content: {e}")
            return {
                "content_score": 0,
                "content_feedback": "Lỗi khi chấm nội dung",
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
        
        print(f"[GRADE_COMPREHENSIVE] Exercise content keys: {exercise_content.keys()}")
        print(f"[GRADE_COMPREHENSIVE] Student answers keys: {student_answers.keys()}")
        
        # Grade Listening questions
        # Check both locations: content.listening.questions AND content.questions with skill="listening"
        listening_questions = []
        if "listening" in exercise_content and "questions" in exercise_content["listening"]:
            listening_questions = exercise_content["listening"]["questions"]
            print(f"[GRADE_COMPREHENSIVE] Found {len(listening_questions)} listening questions in content.listening.questions")
        else:
            listening_questions = [q for q in exercise_content.get("questions", []) if q.get("skill") == "listening"]
            print(f"[GRADE_COMPREHENSIVE] Found {len(listening_questions)} listening questions in content.questions")
        
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
        
        print(f"[GRADE_COMPREHENSIVE] Listening graded: {results['listening']['total_points']}/2.5")
        
        # Grade Reading questions
        # Check both locations: content.reading.questions AND content.questions with skill="reading"
        reading_questions = []
        if "reading" in exercise_content and "questions" in exercise_content["reading"]:
            reading_questions = exercise_content["reading"]["questions"]
            print(f"[GRADE_COMPREHENSIVE] Found {len(reading_questions)} reading questions in content.reading.questions")
        else:
            reading_questions = [q for q in exercise_content.get("questions", []) if q.get("skill") == "reading"]
            print(f"[GRADE_COMPREHENSIVE] Found {len(reading_questions)} reading questions in content.questions")
        
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
                        student_ans = json.loads(student_ans)
                    except:
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
        
        print(f"[GRADE_COMPREHENSIVE] Reading graded: {results['reading']['total_points']}/2.5")
        
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
