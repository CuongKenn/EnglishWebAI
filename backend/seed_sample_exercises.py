"""
Seed sample exercises with full content for testing
"""
from app.core.database import SessionLocal
from app.models.exercise import Exercise
from datetime import datetime, timedelta

def seed_sample_exercises():
    db = SessionLocal()
    
    # Delete old test exercises
    db.query(Exercise).filter(Exercise.title.in_(['test', 't'])).delete()
    
    # 1. LISTENING EXERCISE
    listening_ex = Exercise(
        class_id=1,
        title="Listening: Daily Conversation",
        description="Nghe đoạn hội thoại và trả lời câu hỏi",
        type="skill_exercise",
        skill_type="listening",
        max_score=10,
        duration=20,
        due_at=datetime.now() + timedelta(days=7),
        content={
            "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "transcript": "A: Good morning! How can I help you today?\nB: Hi, I'm looking for a book about English grammar.\nA: Sure, we have several options. What level are you looking for?\nB: I'm intermediate, preparing for IELTS.\nA: Great! I recommend this book here. It covers all grammar points for IELTS.",
            "show_transcript": False,
            "questions": [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "question": "What is person B looking for?",
                    "options": [
                        "A. A dictionary",
                        "B. A grammar book",
                        "C. A novel",
                        "D. A magazine"
                    ],
                    "correct_answer": "B",
                    "points": 2
                },
                {
                    "id": "q2",
                    "type": "multiple_choice",
                    "question": "What level is person B?",
                    "options": [
                        "A. Beginner",
                        "B. Intermediate",
                        "C. Advanced",
                        "D. Expert"
                    ],
                    "correct_answer": "B",
                    "points": 2
                },
                {
                    "id": "q3",
                    "type": "fill_blank",
                    "question": "Person B is preparing for _______.",
                    "correct_answer": "IELTS",
                    "points": 2
                },
                {
                    "id": "q4",
                    "type": "true_false",
                    "question": "Person A recommended a book to person B.",
                    "correct_answer": "true",
                    "points": 2
                },
                {
                    "id": "q5",
                    "type": "fill_blank",
                    "question": "The conversation takes place in the _______.",
                    "correct_answer": "bookstore",
                    "points": 2
                }
            ]
        }
    )
    
    # 2. SPEAKING EXERCISE
    speaking_ex = Exercise(
        class_id=1,
        title="Speaking: Describe Your Hometown",
        description="Nói về quê hương của bạn trong 2-3 phút",
        type="skill_exercise",
        skill_type="speaking",
        max_score=10,
        duration=15,
        due_at=datetime.now() + timedelta(days=7),
        content={
            "prompt": "Describe your hometown. You should say:\n- Where it is located\n- What it looks like\n- What makes it special\n- Why you like or dislike it",
            "instructions": [
                "Bạn có 30 giây để chuẩn bị",
                "Nói trong 2-3 phút",
                "Sử dụng từ vựng đa dạng",
                "Nói rõ ràng và tự nhiên"
            ],
            "prep_time": 30,
            "speaking_time": 180,
            "sample_answer": "I come from Hanoi, the capital city of Vietnam. It's located in the northern part of the country. Hanoi is known for its rich history, beautiful lakes, and delicious street food. What makes it special is the blend of traditional and modern culture. I love living here because of the vibrant atmosphere and friendly people."
        }
    )
    
    # 3. READING EXERCISE  
    reading_ex = Exercise(
        class_id=1,
        title="Reading: The Benefits of Reading",
        description="Đọc đoạn văn và trả lời câu hỏi",
        type="skill_exercise",
        skill_type="reading",
        max_score=10,
        duration=30,
        due_at=datetime.now() + timedelta(days=7),
        content={
            "passage": """Reading is one of the most beneficial activities for both the mind and soul. When we read, we not only gain knowledge but also improve our vocabulary and language skills. Research shows that regular reading can reduce stress levels by up to 68%, which is more effective than listening to music or taking a walk.

Moreover, reading enhances our cognitive abilities. It improves concentration, analytical thinking, and memory. When we read fiction, we develop empathy by understanding characters' emotions and perspectives. This helps us become more compassionate in real life.

Reading before bed is particularly beneficial. It helps calm the mind and prepares the body for sleep. However, experts recommend reading physical books rather than electronic devices, as blue light from screens can interfere with sleep quality.

For children, reading is essential for academic success. Students who read regularly tend to perform better in all subjects, not just language arts. Parents should encourage reading habits from an early age by reading to their children and providing access to diverse books.

In today's digital age, many people have replaced reading with scrolling through social media. However, deep reading of books offers unique benefits that cannot be replicated by quick online browsing. It's important to maintain a healthy balance and dedicate time to reading books.""",
            "word_count": 215,
            "questions": [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "question": "According to the passage, how much can reading reduce stress?",
                    "options": [
                        "A. Up to 50%",
                        "B. Up to 60%",
                        "C. Up to 68%",
                        "D. Up to 80%"
                    ],
                    "correct_answer": "C",
                    "points": 2
                },
                {
                    "id": "q2",
                    "type": "multiple_choice",
                    "question": "Why should we read physical books before bed?",
                    "options": [
                        "A. They are cheaper",
                        "B. They smell better",
                        "C. Blue light from screens affects sleep",
                        "D. They are easier to carry"
                    ],
                    "correct_answer": "C",
                    "points": 2
                },
                {
                    "id": "q3",
                    "type": "short_answer",
                    "question": "What cognitive abilities does reading enhance? (Name at least 2)",
                    "points": 2
                },
                {
                    "id": "q4",
                    "type": "true_false",
                    "question": "Students who read regularly perform better only in language arts.",
                    "correct_answer": "false",
                    "points": 2
                },
                {
                    "id": "q5",
                    "type": "short_answer",
                    "question": "According to the passage, what is the main problem with social media in relation to reading?",
                    "points": 2
                }
            ]
        }
    )
    
    # 4. WRITING EXERCISE
    writing_ex = Exercise(
        class_id=1,
        title="Writing: My Dream Job",
        description="Viết một bài luận về công việc mơ ước của bạn",
        type="skill_exercise",
        skill_type="writing",
        max_score=10,
        duration=45,
        due_at=datetime.now() + timedelta(days=7),
        content={
            "prompt": "Write an essay about your dream job. Explain what it is, why you want to do it, and what you need to do to achieve this goal.",
            "instructions": [
                "Viết ít nhất 250 từ",
                "Sử dụng cấu trúc bài rõ ràng (mở bài, thân bài, kết bài)",
                "Đưa ra ví dụ cụ thể",
                "Kiểm tra lỗi chính tả và ngữ pháp"
            ],
            "word_limit": {
                "min": 250,
                "max": 400
            },
            "sample_essay": """My dream job is to become a software engineer at a leading technology company. Ever since I was young, I have been fascinated by how computers work and how software can solve real-world problems.

I want to pursue this career for several reasons. First, technology is constantly evolving, which means I will always be learning new things and facing new challenges. Second, software engineering offers excellent career prospects and the opportunity to work on innovative projects that can impact millions of people worldwide.

To achieve this goal, I am currently studying computer science at university. I spend time every day practicing coding and working on personal projects. I also participate in hackathons and online coding competitions to improve my skills. Additionally, I am building a portfolio of projects to showcase my abilities to potential employers.

In conclusion, becoming a software engineer is not just a career choice for me; it is my passion. I am committed to working hard and continuously improving myself to make this dream a reality."""
        }
    )
    
    # Add all exercises
    db.add(listening_ex)
    db.add(speaking_ex)
    db.add(reading_ex)
    db.add(writing_ex)
    
    db.commit()
    
    print("✅ Successfully seeded 4 sample exercises:")
    print(f"  - Listening: {listening_ex.id}")
    print(f"  - Speaking: {speaking_ex.id}")
    print(f"  - Reading: {reading_ex.id}")
    print(f"  - Writing: {writing_ex.id}")
    
    db.close()

if __name__ == "__main__":
    seed_sample_exercises()
