"""
Test script to add fake speaking assessment data to a submission
"""
from app.core.database import SessionLocal
from app.models.submission import Submission
from sqlalchemy import text

def add_fake_speaking_assessment():
    db = SessionLocal()
    
    try:
        # Get first submission
        submission = db.query(Submission).filter(Submission.id == 1).first()
        
        if not submission:
            print("No submission found with id 1")
            return
        
        # Get current rubrics_scores
        current_rubrics = submission.rubrics_scores or {}
        
        # Add fake speaking assessment
        current_rubrics["speaking_assessment"] = {
            "pronunciation": 85.5,
            "fluency": 78.3,
            "completeness": 92.1,
            "accuracy": 88.7
        }
        current_rubrics["recognized_text"] = "Hello, my name is John. I am a student at this school. I like to learn English because it is very interesting and useful for my future career."
        current_rubrics["detailed_feedback"] = "Phát âm: Tốt (85.5/100)\n- Bạn phát âm khá rõ ràng và dễ hiểu\n- Một số âm cuối cần chú ý hơn như /t/, /d/\n\nĐộ trôi chảy: Khá (78.3/100)\n- Tốc độ nói vừa phải\n- Còn một số chỗ ngập ngừng\n\nTính hoàn chỉnh: Rất tốt (92.1/100)\n- Nội dung đầy đủ theo yêu cầu\n- Diễn đạt mạch lạc\n\nĐộ chính xác: Tốt (88.7/100)\n- Ngữ pháp chính xác\n- Từ vựng phù hợp"
        
        # Update using flag_modified for JSON field
        from sqlalchemy.orm.attributes import flag_modified
        submission.rubrics_scores = current_rubrics
        flag_modified(submission, "rubrics_scores")
        
        # Update status to pending_review
        submission.status = "pending_review"
        submission.ai_score = 8.6  # Average of assessment scores
        
        db.commit()
        
        # Verify
        db.refresh(submission)
        print(f"✅ Added speaking assessment to submission {submission.id}")
        print(f"Status: {submission.status}")
        print(f"AI Score: {submission.ai_score}")
        print(f"Rubrics scores keys: {list(submission.rubrics_scores.keys())}")
        if 'speaking_assessment' in submission.rubrics_scores:
            print(f"Speaking scores: {submission.rubrics_scores['speaking_assessment']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_fake_speaking_assessment()
