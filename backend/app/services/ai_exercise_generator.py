"""
AI Exercise Generator Service
Generates exercises based on Vietnam's 2018 Foreign Language Curriculum
"""
import json
import logging
import os
import time
import uuid

import azure.cognitiveservices.speech as speechsdk
from openai import OpenAI

logger = logging.getLogger(__name__)

# Vietnam's 2018 Curriculum Topics by Grade
CURRICULUM_TOPICS = {
    "1": {
        "1": ["Greetings", "Colors", "Numbers 1-10", "School objects", "Family members"],
        "2": ["Animals", "Toys", "Food and drinks", "Body parts", "Daily activities"]
    },
    "2": {
        "1": ["Weather", "Clothes", "Home and rooms", "Numbers 11-20", "Feelings"],
        "2": ["Sports", "Hobbies", "Fruits", "Vegetables", "Transportation"]
    },
    "3": {
        "1": ["School subjects", "Days of the week", "Time", "Shapes", "Seasons"],
        "2": ["Jobs and occupations", "Places in town", "Outdoor activities", "Musical instruments", "Nature"]
    },
    "4": {
        "1": ["My family", "My school", "My hobbies", "Daily routines", "Asking for help"],
        "2": ["Free time activities", "Describing people", "Describing places", "Making suggestions", "Expressing preferences"]
    },
    "5": {
        "1": ["Where I live", "My daily routine", "School life", "Healthy living", "Weekend activities"],
        "2": ["Festivals and celebrations", "Travel and tourism", "Shopping", "Technology", "Environmental issues"]
    },
    "6": {
        "1": ["My school", "My home", "My friends", "My neighborhood", "My hobbies and interests"],
        "2": ["Global environment", "Different cultures", "Famous people", "Natural wonders", "Festivals around the world"]
    },
    "7": {
        "1": ["My hobbies", "Healthy living", "Community service", "Music and arts", "Vietnamese food and drink"],
        "2": ["Traffic", "Films", "World festivals", "Tourism", "Environmental protection"]
    },
    "8": {
        "1": ["Leisure activities", "Life in the countryside", "Peoples of Vietnam", "Our customs and traditions", "Festivals in Vietnam"],
        "2": ["Pollution", "English speaking countries", "Natural disasters", "Science and technology", "Communication"]
    },
    "9": {
        "1": ["Local environment", "City life", "Teen stress and pressure", "Life skills", "Wonders of Vietnam"],
        "2": ["Vietnam: Then and now", "English in the world", "Space travel", "Changing roles in society", "Future jobs"]
    },
    "10": {
        "1": ["Family life", "Your body and you", "Music", "For a better community", "Inventions"],
        "2": ["Gender equality", "Cultural diversity", "New ways to learn", "The ecosystem", "Ecotourism"]
    },
    "11": {
        "1": ["The generation gap", "Relationships", "Becoming independent", "Caring for those in need", "Being part of ASEAN"],
        "2": ["Global warming", "Further education", "Cities of the future", "Healthy living", "Cultural diversity"]
    },
    "12": {
        "1": ["Life stories", "Urbanization", "Future jobs", "The mass media", "Cultural identity"],
        "2": ["Endangered species", "Artificial intelligence", "The world of work", "Choosing a career", "Wildlife conservation"]
    }
}


class AIExerciseGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=self.api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")  # Default to gpt-4o if not set
        self.fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", self.model)

        # Azure Speech Config
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.speech_region = os.getenv("AZURE_SPEECH_REGION", "eastasia")

    def _get_topics(self, grade: str, semester: str) -> list[str]:
        """Get curriculum topics for grade and semester"""
        return CURRICULUM_TOPICS.get(grade, {}).get(semester, [])

    async def _generate_audio_from_text(self, text: str, filename: str = None) -> str:
        """
        Generate audio file from text using Azure Text-to-Speech
        Returns the file path of the generated audio
        """
        if not self.speech_key:
            logger.info("Azure Speech Key not found, skipping audio generation")
            return ""

        try:
            # Create speech config
            speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )

            # Set voice (British English female for better educational content)
            speech_config.speech_synthesis_voice_name = "en-GB-SoniaNeural"

            # Generate unique filename if not provided
            if not filename:
                filename = f"listening_{uuid.uuid4().hex[:8]}.mp3"

            # Create audio output directory if not exists
            audio_dir = "media/audio"
            os.makedirs(audio_dir, exist_ok=True)

            # Full path to audio file
            audio_path = os.path.join(audio_dir, filename)

            # Configure audio output to file
            audio_config = speechsdk.audio.AudioOutputConfig(filename=audio_path)

            # Create synthesizer
            speech_synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config,
                audio_config=audio_config
            )

            # Synthesize text to audio
            result = speech_synthesizer.speak_text_async(text).get()

            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"✅ Audio generated successfully: {audio_path}")
                # Return URL path for frontend
                return f"/api/v1/media/files/audio/{filename}"
            logger.info(f"❌ Speech synthesis failed: {result.reason}")
            return ""

        except Exception as e:
            logger.info(f"Error generating audio: {e}")
            return ""

    async def generate_full_exam(
        self,
        test_type: str,
        grade: str,
        semester: str,
        difficulty: str = 'mixed',
        questions_per_skill: int = 10,
        additional_notes: str = None
    ) -> dict:
        """
        Generate full exam with all 4 skills (Listening, Speaking, Reading, Writing)
        Following Vietnam's 2018 Curriculum

        Args:
            test_type: 'midterm' or 'final'
            grade: Student grade (1-12)
            semester: Semester (1 or 2)
            difficulty: 'easy', 'medium', 'hard', or 'mixed'
            questions_per_skill: Number of questions per skill (default 10 for longer exams)
            additional_notes: Extra instructions from teacher
        """
        topics = self._get_topics(grade, semester)
        topics_str = ", ".join(topics)

        exam_name = "Kiểm tra Giữa kỳ" if test_type == "midterm" else "Kiểm tra Cuối kỳ"

        # Map difficulty to Vietnamese
        difficulty_map = {
            'easy': 'Dễ - phù hợp với học sinh trung bình yếu',
            'medium': 'Trung bình - phù hợp với đa số học sinh',
            'hard': 'Khó - thách thức cho học sinh giỏi',
            'mixed': 'Trộn lẫn các mức độ từ dễ đến khó'
        }
        difficulty_desc = difficulty_map.get(difficulty, difficulty_map['mixed'])

        # Calculate points per question
        points_per_question = round(2.5 / questions_per_skill, 2)

        additional_instructions = f"\n\nYÊU CẦU BỔ SUNG TỪ GIÁO VIÊN:\n{additional_notes}" if additional_notes else ""

        prompt = f"""Bạn là một giáo viên tiếng Anh chuyên nghiệp tại Việt Nam.
Hãy tạo một đề {exam_name} học kỳ {semester} cho học sinh lớp {grade} theo Chương trình Giáo dục phổ thông môn Ngoại ngữ 2018 của Việt Nam.

Các chủ đề chính học kỳ này: {topics_str}

ĐỘ KHÓ: {difficulty_desc}

YÊU CẦU QUAN TRỌNG:
1. Đề thi có 4 phần: LISTENING, READING, WRITING, SPEAKING
2. MỖI PHẦN 2.5 ĐIỂM (Tổng 10 điểm)
3. Listening (2.5đ): Script 350-500 từ + {questions_per_skill} câu hỏi ĐA DẠNG (mỗi câu {points_per_question}đ)
   - Bao gồm: multiple_choice, fill_blank, true_false
   - Script phải dài, chi tiết với nhiều thông tin cụ thể (tên, số, ngày tháng, địa điểm)
   - Script phải có độ dài phù hợp với số câu hỏi, đủ nội dung để test comprehension
4. Reading (2.5đ): Đoạn văn 400-600 từ + {questions_per_skill} câu hỏi ĐA DẠNG (mỗi câu {points_per_question}đ)
   - Bao gồm: multiple_choice, fill_blank, matching
   - Đoạn văn phải phong phú, chi tiết và liên quan đến chủ đề
5. Writing (2.5đ): Đề bài viết essay 200-250 từ
   - Cho hướng dẫn cụ thể về cấu trúc và nội dung
6. Speaking (2.5đ): Đề bài nói với prompt rõ ràng
   - Có prompt/topic để học sinh trình bày (1-2 phút)
   - Có instructions hướng dẫn cụ thể
   - Thời gian chuẩn bị và thời gian nói{additional_instructions}

Trả về JSON format sau:
{{
    "title": "Đề {exam_name} Học kỳ {semester} - Lớp {grade}",
    "questions": [
        {{
            "section": "listening",
            "script": "Đoạn hội thoại hoặc monologue 350-500 từ, chi tiết với nhiều thông tin cụ thể như tên, số liệu, ngày tháng, địa điểm...",
            "total_points": 2.5,
            "questions": [
                {{
                    "id": 1,
                    "question": "What is the main topic?",
                    "type": "multiple_choice",
                    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                    "correct_answer": "A",
                    "points": 0.5
                }},
                {{
                    "id": 2,
                    "question": "The speaker mentions _____ in the conversation.",
                    "type": "fill_blank",
                    "correct_answer": "the correct word",
                    "points": 0.5
                }},
                {{
                    "id": 3,
                    "question": "The speaker agrees with the proposal.",
                    "type": "true_false",
                    "correct_answer": "true",
                    "points": 0.5
                }}
            ]
        }},
        {{
            "section": "reading",
            "passage": "Đoạn văn 200-250 từ...",
            "total_points": 2.5,
            "questions": [
                {{
                    "id": 1,
                    "question": "What is the main idea?",
                    "type": "multiple_choice",
                    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                    "correct_answer": "C",
                    "points": 0.5
                }},
                {{
                    "id": 2,
                    "question": "The author suggests that _____.",
                    "type": "fill_blank",
                    "correct_answer": "the answer",
                    "points": 0.5
                }},
                {{
                    "id": 3,
                    "question": "Match the words with their meanings:",
                    "type": "matching",
                    "pairs": [
                        {{"left": "word1", "right": "meaning1"}},
                        {{"left": "word2", "right": "meaning2"}}
                    ],
                    "correct_answer": {{"word1": "meaning1", "word2": "meaning2"}},
                    "points": 0.5
                }}
            ]
        }},
        {{
            "section": "writing",
            "prompt": "Write an essay about...",
            "instructions": ["- Include introduction, body, conclusion", "- Use linking words", "- Give examples"],
            "min_words": 150,
            "max_words": 200,
            "total_points": 2.5,
            "rubric": {{
                "content": "Nội dung phù hợp, logic, có ý tưởng rõ ràng",
                "grammar": "Ngữ pháp chính xác, ít lỗi",
                "vocabulary": "Từ vựng phong phú, sử dụng đúng",
                "structure": "Cấu trúc bài viết rõ ràng, mạch lạc"
            }}
        }},
        {{
            "section": "speaking",
            "total_points": 2.5,
            "prompt": "Talk about your favorite subject at school. You should mention: What is your favorite subject? Why do you like it? What do you learn in this subject?",
            "instructions": [
                "Speak clearly and confidently",
                "Use complete sentences",
                "Give specific examples",
                "Speak for about 1-2 minutes"
            ],
            "prep_time": 60,
            "speak_time": 120,
            "questions": [
                {{
                    "id": 1,
                    "question": "Tell me about...",
                    "points": 0.83,
                    "rubric": {{
                        "pronunciation": "Phát âm rõ ràng, chính xác",
                        "fluency": "Lưu loát, tự tin",
                        "grammar": "Ngữ pháp đúng",
                        "vocabulary": "Từ vựng phù hợp"
                    }}
                }},
                {{
                    "id": 2,
                    "question": "Describe...",
                    "points": 0.83
                }},
                {{
                    "id": 3,
                    "question": "What do you think about...",
                    "points": 0.84
                }}
            ]
        }}
    ]
}}

Chỉ trả về JSON, không có text khác."""

        try:
            # Calculate max tokens based on number of questions
            # Increased significantly for longer transcripts: Base 3000 + 400 per question per skill
            # With 10 questions per skill: 3000 + 4000 = 7000 tokens (within GPT-4 limit)
            max_tokens = min(3000 + (questions_per_skill * 400), 8000)
            logger.info(f"[AI Generate] Full Exam - Grade {grade}, Semester {semester}, {questions_per_skill} Q/skill")
            logger.info(f"[AI Generate] Using model={self.model}, max_tokens={max_tokens}, timeout=300s")

            # Determine if model supports max_tokens or max_completion_tokens
            # GPT-4o and newer models use max_completion_tokens
            use_max_completion_tokens = any(x in self.model.lower() for x in ['gpt-4o', 'gpt-5', 'o1'])

            # Some models (like gpt-5-nano, o1) only support temperature=1
            temperature = 1 if any(x in self.model.lower() for x in ['gpt-5', 'o1']) else 0.7

            # Some models (like o1) don't support system messages
            use_system_message = not any(x in self.model.lower() for x in ['o1', 'gpt-5'])

            # Prepare messages
            if use_system_message:
                messages = [
                    {"role": "system", "content": "You are an expert English teacher in Vietnam, following the 2018 curriculum. Generate well-structured exams with complete JSON format. Ensure all JSON is valid with proper commas and quotes."},
                    {"role": "user", "content": prompt}
                ]
            else:
                # Merge system message into user prompt for models that don't support it
                combined_prompt = "You are an expert English teacher in Vietnam, following the 2018 curriculum. Generate well-structured exams with complete JSON format. Ensure all JSON is valid with proper commas and quotes.\n\n" + prompt
                messages = [{"role": "user", "content": combined_prompt}]

            # Prepare common parameters
            common_params = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "timeout": 300  # 5 minutes timeout
            }

            # Add the appropriate token parameter
            if use_max_completion_tokens:
                common_params["max_completion_tokens"] = max_tokens
            else:
                common_params["max_tokens"] = max_tokens

            # Try configured model first
            try:
                logger.info(f"[AI Generate] Attempting with {self.model} (using {'max_completion_tokens' if use_max_completion_tokens else 'max_tokens'})")
                response = self.client.chat.completions.create(**common_params)
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    logger.info(f"[AI Generate] {self.model} quota exceeded, trying fallback model...")
                    fallback_model = self.fallback_model
                    fallback_params = common_params.copy()
                    fallback_params["model"] = fallback_model
                    # gpt-3.5-turbo uses max_tokens
                    if "max_completion_tokens" in fallback_params:
                        fallback_params["max_tokens"] = fallback_params.pop("max_completion_tokens")
                    response = self.client.chat.completions.create(**fallback_params)
                else:
                    raise

            # Extract JSON from response
            content = response.choices[0].message.content.strip()

            # Log raw response for debugging
            logger.info(f"[AI Generate] Raw response length: {len(content)} chars")

            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            # Parse JSON with better error handling
            try:
                result = json.loads(content)
            except json.JSONDecodeError as json_err:
                logger.info(f"[AI Generate] ❌ JSON Parse Error: {json_err}")
                logger.info(f"[AI Generate] Error at position {json_err.pos}")
                logger.info("[AI Generate] Context around error:")
                start = max(0, json_err.pos - 150)
                end = min(len(content), json_err.pos + 150)
                logger.info(f"...{content[start:end]}...")

                # Try to fix common JSON issues
                logger.info("[AI Generate] Attempting to fix common JSON errors...")

                # Fix common issues:
                # 1. Unescaped quotes and newlines in strings
                # 2. Trailing commas
                # 3. Missing commas
                import re


                content_fixed = content

                # Replace literal newlines within strings with \n
                content_fixed = re.sub(r'(?<!\\)\n(?=[^}{\[\]]*["}])', r'\\n', content_fixed)

                # Fix unescaped quotes (but be careful not to break valid JSON)
                # Remove any trailing commas before closing brackets/braces
                content_fixed = re.sub(r',(\s*[}\]])', r'\1', content_fixed)

                try:
                    result = json.loads(content_fixed)
                    logger.info("[AI Generate] ✅ Fixed JSON successfully after error recovery")
                except Exception as fix_err:
                    logger.info(f"[AI Generate] ❌ Could not auto-fix JSON: {fix_err}")
                    # Save problematic content to file for debugging
                    error_file = f"/app/logs/json_error_{int(time.time())}.txt"
                    try:
                        with open(error_file, 'w', encoding='utf-8') as f:
                            f.write(f"Original error: {json_err}\n\n")
                            f.write(f"Content:\n{content}\n\n")
                            f.write(f"Fixed attempt:\n{content_fixed}")
                        logger.info(f"[AI Generate] Error details saved to {error_file}")
                    except Exception:
                        pass
                    raise json_err

            # Transform comprehensive test structure
            # GPT returns: {"questions": [{"section": "listening", ...}, {"section": "reading", ...}]}
            # We need: {"type": "comprehensive_test", "listening": {...}, "reading": {...}, ...}
            if result.get("questions") and isinstance(result["questions"], list):
                transformed = {
                    "type": "comprehensive_test",
                    "title": result.get("title", "Comprehensive Test")
                }

                for section in result["questions"]:
                    section_name = section.get("section", "").lower()
                    if section_name in ["listening", "reading", "writing", "speaking"]:
                        # Remove the 'section' key and store under section name
                        section_data = {k: v for k, v in section.items() if k != "section"}
                        transformed[section_name] = section_data

                result = transformed

            # Generate audio for listening section
            if result.get("listening") and result["listening"].get("script"):
                logger.info("🎧 Generating audio for listening section...")
                audio_url = await self._generate_audio_from_text(result["listening"]["script"])
                if audio_url:
                    result["listening"]["audio_url"] = audio_url
                    logger.info(f"✅ Audio URL: {audio_url}")

            return result

        except Exception as e:
            logger.info(f"Error generating full exam: {e}")
            raise

    async def generate_skill_exercise(
        self,
        skill: str,
        test_type: str,
        grade: str,
        semester: str
    ) -> dict:
        """
        Generate exercise for a single skill
        """
        topics = self._get_topics(grade, semester)
        topics_str = ", ".join(topics)

        {
            "listening": "Nghe",
            "speaking": "Nói",
            "reading": "Đọc",
            "writing": "Viết"
        }.get(skill, skill)

        if skill == "listening":
            prompt = f"""Tạo bài tập NGHE cho học sinh lớp {grade}, học kỳ {semester}.
Chủ đề: {topics_str}

Yêu cầu:
1. Tạo đoạn hội thoại hoặc monologue (150-200 từ)
2. Tạo transcript đầy đủ
3. Tạo 8 câu hỏi trắc nghiệm về nội dung
4. Câu hỏi phải test khả năng listening comprehension

Trả về JSON:
{{
    "title": "Bài tập Nghe - Lớp {grade}",
    "listening": {{
        "script": "...",
        "transcript": "...",
        "show_transcript": false,
        "questions": [
            {{
                "id": 1,
                "question": "...",
                "type": "multiple_choice",
                "options": ["A...", "B...", "C...", "D..."],
                "correct_answer": "A",
                "points": 2
            }}
        ]
    }}
}}"""

        elif skill == "reading":
            prompt = f"""Tạo bài tập ĐỌC cho học sinh lớp {grade}, học kỳ {semester}.
Chủ đề: {topics_str}

Yêu cầu:
1. Tạo đoạn văn thú vị (250-300 từ)
2. Tạo 10 câu hỏi đa dạng: trắc nghiệm, điền từ, đúng/sai
3. Câu hỏi test các kỹ năng: main idea, details, inference, vocabulary

Trả về JSON:
{{
    "title": "Bài tập Đọc - Lớp {grade}",
    "reading": {{
        "passage": "...",
        "word_count": 250,
        "questions": [...]
    }}
}}"""

        elif skill == "speaking":
            prompt = f"""Tạo bài tập NÓI cho học sinh lớp {grade}, học kỳ {semester}.
Chủ đề: {topics_str}

Yêu cầu:
1. Tạo đề bài nói về một chủ đề thú vị
2. Có hướng dẫn chi tiết
3. Thời gian chuẩn bị và thời gian nói phù hợp

Trả về JSON:
{{
    "title": "Bài tập Nói - Lớp {grade}",
    "speaking": {{
        "prompt": "...",
        "instructions": ["...", "..."],
        "prep_time": 60,
        "speak_time": 120
    }}
}}"""

        else:  # writing
            prompt = f"""Tạo bài tập VIẾT cho học sinh lớp {grade}, học kỳ {semester}.
Chủ đề: {topics_str}

Yêu cầu:
1. Tạo đề bài viết thú vị và phù hợp
2. Có hướng dẫn chi tiết
3. Yêu cầu độ dài phù hợp với lớp

Trả về JSON:
{{
    "title": "Bài tập Viết - Lớp {grade}",
    "writing": {{
        "prompt": "...",
        "type": "essay",
        "instructions": ["...", "..."],
        "min_words": 150,
        "max_words": 200
    }}
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert English teacher in Vietnam, following the 2018 curriculum."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000
            )

            content = response.choices[0].message.content.strip()

            # Parse JSON
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            return json.loads(content)

        except Exception as e:
            logger.info(f"Error generating full exam: {str(e)}")
            raise

