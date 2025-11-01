"""
OpenAI AI Service
Handles interactions with OpenAI API (ChatGPT) for AI conversation
"""

import openai
import logging

logger = logging.getLogger(__name__)
import asyncio
import logging

logger = logging.getLogger(__name__)
import json
import logging

logger = logging.getLogger(__name__)
from typing import List, Dict
import os
import logging

logger = logging.getLogger(__name__)
from app.core.config import settings


import logging

logger = logging.getLogger(__name__)
class OpenAIService:
    """Service for handling OpenAI (ChatGPT) conversations"""
    
    def __init__(self):
        """Initialize OpenAI with API key"""
        api_key = settings.OPENAI_API_KEY if hasattr(settings, 'OPENAI_API_KEY') else os.getenv('OPENAI_API_KEY')
        self.api_key = api_key
        self.client = None
        
        if api_key and api_key.strip():
            try:
                model_name = settings.OPENAI_MODEL if hasattr(settings, 'OPENAI_MODEL') else os.getenv('OPENAI_MODEL', 'gpt-5-nano')
                openai.api_key = api_key
                self.client = openai
                self.model = model_name
            except Exception as e:
                logger.info(f"Warning: Failed to initialize OpenAI: {str(e)}")
                self.client = None
        else:
            logger.info("Warning: OPENAI_API_KEY not configured")
    
    def generate_content(self, prompt: str) -> str:
        """
        Generate content from a prompt using OpenAI
        
        Args:
            prompt: The prompt to send to OpenAI
            
        Returns:
            Generated text content
        """
        if not self.client:
            raise ValueError("OpenAI API is not configured. Please add OPENAI_API_KEY to your .env file. Get your API key at: https://platform.openai.com/api-keys")
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.info(f"Error generating content: {str(e)}")
            raise
    
    async def generate_text(self, prompt: str) -> str:
        """
        Async wrapper for generate_content
        
        Args:
            prompt: The prompt to send to OpenAI
            
        Returns:
            Generated text content
        """
        return await asyncio.to_thread(self.generate_content, prompt)
    
    async def chat_conversation(
        self, 
        message: str, 
        chat_history: List[Dict[str, str]] = None,
        system_prompt: str = None
    ) -> str:
        """
        Send a message to OpenAI and get a response
        
        Args:
            message: User's message
            chat_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
            system_prompt: Optional system instructions for the AI
            
        Returns:
            AI's response text
        """
        try:
            if system_prompt is None:
                system_prompt = """You are a friendly English conversation partner. 
                Your role is to help users practice English conversation naturally.
                - Always respond in English
                - Keep responses conversational and engaging
                - Correct grammar mistakes gently
                - Ask follow-up questions to keep the conversation going
                - Be encouraging and supportive"""
            
            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add chat history if exists
            if chat_history:
                for msg in chat_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    
                    # Convert 'ai' role to 'assistant' for OpenAI
                    if role == "ai":
                        role = "assistant"
                    
                    messages.append({"role": role, "content": content})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Get response from OpenAI
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=messages,
                temperature=0.7,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # Log error and return a friendly message
            logger.info(f"OpenAI API Error: {str(e)}")
            return "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
    
    async def get_conversation_suggestions(self, topic: str = None) -> List[str]:
        """
        Get conversation starter suggestions
        
        Args:
            topic: Optional topic for suggestions
            
        Returns:
            List of conversation starter suggestions
        """
        try:
            prompt = f"""Generate 5 interesting English conversation starters"""
            if topic:
                prompt += f""" about {topic}"""
            prompt += """. Return only the questions, one per line, without numbering."""
            
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
            )
            
            suggestions = response.choices[0].message.content.strip().split('\n')
            
            # Clean up suggestions
            suggestions = [s.strip() for s in suggestions if s.strip()]
            
            return suggestions[:5]  # Return max 5 suggestions
            
        except Exception as e:
            logger.info(f"Error generating suggestions: {str(e)}")
            return [
                "What did you do today?",
                "What are your hobbies?",
                "Tell me about your favorite book or movie.",
                "What's your dream vacation destination?",
                "What do you like to do in your free time?"
            ]
    
    async def check_writing(
        self,
        text: str,
        writing_type: str = "general",
        level: str = "intermediate"
    ) -> Dict:
        """
        Check and provide feedback on English writing
        
        Args:
            text: The writing text to check
            writing_type: Type of writing (essay, email, story, etc.)
            level: English level (beginner, intermediate, advanced)
            
        Returns:
            Dict with feedback including grammar, vocabulary, structure scores and suggestions
        """
        try:
            system_prompt = f"""You are an experienced English teacher checking a student's {writing_type} writing.
            The student's level is {level}.
            
            Analyze the writing and provide detailed feedback in JSON format with the following structure:
            {{
                "overall_score": <number 0-100>,
                "grammar_score": <number 0-100>,
                "vocabulary_score": <number 0-100>,
                "structure_score": <number 0-100>,
                "coherence_score": <number 0-100>,
                "grammar_errors": [
                    {{"error": "original text", "correction": "corrected text", "explanation": "why it's wrong"}}
                ],
                "vocabulary_suggestions": [
                    {{"original": "simple word", "suggestion": "better word", "reason": "why it's better"}}
                ],
                "strengths": ["strength 1", "strength 2"],
                "improvements": ["suggestion 1", "suggestion 2"],
                "corrected_text": "full corrected version of the text",
                "overall_comment": "encouraging feedback for the student"
            }}
            
            Be constructive, encouraging, and specific in your feedback."""
            
            prompt = f"{system_prompt}\n\nStudent's writing:\n{text}"
            
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Try to parse JSON from response
            import json
import logging

logger = logging.getLogger(__name__)
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            feedback = json.loads(result_text)
            return feedback
            
        except Exception as e:
            logger.info(f"Error checking writing: {str(e)}")
            # Return fallback response
            return {
                "overall_score": 70,
                "grammar_score": 70,
                "vocabulary_score": 70,
                "structure_score": 70,
                "coherence_score": 70,
                "grammar_errors": [],
                "vocabulary_suggestions": [],
                "strengths": ["You're making a great effort!"],
                "improvements": ["Keep practicing regularly"],
                "corrected_text": text,
                "overall_comment": "I'm having trouble analyzing your writing right now. Please try again in a moment."
            }
    
    async def generate_writing_topic(
        self,
        writing_type: str = "general",
        level: str = "intermediate"
    ) -> Dict:
        """
        Generate a writing topic/prompt based on type and level
        
        Args:
            writing_type: Type of writing (essay, email, story, etc.)
            level: English level (beginner, intermediate, advanced)
            
        Returns:
            Dict with topic, prompt, and guidelines
        """
        try:
            level_guidelines = {
                "beginner": "simple vocabulary, basic grammar structures, 100-150 words",
                "intermediate": "varied vocabulary, compound sentences, 200-250 words",
                "advanced": "sophisticated vocabulary, complex structures, 300-400 words"
            }
            
            type_instructions = {
                "essay": "an argumentative or opinion essay topic",
                "email": "a formal or informal email scenario",
                "letter": "a formal or personal letter scenario",
                "story": "a creative story prompt",
                "article": "an article topic for publication",
                "general": "a general writing topic"
            }
            
            guideline = level_guidelines.get(level, level_guidelines["intermediate"])
            type_inst = type_instructions.get(writing_type, type_instructions["general"])
            
            prompt = f"""Generate a {level} level English writing prompt for {type_inst}.

Return a JSON object with this structure:
{{
    "title": "Short catchy title",
    "prompt": "Detailed writing instructions/question",
    "word_count": "recommended word count range",
    "tips": ["tip 1", "tip 2", "tip 3"]
}}

The topic should:
- Be appropriate for {level} level ({guideline})
- Be interesting and relevant to modern life
- Provide clear instructions
- Encourage creative or critical thinking

Type: {writing_type}
Level: {level}"""
            
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Try to parse JSON from response
            import json
import logging

logger = logging.getLogger(__name__)
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            topic_data = json.loads(result_text)
            return topic_data
            
        except Exception as e:
            logger.info(f"Error generating topic: {str(e)}")
            # Return fallback topic based on type and level
            fallback_topics = {
                "essay": {
                    "beginner": {
                        "title": "My Favorite Hobby",
                        "prompt": "Write about your favorite hobby. Explain what it is, why you like it, and how often you do it.",
                        "word_count": "100-150 words",
                        "tips": ["Use simple present tense", "Give specific examples", "Explain your feelings"]
                    },
                    "intermediate": {
                        "title": "Technology in Education",
                        "prompt": "Do you think technology has a positive or negative impact on education? Give your opinion with reasons and examples.",
                        "word_count": "200-250 words",
                        "tips": ["State your opinion clearly", "Give at least 2 reasons", "Use linking words"]
                    },
                    "advanced": {
                        "title": "The Future of Work",
                        "prompt": "How do you think artificial intelligence will change the nature of work in the next decade? Discuss both opportunities and challenges.",
                        "word_count": "300-400 words",
                        "tips": ["Analyze both sides", "Use academic vocabulary", "Provide concrete examples"]
                    }
                },
                "email": {
                    "beginner": {
                        "title": "Email to a Friend",
                        "prompt": "Write an email to your friend inviting them to your birthday party. Include the date, time, and place.",
                        "word_count": "80-120 words",
                        "tips": ["Use friendly tone", "Include all details", "End with a nice closing"]
                    },
                    "intermediate": {
                        "title": "Job Application Email",
                        "prompt": "Write an email applying for a part-time job at a local bookstore. Introduce yourself and explain why you're interested.",
                        "word_count": "150-200 words",
                        "tips": ["Use formal language", "Be polite and professional", "Highlight your strengths"]
                    },
                    "advanced": {
                        "title": "Business Proposal Email",
                        "prompt": "Write an email to a potential business partner proposing a collaboration. Explain the benefits and suggest next steps.",
                        "word_count": "250-300 words",
                        "tips": ["Be professional and persuasive", "Use business terminology", "Include clear call-to-action"]
                    }
                }
            }
            
            # Get fallback or default
            type_fallbacks = fallback_topics.get(writing_type, fallback_topics["essay"])
            return type_fallbacks.get(level, type_fallbacks["intermediate"])

    async def generate_listening_segment(self, num_questions: int = 4) -> Dict:
        """Generate a short listening transcript with comprehension questions.

        Returns JSON: { title, transcript, questions: [{question, question_format, options, correct_answer}] }
        """
        try:
            num_questions = max(1, min(10, int(num_questions)))
            prompt = f"""
You are an English test generator. Create a listening segment with detailed content.
Return a valid JSON object ONLY with fields:
{{
  "title": "descriptive title for the listening topic",
  "transcript": "natural English transcript with rich vocabulary and varied sentence structures (20-30 sentences, approximately 300-400 words)",
  "questions": [
    {{
      "question": "...",
      "question_format": "multiple_choice"|"true_false"|"fill_blank",
      "options": ["A ...","B ...","C ...","D ..."] or ["True","False"],
      "correct_answer": number index for MC/T-F or string for fill_blank
    }}
  ]
}}

Rules:
- Generate exactly {num_questions} questions covering different parts of the transcript.
- Make transcript self-contained, coherent, and engaging with realistic dialogue or narration.
- Include specific details, numbers, dates, or names that can be tested.
- Vary question formats: use multiple choice, true/false, and fill-in-the-blank appropriately.
- Keep answers consistent with options order.
- Ensure the transcript is long enough to support {num_questions} diverse questions.
"""
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            text = response.choices[0].message.content.strip()
            import json
import logging

logger = logging.getLogger(__name__)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            data = json.loads(text)
            return data
        except Exception as e:
            logger.info(f"Error generating listening segment: {e}")
            # Fallback minimal
            return {
                "title": "Daily Routine",
                "transcript": "I wake up at 6:30... (fallback)",
                "questions": [
                    {
                        "question": "What time does the speaker wake up?",
                        "question_format": "multiple_choice",
                        "options": ["6:00", "6:30", "7:00", "7:30"],
                        "correct_answer": 1
                    }
                ]
            }

    async def generate_speaking_tasks(self, count: int = 3) -> Dict:
        """Generate speaking prompts with brief instructions.

        Returns: { tasks: [ { topic, prompt, instructions: [..], prep_time, speak_time } ] }
        """
        try:
            count = max(1, min(10, int(count)))
            prompt = f"""
Create {count} English speaking tasks. Return ONLY JSON:
{{
  "tasks": [
    {{
      "topic": "...",
      "prompt": "clear task statement",
      "instructions": ["bullet 1","bullet 2"],
      "prep_time": 30,
      "speak_time": 60
    }}
  ]
}}
Keep prompts realistic for intermediate learners.
"""
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            text = response.choices[0].message.content.strip()
            import json
import logging

logger = logging.getLogger(__name__)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            data = json.loads(text)
            return data
        except Exception as e:
            logger.info(f"Error generating speaking tasks: {e}")
            return {
                "tasks": [
                    {
                        "topic": "Hobbies",
                        "prompt": "Talk about your favorite hobby and why you enjoy it.",
                        "instructions": ["Give examples", "Explain how often you do it"],
                        "prep_time": 30,
                        "speak_time": 60
                    }
                ]
            }
    
    async def generate_reading_passage(
        self,
        reading_type: str = "article",
        level: str = "intermediate",
        topic: str = None
    ) -> Dict:
        """
        Generate a reading passage with comprehension questions
        
        Args:
            reading_type: Type of reading (story, article, news, essay, letter)
            level: English level (beginner, intermediate, advanced)
            topic: Optional specific topic
            
        Returns:
            Dict with passage, questions, and metadata
        """
        try:
            level_specs = {
                "beginner": {
                    "word_count": "150-200",
                    "vocabulary": "simple, common words (A1-A2 level)",
                    "grammar": "simple present, past, and future tenses",
                    "sentence_structure": "short, simple sentences"
                },
                "intermediate": {
                    "word_count": "250-350",
                    "vocabulary": "varied vocabulary (B1-B2 level)",
                    "grammar": "mix of tenses, some conditionals and passive voice",
                    "sentence_structure": "mix of simple and compound sentences"
                },
                "advanced": {
                    "word_count": "400-500",
                    "vocabulary": "sophisticated, academic vocabulary (C1-C2 level)",
                    "grammar": "complex tenses, conditionals, passive constructions",
                    "sentence_structure": "complex sentences with subordinate clauses"
                }
            }
            
            specs = level_specs.get(level, level_specs["intermediate"])
            topic_instruction = f" about {topic}" if topic else ""
            
            prompt = f"""Generate a {level} level English reading passage for {reading_type}{topic_instruction}.

Specifications:
- Word count: {specs['word_count']}
- Vocabulary level: {specs['vocabulary']}
- Grammar: {specs['grammar']}
- Sentence structure: {specs['sentence_structure']}

Create 8 comprehension questions with DIFFERENT FORMATS:

QUESTION FORMATS (use variety):
1. Multiple Choice (4 options A/B/C/D) - for main idea, inference, detail
2. True/False - for factual statements
3. Fill in the Blank - for vocabulary/grammar (provide the sentence with _____ and ask for the missing word)

CONTENT TYPES to cover:
- Main Idea (1 question)
- Specific Details (2 questions)
- Inference/Conclusion (1 question)  
- Vocabulary in Context (2 questions - at least 1 fill-in-blank)
- True/False factual statement (2 questions)

Return a JSON object with this EXACT structure:
{{
    "title": "Engaging title for the passage",
    "passage": "The full reading passage text here",
    "questions": [
        {{
            "question": "Question text (for fill_blank, use _____ to mark the blank)",
            "question_format": "multiple_choice|true_false|fill_blank",
            "question_type": "main_idea|detail|inference|vocabulary",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "acceptable_answers": ["answer1", "answer2"]
        }}
    ],
    "word_count": actual_word_count_number,
    "estimated_time": estimated_reading_time_in_minutes
}}

FORMAT RULES:
- multiple_choice: options array with 4 items, correct_answer is index (0-3)
- true_false: options array with ["True", "False"], correct_answer is 0 or 1
- fill_blank: options is null, correct_answer is the main answer (string), acceptable_answers is array of acceptable variations

Example fill_blank question:
{{
    "question": "The weather was _____ and warm.",
    "question_format": "fill_blank",
    "question_type": "vocabulary",
    "options": null,
    "correct_answer": "sunny",
    "acceptable_answers": ["sunny", "bright", "clear"]
}}

IMPORTANT:
- Mix 4-5 multiple_choice, 2 true_false, 1-2 fill_blank
- Make questions interesting and test real comprehension
- For fill_blank, choose words that appear in the passage
- Ensure correct answers are definitively right"""

            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            logger.info(f"[AI Reading] Raw response from OpenAI (first 500 chars): {result_text[:500]}")
            
            # Parse JSON from response
            import json
import logging

logger = logging.getLogger(__name__)
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            logger.info(f"[AI Reading] Cleaned JSON (first 300 chars): {result_text[:300]}")
            
            reading_data = json.loads(result_text)
            
            # Validate structure
            if not reading_data.get('questions'):
                raise ValueError("No questions in response")
            
            # Ensure all questions have required fields
            for idx, q in enumerate(reading_data.get('questions', [])):
                if not q.get('question'):
                    raise ValueError(f"Question {idx} missing 'question' field")
                if not q.get('question_format'):
                    q['question_format'] = 'multiple_choice'  # default
            
            # Add level and type to response
            reading_data["level"] = level
            reading_data["reading_type"] = reading_type
            
            logger.info(f"[AI Reading] Successfully generated passage with {len(reading_data['questions'])} questions")
            
            return reading_data
            
        except Exception as e:
            logger.info(f"Error generating reading passage: {str(e)}")
            import traceback
import logging

logger = logging.getLogger(__name__)
            traceback.print_exc()
            logger.info(f"[AI Reading] Using fallback passage for level: {level}")
            # Return fallback passage based on level
            fallback_passages = {
                "beginner": {
                    "title": "A Day at the Beach",
                    "passage": "Last Sunday, my family and I went to the beach. The weather was sunny and warm. We arrived at 10 o'clock in the morning. My brother and I played volleyball on the sand. My parents sat under a big umbrella and read books. At noon, we ate sandwiches and drank cold juice. In the afternoon, we swam in the sea. The water was cool and clear. We saw many small fish. We had a wonderful time at the beach. We came back home at 5 o'clock. Everyone was tired but happy.",
                    "questions": [
                        {
                            "question": "What is this passage mainly about?",
                            "question_format": "multiple_choice",
                            "question_type": "main_idea",
                            "options": ["A family trip to the beach", "How to play volleyball", "The writer's parents", "Swimming lessons"],
                            "correct_answer": 0
                        },
                        {
                            "question": "The family went to the beach last Sunday.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        },
                        {
                            "question": "The weather was _____ and warm.",
                            "question_format": "fill_blank",
                            "question_type": "vocabulary",
                            "options": None,
                            "correct_answer": "sunny",
                            "acceptable_answers": ["sunny", "bright", "clear", "nice"]
                        },
                        {
                            "question": "What did the writer and their brother do?",
                            "question_format": "multiple_choice",
                            "question_type": "detail",
                            "options": ["Read books", "Played volleyball", "Swam only", "Ate sandwiches"],
                            "correct_answer": 1
                        },
                        {
                            "question": "They saw fish while swimming in the sea.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        },
                        {
                            "question": "We had a _____ time at the beach.",
                            "question_format": "fill_blank",
                            "question_type": "vocabulary",
                            "options": None,
                            "correct_answer": "wonderful",
                            "acceptable_answers": ["wonderful", "great", "good", "amazing", "fantastic"]
                        },
                        {
                            "question": "Why did the family probably feel happy at the end?",
                            "question_format": "multiple_choice",
                            "question_type": "inference",
                            "options": ["They were bored", "They enjoyed the day", "They were hungry", "They were angry"],
                            "correct_answer": 1
                        },
                        {
                            "question": "Everyone came home before 5 o'clock.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 1
                        }
                    ],
                    "word_count": 120,
                    "estimated_time": 3,
                    "level": level,
                    "reading_type": reading_type
                },
                "intermediate": {
                    "title": "The Benefits of Reading",
                    "passage": "Reading is one of the most beneficial activities we can engage in. Whether you prefer fiction, non-fiction, or poetry, reading offers numerous advantages for both your mind and personal growth. First and foremost, reading improves your vocabulary and language skills. When you encounter new words in context, you naturally expand your linguistic knowledge. Additionally, reading enhances your concentration and focus. In our fast-paced digital world, the ability to sit quietly and focus on a single task is becoming increasingly rare. Furthermore, reading stimulates your imagination and creativity. Unlike watching television or movies, reading requires your brain to create the images and scenarios described in the text. This mental exercise strengthens your creative thinking abilities. Studies have also shown that regular reading can reduce stress levels. Getting lost in a good book can transport you to another world, providing a healthy escape from daily pressures. Moreover, reading before bedtime has been proven to improve sleep quality. Finally, reading expands your knowledge and understanding of the world. Through books, you can explore different cultures, historical periods, and perspectives without leaving your home.",
                    "questions": [
                        {
                            "question": "What is the main idea of this passage?",
                            "question_format": "multiple_choice",
                            "question_type": "main_idea",
                            "options": [
                                "Reading is boring and old-fashioned",
                                "Reading has many benefits for the mind and personal growth",
                                "People should only read fiction books",
                                "Reading is only good for children"
                            ],
                            "correct_answer": 1
                        },
                        {
                            "question": "Reading improves vocabulary and language skills.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        },
                        {
                            "question": "Reading _____ your imagination and creativity.",
                            "question_format": "fill_blank",
                            "question_type": "vocabulary",
                            "options": None,
                            "correct_answer": "stimulates",
                            "acceptable_answers": ["stimulates", "enhances", "improves", "boosts", "encourages"]
                        },
                        {
                            "question": "According to the passage, how does reading help with language skills?",
                            "question_format": "multiple_choice",
                            "question_type": "detail",
                            "options": [
                                "By watching TV shows",
                                "By encountering new words in context",
                                "By listening to music",
                                "By playing video games"
                            ],
                            "correct_answer": 1
                        },
                        {
                            "question": "Reading before bedtime can reduce stress levels.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        },
                        {
                            "question": "In our fast-paced digital world, the ability to _____ is becoming rare.",
                            "question_format": "fill_blank",
                            "question_type": "vocabulary",
                            "options": None,
                            "correct_answer": "focus",
                            "acceptable_answers": ["focus", "concentrate", "focus on a single task"]
                        },
                        {
                            "question": "Based on the passage, what can you conclude about modern life?",
                            "question_format": "multiple_choice",
                            "question_type": "inference",
                            "options": [
                                "People find it easy to focus on one task",
                                "The digital world makes concentration more challenging",
                                "Everyone reads books every day",
                                "Television is better than reading"
                            ],
                            "correct_answer": 1
                        },
                        {
                            "question": "Reading can help you explore different cultures without traveling.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        }
                    ],
                    "word_count": 245,
                    "estimated_time": 5,
                    "level": level,
                    "reading_type": reading_type
                },
                "advanced": {
                    "title": "The Impact of Artificial Intelligence on Society",
                    "passage": "Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century, fundamentally reshaping various aspects of human society. From healthcare diagnostics to autonomous vehicles, AI applications are proliferating at an unprecedented rate, prompting both excitement and apprehension about their long-term implications. The integration of machine learning algorithms and neural networks has enabled computers to perform tasks that were once exclusively within the human domain, such as recognizing patterns, making predictions, and even engaging in creative endeavors. However, this technological revolution raises profound questions about employment, privacy, and the very nature of human intelligence. Critics argue that the widespread adoption of AI could lead to significant job displacement, particularly in sectors involving routine cognitive tasks. Manufacturing, customer service, and even certain professional services face potential automation, necessitating a fundamental reevaluation of education and workforce training programs. Conversely, proponents contend that AI will create new categories of employment and enhance human productivity rather than replace it entirely. The ethical dimensions of AI development are equally concerning. Issues surrounding algorithmic bias, data privacy, and autonomous decision-making in critical scenarios demand careful consideration. As AI systems become increasingly sophisticated, the question of accountability becomes more complex. When an autonomous vehicle causes an accident or an AI-driven medical diagnosis proves incorrect, determining responsibility becomes a legal and moral quandary. Nevertheless, the potential benefits of AI are substantial. In healthcare, AI algorithms can analyze medical images with remarkable accuracy, potentially detecting diseases earlier than human practitioners. In environmental science, machine learning models can predict climate patterns and optimize resource allocation. The challenge lies in harnessing these capabilities while mitigating the associated risks through thoughtful regulation and ethical frameworks.",
                    "questions": [
                        {
                            "question": "What is the central theme of this passage?",
                            "question_format": "multiple_choice",
                            "question_type": "main_idea",
                            "options": [
                                "The history of artificial intelligence development",
                                "The transformative impact of AI on society with both benefits and concerns",
                                "Why AI should be banned from all industries",
                                "The technical specifications of AI systems"
                            ],
                            "correct_answer": 1
                        },
                        {
                            "question": "AI applications are proliferating at an unprecedented rate.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 0
                        },
                        {
                            "question": "According to the passage, AI could lead to job _____ in routine cognitive tasks.",
                            "question_format": "fill_blank",
                            "question_type": "vocabulary",
                            "options": None,
                            "correct_answer": "displacement",
                            "acceptable_answers": ["displacement", "loss", "replacement", "elimination"]
                        },
                        {
                            "question": "What can be inferred about the author's view on AI regulation?",
                            "question_format": "multiple_choice",
                            "question_type": "inference",
                            "options": [
                                "Regulation is unnecessary for AI development",
                                "Thoughtful regulation and ethical frameworks are needed",
                                "AI should be completely unregulated",
                                "Only technical experts should decide AI policy"
                            ],
                            "correct_answer": 1
                        },
                        {
                            "question": "The passage discusses only the benefits of AI, not the risks.",
                            "question_format": "true_false",
                            "question_type": "detail",
                            "options": ["True", "False"],
                            "correct_answer": 1
                        },
                        {
                            "question": "What does the word 'proliferating' in the first paragraph most likely mean?",
                            "question_format": "multiple_choice",
                            "question_type": "vocabulary",
                            "options": [
                                "Decreasing rapidly",
                                "Remaining constant",
                                "Spreading or increasing rapidly",
                                "Becoming obsolete"
                            ],
                            "correct_answer": 2
                        },
                        {
                            "question": "In healthcare, AI algorithms can analyze medical _____ with remarkable accuracy.",
                            "question_format": "fill_blank",
                            "question_type": "detail",
                            "options": None,
                            "correct_answer": "images",
                            "acceptable_answers": ["images", "data", "scans", "pictures"]
                        },
                        {
                            "question": "Both critics and proponents agree on AI's impact on employment.",
                            "question_format": "true_false",
                            "question_type": "inference",
                            "options": ["True", "False"],
                            "correct_answer": 1
                        }
                    ],
                    "word_count": 385,
                    "estimated_time": 7,
                    "level": level,
                    "reading_type": reading_type
                }
            }
            
            return fallback_passages.get(level, fallback_passages["intermediate"])
    
    async def check_reading_answers(
        self,
        passage_title: str,
        questions: List[Dict],
        user_answers: List
    ) -> Dict:
        """
        Check reading comprehension answers and provide feedback
        Supports multiple question formats: multiple_choice, true_false, fill_blank
        
        Args:
            passage_title: Title of the reading passage
            questions: List of questions with correct answers
            user_answers: List of user's answers (can be int or str)
            
        Returns:
            Dict with score, feedback, and recommendations
        """
        try:
            total_questions = len(questions)
            correct_count = 0
            results = []
            
            for idx, (question, user_answer) in enumerate(zip(questions, user_answers)):
                question_format = question.get('question_format', 'multiple_choice')
                correct_answer = question.get('correct_answer')
                acceptable_answers = question.get('acceptable_answers', [])
                
                is_correct = False
                explanation = ""
                
                # Check answer based on question format
                if question_format in ['multiple_choice', 'true_false']:
                    # For MC and T/F, answer is index
                    is_correct = user_answer == correct_answer
                    
                    if is_correct:
                        explanation = "Correct! Well done."
                    else:
                        if question.get('options'):
                            explanation = f"The correct answer is '{question['options'][correct_answer]}'."
                        else:
                            explanation = f"Incorrect. The correct answer is: {correct_answer}"
                            
                elif question_format == 'fill_blank':
                    # For fill-in-blank, answer is string - check against acceptable answers
                    user_answer_lower = str(user_answer).lower().strip()
                    correct_answer_lower = str(correct_answer).lower().strip()
                    
                    # Check if answer matches any acceptable answer
                    if acceptable_answers:
                        is_correct = any(
                            user_answer_lower == acceptable.lower().strip() 
                            for acceptable in acceptable_answers
                        )
                    else:
                        is_correct = user_answer_lower == correct_answer_lower
                    
                    if is_correct:
                        explanation = f"Correct! '{user_answer}' is a valid answer."
                    else:
                        if acceptable_answers:
                            explanation = f"Incorrect. Acceptable answers: {', '.join(acceptable_answers)}"
                        else:
                            explanation = f"Incorrect. The correct answer is: {correct_answer}"
                
                if is_correct:
                    correct_count += 1
                
                results.append({
                    "question_index": idx,
                    "is_correct": is_correct,
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "explanation": explanation,
                    "acceptable_answers": acceptable_answers if question_format == 'fill_blank' else None
                })
            
            score = int((correct_count / total_questions) * 100)
            
            # Determine level recommendation
            level_recommendation = None
            if score >= 90:
                level_recommendation = "Excellent! Consider trying advanced level passages."
            elif score >= 70:
                level_recommendation = "Good job! You're doing well at this level."
            elif score >= 50:
                level_recommendation = "Keep practicing at this level to improve."
            else:
                level_recommendation = "Consider trying an easier level to build confidence."
            
            # Generate personalized feedback
            feedback = f"You scored {score}% ({correct_count}/{total_questions} correct). "
            if score >= 80:
                feedback += "Outstanding performance! Your reading comprehension skills are excellent."
            elif score >= 60:
                feedback += "Good work! You understood most of the passage well."
            else:
                feedback += "Keep practicing! Try reading more slowly and carefully."
            
            return {
                "score": score,
                "total_questions": total_questions,
                "correct_answers": correct_count,
                "results": results,
                "level_recommendation": level_recommendation,
                "feedback": feedback
            }
            
        except Exception as e:
            logger.info(f"Error checking reading answers: {str(e)}")
            return {
                "score": 0,
                "total_questions": len(questions),
                "correct_answers": 0,
                "results": [],
                "level_recommendation": "Error occurred while checking answers",
                "feedback": "Sorry, we couldn't check your answers. Please try again."
            }
    
    def grade_writing_sync(
        self,
        writing_text: str,
        prompt: str = None,
        max_score: float = 10.0,
        criteria: dict = None
    ) -> dict:
        """
        Grade writing assignment using OpenAI
        
        Args:
            writing_text: Student's writing content
            prompt: Writing prompt/topic (optional)
            max_score: Maximum score (default 10)
            criteria: Grading criteria dict (optional)
        
        Returns:
            dict: Grading result with score, feedback, and breakdown
        """
        try:
            # Default criteria if not provided
            if criteria is None:
                criteria = {
                    "content": {"weight": 0.3, "name": "Nội dung & Ý tưởng"},
                    "organization": {"weight": 0.2, "name": "Tổ chức bài viết"},
                    "vocabulary": {"weight": 0.2, "name": "Từ vựng"},
                    "grammar": {"weight": 0.2, "name": "Ngữ pháp"},
                    "mechanics": {"weight": 0.1, "name": "Chính tả & Dấu câu"}
                }
            
            # Build grading prompt
            grading_prompt = f"""You are an experienced English teacher grading a student's writing assignment.

WRITING PROMPT: {prompt if prompt else "General writing assignment"}

STUDENT'S WRITING:
{writing_text}

GRADING CRITERIA (Total: {max_score} points):
"""
            
            for key, value in criteria.items():
                grading_prompt += f"\n- {value['name']}: {value['weight'] * 100}%"
            
            grading_prompt += """

Please evaluate the writing and provide:

1. SCORE FOR EACH CRITERION (0-100 scale):
   - Content & Ideas: How well does it address the topic? Are ideas clear and relevant?
   - Organization: Is it well-structured with clear introduction, body, and conclusion?
   - Vocabulary: Is vocabulary appropriate, varied, and accurate?
   - Grammar: Are sentences grammatically correct? Any major errors?
   - Mechanics: Are spelling, punctuation, and capitalization correct?

2. OVERALL SCORE: Calculate weighted average based on criteria percentages

3. DETAILED FEEDBACK:
   - Strengths (what the student did well)
   - Areas for improvement (specific suggestions)
   - Example corrections for major errors

4. SUGGESTIONS: Concrete advice for improvement

Return your response in JSON format:
{
    "scores": {
        "content": <0-100>,
        "organization": <0-100>,
        "vocabulary": <0-100>,
        "grammar": <0-100>,
        "mechanics": <0-100>
    },
    "overall_score": <calculated weighted score 0-100>,
    "word_count": <approximate word count>,
    "strengths": ["strength1", "strength2", ...],
    "improvements": ["improvement1", "improvement2", ...],
    "corrections": ["error1 -> correction1", "error2 -> correction2", ...],
    "detailed_feedback": "Detailed feedback text in Vietnamese",
    "suggestions": "Specific suggestions for improvement in Vietnamese"
}
"""
            
            # Get AI response
            if not self.client:
                raise ValueError("OpenAI API is not configured. Please set OPENAI_API_KEY.")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": grading_prompt}],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean up JSON (remove markdown code blocks if present)
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            # Parse JSON response
            grading_result = json.loads(result_text)
            
            # Calculate final score based on max_score
            overall_percentage = grading_result.get('overall_score', 0)
            final_score = (overall_percentage / 100) * max_score
            
            # Build detailed breakdown
            breakdown = {}
            for key, value in criteria.items():
                criterion_score = grading_result.get('scores', {}).get(key, 0)
                breakdown[key] = {
                    "score": round(criterion_score, 1),
                    "weight": value['weight'],
                    "name": value['name'],
                    "weighted_contribution": round((criterion_score / 100) * value['weight'] * max_score, 2)
                }
            
            return {
                "score": round(final_score, 2),
                "max_score": max_score,
                "percentage": round(overall_percentage, 1),
                "breakdown": breakdown,
                "word_count": grading_result.get('word_count', len(writing_text.split())),
                "strengths": grading_result.get('strengths', []),
                "improvements": grading_result.get('improvements', []),
                "corrections": grading_result.get('corrections', []),
                "feedback": grading_result.get('detailed_feedback', ''),
                "suggestions": grading_result.get('suggestions', ''),
                "raw_scores": grading_result.get('scores', {})
            }
            
        except json.JSONDecodeError as e:
            logger.info(f"Error parsing OpenAI JSON response: {str(e)}")
            logger.info(f"Raw response: {result_text[:500]}")
            # Fallback: basic scoring
            word_count = len(writing_text.split())
            basic_score = min(max_score, (word_count / 100) * max_score * 0.7)
            
            return {
                "score": round(basic_score, 2),
                "max_score": max_score,
                "percentage": round((basic_score / max_score) * 100, 1),
                "breakdown": {},
                "word_count": word_count,
                "strengths": ["Đã hoàn thành bài viết"],
                "improvements": ["Cần teacher review chi tiết hơn"],
                "corrections": [],
                "feedback": "AI không thể phân tích chi tiết. Teacher vui lòng review thủ công.",
                "suggestions": "Hãy kiểm tra ngữ pháp và từ vựng.",
                "error": "JSON parsing failed"
            }
            
        except Exception as e:
            logger.info(f"Error grading writing: {str(e)}")
            return {
                "score": 0,
                "max_score": max_score,
                "percentage": 0,
                "breakdown": {},
                "word_count": 0,
                "strengths": [],
                "improvements": [],
                "corrections": [],
                "feedback": f"Lỗi: {str(e)}",
                "suggestions": "Vui lòng thử lại hoặc liên hệ teacher.",
                "error": str(e)
            }

    async def grade_writing(
        self,
        writing_text: str,
        prompt: str = None,
        max_score: float = 10.0,
        criteria: dict = None
    ) -> dict:
        """
        Async wrapper that calls the synchronous implementation in a thread.
        Keeps backward compatibility with existing await calls.
        """
        return await asyncio.to_thread(
            self.grade_writing_sync,
            writing_text,
            prompt,
            max_score,
            criteria,
        )

    async def generate_lesson_plan(
        self,
        grade: int,
        unit: str,
        lesson_number: str = "Lesson 1",
        duration: int = 45,
        focus_skills: List[str] = None,
        language_functions: str = None,
        vocabulary_topics: List[str] = None,
        grammar_points: List[str] = None,
        additional_notes: str = None
    ) -> Dict:
        """
        Generate a complete lesson plan based on Vietnamese Ngoại ngữ 2018 curriculum
        
        Args:
            grade: Khối lớp (1-12)
            unit: Unit/Chủ đề (VD: Unit 7 - Technology)
            lesson_number: Tiết học (VD: Lesson 1, 2...)
            duration: Thời lượng (phút)
            focus_skills: Kỹ năng tập trung
            language_functions: Chức năng ngôn ngữ
            vocabulary_topics: Chủ đề từ vựng
            grammar_points: Điểm ngữ pháp
            additional_notes: Ghi chú thêm
            
        Returns:
            Dict với đầy đủ thông tin giáo án
        """
        try:
            # Build comprehensive prompt
            prompt = f"""Bạn là một giáo viên Tiếng Anh có kinh nghiệm, đang soạn giáo án theo Chương trình Giáo dục phổ thông môn Ngoại ngữ 2018 của Việt Nam.

THÔNG TIN BÀI HỌC:
- Khối lớp: {grade}
- Unit/Chủ đề: {unit}
- Tiết học: {lesson_number}
- Thời lượng: {duration} phút
"""
            
            if focus_skills:
                prompt += f"- Kỹ năng tập trung: {', '.join(focus_skills)}\n"
            if language_functions:
                prompt += f"- Chức năng ngôn ngữ: {language_functions}\n"
            if vocabulary_topics:
                prompt += f"- Chủ đề từ vựng: {', '.join(vocabulary_topics)}\n"
            if grammar_points:
                prompt += f"- Điểm ngữ pháp: {', '.join(grammar_points)}\n"
            if additional_notes:
                prompt += f"- Ghi chú: {additional_notes}\n"
            
            prompt += """
YÊU CẦU:
1. BÁM SÁT Chương trình Giáo dục phổ thông môn Ngoại ngữ 2018
2. Phát triển năng lực giao tiếp bằng Tiếng Anh
3. Sử dụng phương pháp dạy học tích cực, lấy học sinh làm trung tâm

Hãy tạo giáo án chi tiết theo cấu trúc JSON sau:

{
    "title": "Tên bài học cụ thể",
    "objectives": {
        "knowledge": [
            "Kiến thức cần đạt 1",
            "Kiến thức cần đạt 2"
        ],
        "skills": [
            "Kỹ năng Listening",
            "Kỹ năng Speaking", 
            "Kỹ năng Reading",
            "Kỹ năng Writing"
        ],
        "competencies": [
            "Năng lực tự học và tự chủ",
            "Năng lực giao tiếp và hợp tác",
            "Năng lực giải quyết vấn đề và sáng tạo",
            "Năng lực sử dụng ngôn ngữ"
        ],
        "qualities": [
            "Yêu nước, tự hào dân tộc",
            "Nhân ái, khoan dung",
            "Chăm chỉ, trung thực",
            "Trách nhiệm"
        ]
    },
    "teaching_aids": [
        "Projector/TV",
        "Computer/Laptop",
        "Textbook",
        "Flashcards",
        "Audio/Video materials",
        "Handouts/Worksheets"
    ],
    "activities": {
        "warm_up": {
            "name": "Hoạt động khởi động",
            "duration": 5,
            "objectives": "Tạo hứng thú, kết nối với bài học",
            "content": "Mô tả chi tiết hoạt động khởi động",
            "methods": ["Brainstorming", "Game", "Discussion"],
            "teacher_activities": "Hoạt động của giáo viên",
            "student_activities": "Hoạt động của học sinh",
            "resources": ["Flashcards", "Questions"]
        },
        "presentation": {
            "name": "Hình thành kiến thức mới",
            "duration": 15,
            "objectives": "Giới thiệu từ vựng, ngữ pháp, chức năng ngôn ngữ",
            "content": "Mô tả chi tiết cách giới thiệu kiến thức mới",
            "methods": ["Presentation", "Demonstration", "Guided discovery"],
            "teacher_activities": "Hướng dẫn, trình bày, demo",
            "student_activities": "Quan sát, lắng nghe, ghi chép, đặt câu hỏi",
            "resources": ["PPT", "Video", "Audio"]
        },
        "practice": {
            "name": "Luyện tập",
            "duration": 15,
            "objectives": "Thực hành, củng cố kiến thức",
            "content": "Các hoạt động luyện tập từ controlled đến freer practice",
            "methods": ["Pair work", "Group work", "Role-play", "Drills"],
            "teacher_activities": "Hướng dẫn, giám sát, hỗ trợ",
            "student_activities": "Thực hành theo cặp/nhóm",
            "resources": ["Worksheets", "Task cards"]
        },
        "production": {
            "name": "Vận dụng",
            "duration": 8,
            "objectives": "Sử dụng ngôn ngữ trong tình huống thực tế",
            "content": "Hoạt động giao tiếp thực tế, sáng tạo",
            "methods": ["Project", "Presentation", "Discussion", "Creative task"],
            "teacher_activities": "Đánh giá, góp ý",
            "student_activities": "Thực hiện nhiệm vụ, trình bày",
            "resources": ["Props", "Materials"]
        }
    },
    "notes": "Lưu ý cho giáo viên khi dạy bài này",
    "homework": "Bài tập về nhà cụ thể cho học sinh"
}

QUAN TRỌNG:
- Nội dung phải PHÙ HỢP với lứa tuổi khối """ + str(grade) + """
- Sử dụng phương pháp giao tiếp (Communicative Language Teaching)
- Tích hợp 4 kỹ năng Nghe-Nói-Đọc-Viết
- Hoạt động đa dạng: cá nhân, cặp đôi, nhóm
- Thời gian mỗi hoạt động hợp lý (tổng = """ + str(duration) + """ phút)
"""
            
            # Generate with OpenAI
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON
            import json
import logging

logger = logging.getLogger(__name__)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            lesson_plan_data = json.loads(result_text)
            
            return lesson_plan_data
            
        except Exception as e:
            logger.info(f"Error generating lesson plan: {str(e)}")
            # Return fallback lesson plan structure
            return {
                "title": f"{unit} - {lesson_number}",
                "objectives": {
                    "knowledge": [
                        "Học sinh nhận biết và hiểu các từ vựng chủ đề của bài học",
                        "Học sinh nắm được cấu trúc ngữ pháp cơ bản"
                    ],
                    "skills": [
                        "Nghe hiểu thông tin chính",
                        "Nói về chủ đề bài học",
                        "Đọc hiểu đoạn văn",
                        "Viết câu đơn giản"
                    ],
                    "competencies": [
                        "Năng lực tự học",
                        "Năng lực giao tiếp",
                        "Năng lực sáng tạo"
                    ],
                    "qualities": [
                        "Chăm chỉ",
                        "Tự tin",
                        "Hợp tác"
                    ]
                },
                "teaching_aids": ["Textbook", "Projector", "Flashcards"],
                "activities": {
                    "warm_up": {
                        "name": "Khởi động",
                        "duration": 5,
                        "objectives": "Tạo hứng thú",
                        "content": "Game/activity liên quan đến chủ đề",
                        "methods": ["Game"],
                        "teacher_activities": "Tổ chức game",
                        "student_activities": "Tham gia game",
                        "resources": []
                    },
                    "presentation": {
                        "name": "Giới thiệu",
                        "duration": 15,
                        "objectives": "Giới thiệu kiến thức mới",
                        "content": "Trình bày từ vựng và cấu trúc",
                        "methods": ["Presentation"],
                        "teacher_activities": "Giảng dạy",
                        "student_activities": "Lắng nghe",
                        "resources": ["PPT"]
                    },
                    "practice": {
                        "name": "Thực hành",
                        "duration": 15,
                        "objectives": "Luyện tập",
                        "content": "Bài tập áp dụng",
                        "methods": ["Practice"],
                        "teacher_activities": "Hướng dẫn",
                        "student_activities": "Làm bài tập",
                        "resources": ["Worksheets"]
                    },
                    "production": {
                        "name": "Vận dụng",
                        "duration": 8,
                        "objectives": "Sử dụng ngôn ngữ",
                        "content": "Hoạt động giao tiếp",
                        "methods": ["Speaking"],
                        "teacher_activities": "Đánh giá",
                        "student_activities": "Trình bày",
                        "resources": []
                    }
                },
                "notes": "Lưu ý phù hợp với trình độ học sinh",
                "homework": "Ôn tập từ vựng và làm bài tập"
            }
    
    async def generate_worksheet(
        self,
        grade: int,
        unit: str,
        worksheet_type: str,
        skill_focus: str = "reading",
        difficulty_level: str = "medium",
        num_questions: int = 10,
        duration: int = 30,
        vocabulary_topics: List[str] = None,
        grammar_points: List[str] = None,
        language_functions: str = None,
        additional_notes: str = None
    ) -> Dict:
        """
        Generate worksheet (phiếu học tập) for English learning
        
        Args:
            grade: Khối lớp (1-12)
            unit: Unit/Chủ đề
            worksheet_type: Loại phiếu (multiple_choice, essay, fill_in_blank, etc.)
            skill_focus: Kỹ năng tập trung
            difficulty_level: Độ khó (easy, medium, hard)
            num_questions: Số câu hỏi
            duration: Thời gian làm bài (phút)
            vocabulary_topics: Chủ đề từ vựng
            grammar_points: Điểm ngữ pháp
            language_functions: Chức năng ngôn ngữ
            additional_notes: Ghi chú thêm
            
        Returns:
            Dict với đầy đủ nội dung phiếu học tập
        """
        try:
            # Define worksheet type descriptions
            type_descriptions = {
                "multiple_choice": "Bài tập trắc nghiệm với 4 lựa chọn A, B, C, D",
                "essay": "Bài tập tự luận yêu cầu viết đoạn văn, bài văn",
                "fill_in_blank": "Bài tập điền khuyết với từ/cụm từ thích hợp",
                "topic_based": "Bài tập tổng hợp theo chủ đề cụ thể",
                "self_study": "Phiếu hướng dẫn tự học với các nhiệm vụ và tài liệu",
                "situational": "Bài tập tình huống thực tế cần vận dụng kiến thức",
                "mixed": "Kết hợp nhiều dạng bài tập"
            }
            
            # Difficulty descriptions
            difficulty_desc = {
                "easy": "dễ, phù hợp với học sinh cần củng cố cơ bản",
                "medium": "trung bình, phù hợp với đa số học sinh",
                "hard": "khó, phù hợp với học sinh khá giỏi"
            }
            
            type_desc = type_descriptions.get(worksheet_type, worksheet_type)
            diff_desc = difficulty_desc.get(difficulty_level, "trung bình")
            
            prompt = f"""Bạn là giáo viên Tiếng Anh, đang tạo phiếu học tập cho học sinh theo Chương trình 2018.

THÔNG TIN PHIẾU HỌC TẬP:
- Khối lớp: {grade}
- Unit/Chủ đề: {unit}
- Loại phiếu: {type_desc}
- Kỹ năng: {skill_focus}
- Độ khó: {diff_desc}
- Số câu hỏi: {num_questions}
- Thời gian: {duration} phút
"""
            
            if vocabulary_topics:
                prompt += f"- Chủ đề từ vựng: {', '.join(vocabulary_topics)}\n"
            if grammar_points:
                prompt += f"- Điểm ngữ pháp: {', '.join(grammar_points)}\n"
            if language_functions:
                prompt += f"- Chức năng ngôn ngữ: {language_functions}\n"
            if additional_notes:
                prompt += f"- Ghi chú: {additional_notes}\n"
            
            # Specific instructions based on worksheet type
            if worksheet_type == "multiple_choice":
                prompt += """
Tạo phiếu học tập trắc nghiệm với format JSON:
{
    "title": "Tên phiếu học tập hấp dẫn",
    "instructions": "Hướng dẫn làm bài cho học sinh",
    "content": {
        "questions": [
            {
                "question_number": 1,
                "question_text": "Câu hỏi",
                "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                "correct_answer": 0,
                "explanation": "Giải thích đáp án",
                "points": 1
            }
        ]
    },
    "teacher_notes": "Ghi chú cho giáo viên",
    "answer_key": {
        "answers": [0, 1, 2, ...],
        "total_points": 10
    },
    "total_points": 10
}
"""
            
            elif worksheet_type == "fill_in_blank":
                prompt += """
Tạo phiếu điền khuyết với format JSON:
{
    "title": "Tên phiếu học tập",
    "instructions": "Hướng dẫn: Điền từ/cụm từ thích hợp vào chỗ trống",
    "content": {
        "questions": [
            {
                "question_number": 1,
                "sentence": "Câu có chỗ trống được đánh dấu _____",
                "correct_answer": "từ đúng",
                "acceptable_answers": ["từ đúng", "từ tương đương"],
                "hint": "Gợi ý (nếu có)",
                "points": 1
            }
        ]
    },
    "teacher_notes": "Ghi chú cho giáo viên",
    "answer_key": {
        "answers": ["answer1", "answer2", ...],
        "total_points": 10
    },
    "total_points": 10
}
"""
            
            elif worksheet_type == "essay":
                prompt += """
Tạo phiếu bài tập viết với format JSON:
{
    "title": "Tên phiếu học tập",
    "instructions": "Hướng dẫn viết bài",
    "content": {
        "writing_prompts": [
            {
                "prompt": "Đề bài viết 1",
                "word_count": "100-150 words",
                "tips": ["Tip 1", "Tip 2"],
                "criteria": {
                    "content": "Đánh giá nội dung (30%)",
                    "organization": "Tổ chức bài viết (20%)",
                    "vocabulary": "Từ vựng (20%)",
                    "grammar": "Ngữ pháp (20%)",
                    "mechanics": "Chính tả (10%)"
                }
            }
        ]
    },
    "teacher_notes": "Hướng dẫn chấm bài",
    "answer_key": {
        "sample_answer": "Bài mẫu tham khảo",
        "rubric": "Tiêu chí chấm điểm chi tiết"
    },
    "total_points": 10
}
"""
            
            else:  # mixed or other types
                prompt += """
Tạo phiếu học tập đa dạng với format JSON:
{
    "title": "Tên phiếu học tập",
    "instructions": "Hướng dẫn chung",
    "content": {
        "sections": [
            {
                "section_name": "Phần 1: Trắc nghiệm",
                "questions": [...]
            },
            {
                "section_name": "Phần 2: Tự luận",
                "questions": [...]
            }
        ]
    },
    "teacher_notes": "Ghi chú cho giáo viên",
    "answer_key": {},
    "total_points": 10
}
"""
            
            prompt += f"""
YÊU CẦU:
- Nội dung phù hợp với khối {grade}, độ khó {difficulty_level}
- Câu hỏi rõ ràng, không gây nhầm lẫn
- Đáp án chính xác
- Có giải thích/hướng dẫn
- Thời gian làm bài hợp lý ({duration} phút)
- Bám sát chương trình 2018
"""
            
            # Generate with OpenAI
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON
            import json
import logging

logger = logging.getLogger(__name__)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            worksheet_data = json.loads(result_text)
            
            return worksheet_data
            
        except Exception as e:
            logger.info(f"Error generating worksheet: {str(e)}")
            # Return fallback worksheet
            return {
                "title": f"{unit} - {worksheet_type.title()} Exercise",
                "instructions": f"Complete the following {worksheet_type.replace('_', ' ')} questions.",
                "content": {
                    "questions": [
                        {
                            "question_number": i + 1,
                            "question_text": f"Question {i + 1}",
                            "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                            "correct_answer": 0,
                            "points": 1
                        }
                        for i in range(min(num_questions, 5))
                    ]
                },
                "teacher_notes": "Review with students after completion",
                "answer_key": {
                    "answers": [0] * min(num_questions, 5),
                    "total_points": min(num_questions, 5)
                },
                "total_points": min(num_questions, 5)
            }


# Create a singleton instance
openai_service = OpenAIService()


