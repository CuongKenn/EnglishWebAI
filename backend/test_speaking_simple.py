"""
Simple test to verify speaking grading logic and feedback extraction
WITHOUT requiring database connection
"""
import json

def simulate_grading_result():
    """Simulate the result from grade_comprehensive_submission"""
    return {
        "listening": {
            "questions": [
                {
                    "question_id": 1,
                    "question": "What is the main topic?",
                    "student_answer": "A",
                    "correct_answer": "A",
                    "points_earned": 0.5,
                    "max_points": 0.5,
                    "is_correct": True,
                    "feedback": "Correct!"
                },
                {
                    "question_id": 2,
                    "question": "The man went to the ___",
                    "student_answer": "store",
                    "correct_answer": "store",
                    "points_earned": 0.5,
                    "max_points": 0.5,
                    "is_correct": True,
                    "feedback": "Correct!"
                }
            ],
            "total_points": 1.0,
            "max_points": 2.5
        },
        "reading": {
            "questions": [
                {
                    "question_id": 3,
                    "question": "What does the passage suggest?",
                    "student_answer": "B",
                    "correct_answer": "B",
                    "points_earned": 0.5,
                    "max_points": 0.5,
                    "is_correct": True,
                    "feedback": "Correct!"
                }
            ],
            "total_points": 0.5,
            "max_points": 2.5
        },
        "writing": {
            "points_earned": 2.0,
            "max_points": 2.5,
            "feedback": {},
            "overall_comment": "Bài viết của em khá tốt. Em đã trình bày ý tưởng rõ ràng và sử dụng từ vựng phù hợp. Ngữ pháp cơ bản đúng, tuy nhiên cần chú ý thêm về cách sử dụng thì trong một số câu. Cô khuyến khích em tiếp tục luyện tập để phát triển kỹ năng viết của mình.",
            "needs_review": True
        },
        "speaking": {
            "points_earned": 1.8,
            "max_points": 2.5,
            "pronunciation": {
                "pronunciation_score": 72,
                "accuracy_score": 75,
                "fluency_score": 70,
                "completeness_score": 68,
                "recognized_text": "I wake up at seven o'clock every morning. I brush my teeth and eat breakfast. Then I go to school.",
                "success": True
            },
            "content": {
                "content_score": 0.9,
                "content_feedback": "Em đã trả lời câu hỏi một cách rõ ràng và có liên quan đến chủ đề. Nội dung mô tả các hoạt động hàng ngày một cách logic.",
                "grammar_feedback": "Ngữ pháp cơ bản đúng. Em sử dụng thì hiện tại đơn (simple present) phù hợp để mô tả thói quen hàng ngày.",
                "vocabulary_feedback": "Từ vựng đơn giản nhưng phù hợp với trình độ. Em có thể thử thêm các từ nối như 'after that', 'next' để bài nói mạch lạc hơn.",
                "pronunciation_note": "Dựa trên văn bản nhận dạng, phát âm của em khá rõ ràng và dễ hiểu.",
                "strengths": [
                    "Nội dung rõ ràng và có logic",
                    "Sử dụng thì đúng",
                    "Phát âm dễ hiểu"
                ],
                "improvements": [
                    "Thêm chi tiết cụ thể hơn",
                    "Sử dụng từ nối để liên kết ý",
                    "Mở rộng vốn từ vựng"
                ],
                "suggestions": [
                    "Thử mô tả thêm về các hoạt động buổi chiều và tối",
                    "Luyện thêm các từ nối: firstly, secondly, after that, finally"
                ],
                "overall_comment": "Bài nói của em khá tốt với nội dung rõ ràng và ngữ pháp đúng. Cô khuyến khích em tiếp tục luyện tập để phát âm tự nhiên hơn và mở rộng vốn từ vựng. Hãy cố gắng thêm chi tiết để bài nói thêm phần sinh động nhé!"
            },
            "feedback": {
                "pronunciation": "Phát âm: 72/100",
                "content": "Bài nói của em khá tốt với nội dung rõ ràng và ngữ pháp đúng. Cô khuyến khích em tiếp tục luyện tập để phát âm tự nhiên hơn và mở rộng vốn từ vựng. Hãy cố gắng thêm chi tiết để bài nói thêm phần sinh động nhé!"
            },
            "needs_review": True
        },
        "total_score": 5.3,
        "max_score": 10
    }

def extract_feedback(result):
    """
    Extract feedback from grading result - THIS IS WHAT grading_queue_service.py DOES
    """
    feedback_parts = []
    
    # Listening feedback
    if result.get('listening', {}).get('total_points', 0) > 0:
        listening_correct = len([q for q in result['listening']['questions'] if q.get('is_correct', False)])
        listening_total = len(result['listening']['questions'])
        feedback_parts.append(f"🎧 Listening: {listening_correct}/{listening_total} câu đúng - {result['listening']['total_points']:.1f}/2.5đ")
    
    # Reading feedback
    if result.get('reading', {}).get('total_points', 0) > 0:
        reading_correct = len([q for q in result['reading']['questions'] if q.get('is_correct', False)])
        reading_total = len(result['reading']['questions'])
        feedback_parts.append(f"📖 Reading: {reading_correct}/{reading_total} câu đúng - {result['reading']['total_points']:.1f}/2.5đ")
    
    # Writing feedback
    if result.get('writing', {}).get('points_earned', 0) > 0:
        writing_comment = result['writing'].get('overall_comment', '')
        if writing_comment:
            feedback_parts.append(f"✍️ Writing: {result['writing']['points_earned']:.1f}/2.5đ\n{writing_comment[:200]}")
        else:
            feedback_parts.append(f"✍️ Writing: {result['writing']['points_earned']:.1f}/2.5đ")
    
    # Speaking feedback
    if result.get('speaking', {}).get('points_earned', 0) > 0:
        speaking_feedback = result['speaking'].get('feedback', {})
        pronunciation_text = speaking_feedback.get('pronunciation', '')
        content_text = speaking_feedback.get('content', '')
        feedback_parts.append(f"🗣️ Speaking: {result['speaking']['points_earned']:.1f}/2.5đ\n{pronunciation_text}\n{content_text[:200]}")
    
    # Combine all feedback
    if feedback_parts:
        return "\n\n".join(feedback_parts)
    else:
        return f"Tự động chấm: {result['total_score']}/{result['max_score']} điểm"

def test_old_buggy_way(result):
    """OLD BUGGY WAY - This was the problem!"""
    return result.get('feedback', f"Tự động chấm: {result['total_score']}/{result['max_score']} điểm")

def main():
    print("=" * 80)
    print("TESTING SPEAKING GRADING FEEDBACK EXTRACTION")
    print("=" * 80)
    
    # Get simulated grading result
    result = simulate_grading_result()
    
    print("\n📊 Grading Result Structure:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 80)
    print("TEST 1: OLD BUGGY WAY (result.get('feedback'))")
    print("=" * 80)
    
    old_feedback = test_old_buggy_way(result)
    print("\n📝 Old Feedback:")
    print("-" * 80)
    print(old_feedback)
    print("-" * 80)
    
    if old_feedback.startswith('{') or 'listening' in old_feedback and 'questions' in old_feedback:
        print("\n❌ ERROR: This looks like raw JSON or fallback text!")
        print("The 'feedback' key doesn't exist at root level of result.")
    
    print("\n" + "=" * 80)
    print("TEST 2: NEW CORRECT WAY (build from sections)")
    print("=" * 80)
    
    new_feedback = extract_feedback(result)
    print("\n📝 New Feedback:")
    print("-" * 80)
    print(new_feedback)
    print("-" * 80)
    
    if new_feedback.startswith('{'):
        print("\n❌ ERROR: Still looks like raw JSON!")
    else:
        print("\n✅ SUCCESS: Feedback is properly formatted text!")
    
    print("\n" + "=" * 80)
    print("TEST 3: Verify Speaking Feedback Structure")
    print("=" * 80)
    
    speaking_section = result.get('speaking', {})
    print(f"\n🗣️ Speaking Section Keys: {list(speaking_section.keys())}")
    print(f"Points Earned: {speaking_section.get('points_earned', 0)}")
    print(f"Max Points: {speaking_section.get('max_points', 0)}")
    
    feedback_obj = speaking_section.get('feedback', {})
    print(f"\n📋 Feedback Object Type: {type(feedback_obj)}")
    print(f"Feedback Keys: {list(feedback_obj.keys()) if isinstance(feedback_obj, dict) else 'N/A'}")
    
    if isinstance(feedback_obj, dict):
        print(f"\n✅ Pronunciation Text: {feedback_obj.get('pronunciation', 'MISSING')}")
        print(f"✅ Content Text: {feedback_obj.get('content', 'MISSING')[:100]}...")
    else:
        print(f"\n❌ ERROR: feedback is not a dict, it's {type(feedback_obj)}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETED")
    print("=" * 80)
    
    print("\n📊 Summary:")
    print(f"  Total Score: {result['total_score']}/10.0")
    print(f"  Listening: {result['listening']['total_points']}/2.5")
    print(f"  Reading: {result['reading']['total_points']}/2.5")
    print(f"  Writing: {result['writing']['points_earned']}/2.5")
    print(f"  Speaking: {result['speaking']['points_earned']}/2.5")

if __name__ == "__main__":
    main()
