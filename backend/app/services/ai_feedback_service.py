"""
AI Feedback Service for Exercises
Generates detailed feedback for Listening, Reading, Writing, Speaking exercises
"""
import os
from typing import Dict, List, Optional

# Optional OpenAI import - service works without it
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

class AIFeedbackService:
    def __init__(self):
        # Initialize OpenAI client (will use Azure OpenAI in production)
        api_key = os.getenv("OPENAI_API_KEY", "")
        if OPENAI_AVAILABLE and api_key:
            self.client = OpenAI(api_key=api_key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
    
    def generate_listening_feedback(
        self,
        score: float,
        correct_answers: int,
        total_questions: int,
        time_spent: int,
        user_level: str = "Intermediate"
    ) -> Dict:
        """
        Generate AI feedback for listening exercise
        
        Args:
            score: Score from 0-100
            correct_answers: Number of correct answers
            total_questions: Total questions
            time_spent: Time in seconds
            user_level: User's current level
        
        Returns:
            Dict with feedback and recommendations
        """
        percentage = (score / 100) * 100
        
        # Determine performance level
        if percentage >= 90:
            level = "Xuất sắc"
            emoji = "🌟"
        elif percentage >= 80:
            level = "Tốt"
            emoji = "🎯"
        elif percentage >= 70:
            level = "Khá"
            emoji = "👍"
        elif percentage >= 60:
            level = "Trung bình"
            emoji = "📚"
        else:
            level = "Cần cải thiện"
            emoji = "💪"
        
        # Generate feedback
        feedback = {
            "overall_assessment": f"{emoji} {level}! Bạn đã trả lời đúng {correct_answers}/{total_questions} câu.",
            "score_interpretation": self._interpret_listening_score(percentage),
            "strengths": self._identify_listening_strengths(percentage),
            "areas_to_improve": self._identify_listening_weaknesses(percentage),
            "recommendations": self._get_listening_recommendations(percentage, user_level),
            "next_steps": self._get_next_steps("listening", percentage),
            "motivational_message": self._get_motivational_message(percentage)
        }
        
        # Add AI-generated insights if available
        if self.enabled:
            try:
                ai_insights = self._generate_ai_insights(
                    skill="listening",
                    score=score,
                    correct=correct_answers,
                    total=total_questions,
                    level=user_level
                )
                feedback["ai_insights"] = ai_insights
            except Exception as e:
                print(f"[AI FEEDBACK] Error generating AI insights: {e}")
        
        return feedback
    
    def generate_reading_feedback(
        self,
        score: float,
        correct_answers: int,
        total_questions: int,
        time_spent: int,
        user_level: str = "Intermediate"
    ) -> Dict:
        """Generate AI feedback for reading exercise"""
        percentage = (score / 100) * 100
        
        if percentage >= 90:
            level = "Xuất sắc"
            emoji = "📖✨"
        elif percentage >= 80:
            level = "Tốt"
            emoji = "📚"
        elif percentage >= 70:
            level = "Khá"
            emoji = "👓"
        elif percentage >= 60:
            level = "Trung bình"
            emoji = "📄"
        else:
            level = "Cần cải thiện"
            emoji = "💪"
        
        feedback = {
            "overall_assessment": f"{emoji} {level}! Bạn đã trả lời đúng {correct_answers}/{total_questions} câu.",
            "score_interpretation": self._interpret_reading_score(percentage),
            "strengths": self._identify_reading_strengths(percentage),
            "areas_to_improve": self._identify_reading_weaknesses(percentage),
            "recommendations": self._get_reading_recommendations(percentage, user_level),
            "next_steps": self._get_next_steps("reading", percentage),
            "motivational_message": self._get_motivational_message(percentage)
        }
        
        if self.enabled:
            try:
                ai_insights = self._generate_ai_insights(
                    skill="reading",
                    score=score,
                    correct=correct_answers,
                    total=total_questions,
                    level=user_level
                )
                feedback["ai_insights"] = ai_insights
            except Exception as e:
                print(f"[AI FEEDBACK] Error: {e}")
        
        return feedback
    
    def generate_writing_feedback(
        self,
        essay_text: str,
        word_count: int,
        target_words: int,
        time_spent: int,
        user_level: str = "Intermediate"
    ) -> Dict:
        """Generate AI feedback for writing exercise"""
        
        # Basic scoring based on word count and structure
        word_ratio = min(word_count / target_words, 1.2)  # Cap at 120%
        base_score = word_ratio * 70  # Up to 84 points for word count
        
        # Analyze text structure
        sentences = essay_text.split('.')
        sentence_count = len([s for s in sentences if s.strip()])
        avg_words_per_sentence = word_count / max(sentence_count, 1)
        
        # Structure bonus (good sentence length = 15-25 words)
        if 15 <= avg_words_per_sentence <= 25:
            structure_bonus = 10
        elif 10 <= avg_words_per_sentence <= 30:
            structure_bonus = 5
        else:
            structure_bonus = 0
        
        # Paragraph count
        paragraphs = essay_text.split('\n\n')
        paragraph_count = len([p for p in paragraphs if p.strip()])
        paragraph_bonus = min(paragraph_count * 2, 6)  # Max 6 points
        
        estimated_score = min(base_score + structure_bonus + paragraph_bonus, 100)
        
        if estimated_score >= 90:
            level = "Xuất sắc"
            emoji = "✍️✨"
        elif estimated_score >= 80:
            level = "Tốt"
            emoji = "📝"
        elif estimated_score >= 70:
            level = "Khá"
            emoji = "✏️"
        elif estimated_score >= 60:
            level = "Trung bình"
            emoji = "📄"
        else:
            level = "Cần cải thiện"
            emoji = "💪"
        
        feedback = {
            "estimated_score": round(estimated_score, 1),
            "overall_assessment": f"{emoji} {level}! Bạn đã viết {word_count} từ trong {sentence_count} câu.",
            "score_interpretation": self._interpret_writing_score(estimated_score),
            "structure_analysis": {
                "word_count": word_count,
                "target_words": target_words,
                "sentence_count": sentence_count,
                "paragraph_count": paragraph_count,
                "avg_words_per_sentence": round(avg_words_per_sentence, 1)
            },
            "strengths": self._identify_writing_strengths(estimated_score, word_ratio, avg_words_per_sentence),
            "areas_to_improve": self._identify_writing_weaknesses(estimated_score, word_ratio, avg_words_per_sentence),
            "recommendations": self._get_writing_recommendations(estimated_score, user_level),
            "next_steps": self._get_next_steps("writing", estimated_score),
            "motivational_message": self._get_motivational_message(estimated_score)
        }
        
        # Add detailed AI analysis if available
        if self.enabled and word_count > 50:
            try:
                ai_analysis = self._generate_writing_ai_analysis(essay_text, user_level)
                feedback["ai_analysis"] = ai_analysis
            except Exception as e:
                print(f"[AI FEEDBACK] Error: {e}")
        
        return feedback
    
    # Helper methods for score interpretation
    def _interpret_listening_score(self, percentage: float) -> str:
        if percentage >= 90:
            return "Khả năng nghe hiểu của bạn rất tốt! Bạn có thể nắm bắt hầu hết thông tin từ audio."
        elif percentage >= 80:
            return "Bạn có khả năng nghe hiểu tốt, chỉ bỏ lỡ một vài chi tiết nhỏ."
        elif percentage >= 70:
            return "Bạn hiểu được ý chính nhưng cần cải thiện việc nắm bắt chi tiết."
        elif percentage >= 60:
            return "Bạn có thể hiểu được một phần nhưng cần luyện tập nhiều hơn để cải thiện."
        else:
            return "Khả năng nghe hiểu cần được cải thiện. Đừng lo lắng, hãy luyện tập đều đặn!"
    
    def _interpret_reading_score(self, percentage: float) -> str:
        if percentage >= 90:
            return "Khả năng đọc hiểu của bạn xuất sắc! Bạn nắm vững cả ý chính lẫn chi tiết."
        elif percentage >= 80:
            return "Bạn đọc hiểu tốt và có thể phân tích nội dung một cách chính xác."
        elif percentage >= 70:
            return "Bạn hiểu được nội dung chính nhưng đôi khi bỏ lỡ các chi tiết quan trọng."
        elif percentage >= 60:
            return "Bạn cần cải thiện kỹ năng đọc quét và đọc lướt để nắm bắt thông tin nhanh hơn."
        else:
            return "Hãy đọc nhiều hơn và chú ý đến từ vựng cũng như cấu trúc câu!"
    
    def _interpret_writing_score(self, score: float) -> str:
        if score >= 90:
            return "Bài viết của bạn rất tốt với cấu trúc rõ ràng và nội dung phong phú!"
        elif score >= 80:
            return "Bài viết của bạn tốt, có cấu trúc logic và sử dụng từ vựng phù hợp."
        elif score >= 70:
            return "Bài viết của bạn ở mức khá nhưng cần cải thiện về từ vựng và cấu trúc."
        elif score >= 60:
            return "Bài viết cần cải thiện về độ dài, cấu trúc và sự mạch lạc."
        else:
            return "Hãy luyện viết nhiều hơn, chú ý đến cấu trúc câu và từ vựng!"
    
    def _identify_listening_strengths(self, percentage: float) -> List[str]:
        strengths = []
        if percentage >= 80:
            strengths.append("Khả năng nắm bắt ý chính rất tốt")
            strengths.append("Hiểu được ngữ cảnh và tình huống giao tiếp")
        if percentage >= 70:
            strengths.append("Có thể theo dõi cuộc hội thoại")
            strengths.append("Nhận diện được từ khóa quan trọng")
        if percentage >= 60:
            strengths.append("Đã có nền tảng nghe hiểu cơ bản")
        return strengths if strengths else ["Đã hoàn thành bài tập và đang tiến bộ"]
    
    def _identify_listening_weaknesses(self, percentage: float) -> List[str]:
        weaknesses = []
        if percentage < 90:
            weaknesses.append("Cần chú ý hơn đến các chi tiết nhỏ trong audio")
        if percentage < 80:
            weaknesses.append("Cần luyện tập nhận diện các từ vựng trong ngữ cảnh")
        if percentage < 70:
            weaknesses.append("Cần cải thiện khả năng tập trung khi nghe")
            weaknesses.append("Nên làm quen với nhiều giọng nói và tốc độ khác nhau")
        if percentage < 60:
            weaknesses.append("Cần mở rộng vốn từ vựng")
            weaknesses.append("Nên luyện nghe nhiều hơn mỗi ngày")
        return weaknesses if weaknesses else ["Tiếp tục duy trì phong độ!"]
    
    def _identify_reading_strengths(self, percentage: float) -> List[str]:
        strengths = []
        if percentage >= 80:
            strengths.append("Hiểu rõ ý chính và cấu trúc bài đọc")
            strengths.append("Có khả năng suy luận và phân tích tốt")
        if percentage >= 70:
            strengths.append("Nắm được thông tin chính trong văn bản")
            strengths.append("Có thể tìm kiếm thông tin cụ thể")
        if percentage >= 60:
            strengths.append("Đã có nền tảng đọc hiểu cơ bản")
        return strengths if strengths else ["Đang trên đà cải thiện"]
    
    def _identify_reading_weaknesses(self, percentage: float) -> List[str]:
        weaknesses = []
        if percentage < 90:
            weaknesses.append("Cần cải thiện khả năng hiểu ngụ ý và ý nghĩa sâu xa")
        if percentage < 80:
            weaknesses.append("Nên luyện tập đọc quét (scanning) và đọc lướt (skimming)")
        if percentage < 70:
            weaknesses.append("Cần mở rộng vốn từ vựng học thuật")
            weaknesses.append("Nên luyện tập phân tích cấu trúc đoạn văn")
        if percentage < 60:
            weaknesses.append("Cần đọc nhiều hơn để làm quen với các dạng văn bản")
            weaknesses.append("Nên học cách đoán nghĩa từ qua ngữ cảnh")
        return weaknesses if weaknesses else ["Tiếp tục phát huy!"]
    
    def _identify_writing_strengths(self, score: float, word_ratio: float, avg_words: float) -> List[str]:
        strengths = []
        if word_ratio >= 0.9:
            strengths.append("Đáp ứng tốt yêu cầu về độ dài bài viết")
        if 15 <= avg_words <= 25:
            strengths.append("Độ dài câu phù hợp, dễ đọc và dễ hiểu")
        if score >= 80:
            strengths.append("Cấu trúc bài viết rõ ràng và logic")
        return strengths if strengths else ["Đã hoàn thành bài viết"]
    
    def _identify_writing_weaknesses(self, score: float, word_ratio: float, avg_words: float) -> List[str]:
        weaknesses = []
        if word_ratio < 0.8:
            weaknesses.append("Bài viết cần dài hơn để triển khai đầy đủ ý tưởng")
        if avg_words < 10:
            weaknesses.append("Câu quá ngắn, nên viết câu phức hợp hơn")
        elif avg_words > 30:
            weaknesses.append("Câu hơi dài, nên chia thành nhiều câu ngắn hơn")
        if score < 80:
            weaknesses.append("Cần cải thiện cấu trúc và tổ chức ý")
        if score < 70:
            weaknesses.append("Nên sử dụng nhiều từ nối và cụm từ chuyển tiếp hơn")
            weaknesses.append("Cần làm phong phú thêm vốn từ vựng")
        return weaknesses if weaknesses else ["Tiếp tục cải thiện!"]
    
    def _get_listening_recommendations(self, percentage: float, level: str) -> List[str]:
        recs = []
        if percentage < 70:
            recs.append("🎧 Nghe podcast tiếng Anh 15-20 phút mỗi ngày")
            recs.append("📺 Xem phim/series có phụ đề tiếng Anh")
            recs.append("🎵 Nghe nhạc và đọc lời bài hát")
        if percentage < 80:
            recs.append("📻 Luyện nghe với nhiều giọng nói khác nhau (British, American, Australian)")
            recs.append("🗣️ Tham gia các khóa luyện nghe theo chủ đề")
        if percentage >= 80:
            recs.append("🎯 Thử thách với bài nghe không phụ đề")
            recs.append("📡 Nghe tin tức, talk show chuyên sâu")
        return recs
    
    def _get_reading_recommendations(self, percentage: float, level: str) -> List[str]:
        recs = []
        if percentage < 70:
            recs.append("📖 Đọc sách/truyện ngắn phù hợp với trình độ 15-20 phút/ngày")
            recs.append("📰 Đọc tin tức tiếng Anh về chủ đề yêu thích")
            recs.append("📚 Làm bài tập đọc hiểu có giải thích chi tiết")
        if percentage < 80:
            recs.append("📝 Luyện tập kỹ thuật đọc quét và đọc lướt")
            recs.append("🔍 Phân tích cấu trúc bài đọc và cách triển khai ý")
        if percentage >= 80:
            recs.append("📑 Đọc các bài báo học thuật hoặc chuyên ngành")
            recs.append("💭 Thực hành tóm tắt và phân tích bài đọc")
        return recs
    
    def _get_writing_recommendations(self, score: float, level: str) -> List[str]:
        recs = []
        if score < 70:
            recs.append("✍️ Viết nhật ký tiếng Anh 100-150 từ mỗi ngày")
            recs.append("📝 Học các mẫu câu và cấu trúc cơ bản")
            recs.append("📖 Đọc nhiều để học cách dùng từ trong ngữ cảnh")
        if score < 80:
            recs.append("🎯 Luyện viết theo dàn ý rõ ràng (Introduction - Body - Conclusion)")
            recs.append("🔗 Sử dụng nhiều từ nối để bài viết mạch lạc hơn")
        if score >= 80:
            recs.append("💡 Thử viết các thể loại văn bản khác nhau (essay, letter, report)")
            recs.append("👥 Nhờ người khác đọc và góp ý bài viết")
        return recs
    
    def _get_next_steps(self, skill: str, score: float) -> List[str]:
        steps = []
        if score < 60:
            steps.append("Ôn lại nền tảng cơ bản")
            steps.append("Luyện tập với bài dễ hơn")
            steps.append("Dành 30 phút mỗi ngày cho kỹ năng này")
        elif score < 80:
            steps.append("Tiếp tục luyện tập đều đặn")
            steps.append("Thử các bài tập nâng cao dần")
            steps.append("Kết hợp nhiều nguồn học liệu")
        else:
            steps.append("Duy trì và nâng cao kỹ năng")
            steps.append("Thử thách bản thân với bài khó hơn")
            steps.append("Hỗ trợ người khác học tập")
        return steps
    
    def _get_motivational_message(self, score: float) -> str:
        if score >= 90:
            return "🎉 Xuất sắc! Bạn đã thể hiện năng lực vượt trội. Hãy tiếp tục phát huy!"
        elif score >= 80:
            return "👏 Làm tốt lắm! Bạn đang trên con đường thành công. Cố gắng thêm chút nữa!"
        elif score >= 70:
            return "💪 Bạn đang tiến bộ rõ rệt! Đừng bỏ cuộc, thành công đang ở phía trước!"
        elif score >= 60:
            return "🌱 Mỗi ngày một chút, bạn sẽ tiến bộ. Hãy kiên trì luyện tập!"
        else:
            return "🚀 Đừng nản chí! Mọi chuyên gia đều bắt đầu từ con số 0. Bạn có thể làm được!"
    
    def _generate_ai_insights(
        self,
        skill: str,
        score: float,
        correct: int,
        total: int,
        level: str
    ) -> str:
        """Generate AI insights using OpenAI API"""
        if not self.enabled or not OPENAI_AVAILABLE:
            return ""
        
        try:
            prompt = f"""You are an expert English teacher providing feedback to a {level} level student.

Skill: {skill.upper()}
Score: {score}/100
Correct answers: {correct}/{total}

Provide a brief, encouraging analysis (2-3 sentences) about:
1. What they did well
2. One specific area to focus on improving
3. A motivational closing

Write in Vietnamese, be warm and encouraging."""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a supportive English teacher who gives constructive feedback in Vietnamese."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[AI INSIGHTS] Error: {e}")
            return ""
    
    def _generate_writing_ai_analysis(self, essay_text: str, level: str) -> Dict:
        """Generate detailed AI analysis for writing"""
        if not self.enabled or not OPENAI_AVAILABLE or len(essay_text) < 50:
            return {}
        
        try:
            prompt = f"""Analyze this English essay written by a {level} level student:

"{essay_text}"

Provide a brief analysis in Vietnamese covering:
1. Grammar quality (1-2 sentences)
2. Vocabulary richness (1-2 sentences)
3. Coherence and cohesion (1-2 sentences)
4. One specific improvement suggestion

Be constructive and encouraging."""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert English writing instructor analyzing student essays. Respond in Vietnamese."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            analysis_text = response.choices[0].message.content.strip()
            
            return {
                "detailed_analysis": analysis_text,
                "generated_by": "AI"
            }
        except Exception as e:
            print(f"[AI ANALYSIS] Error: {e}")
            return {}


# Singleton instance
ai_feedback_service = AIFeedbackService()

