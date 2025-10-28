"""
Test script to add fake writing assessment data to a submission
"""
from app.core.database import SessionLocal
from app.models.submission import Submission
from sqlalchemy.orm.attributes import flag_modified

def add_fake_writing_assessment():
    db = SessionLocal()
    
    try:
        # Get submission id 1
        submission = db.query(Submission).filter(Submission.id == 1).first()
        
        if not submission:
            print("No submission found with id 1")
            return
        
        # Get current rubrics_scores
        current_rubrics = submission.rubrics_scores or {}
        
        # Add fake writing assessment
        current_rubrics["writing_assessment"] = {
            "content": {"name": "Nội dung", "score": 82, "weight": 0.3},
            "organization": {"name": "Tổ chức", "score": 75, "weight": 0.2},
            "vocabulary": {"name": "Từ vựng", "score": 88, "weight": 0.2},
            "grammar": {"name": "Ngữ pháp", "score": 79, "weight": 0.2},
            "mechanics": {"name": "Kỹ thuật", "score": 85, "weight": 0.1}
        }
        current_rubrics["word_count"] = 245
        current_rubrics["strengths"] = [
            "Sử dụng từ vựng phong phú và chính xác",
            "Cấu trúc câu đa dạng, có sử dụng cả câu đơn và câu phức",
            "Ý tưởng rõ ràng, diễn đạt mạch lạc"
        ]
        current_rubrics["improvements"] = [
            "Cần chú ý hơn về việc liên kết giữa các đoạn văn",
            "Một số lỗi ngữ pháp nhỏ về thì động từ",
            "Nên mở rộng thêm ví dụ cụ thể để minh họa ý tưởng"
        ]
        current_rubrics["corrections"] = [
            "Dòng 3: 'was going' → 'went' (sử dụng quá khứ đơn)",
            "Dòng 8: 'much people' → 'many people' (people là danh từ đếm được)",
            "Dòng 12: thiếu dấu phẩy sau 'However'"
        ]
        current_rubrics["suggestions"] = "Bài viết của bạn khá tốt với từ vựng phong phú. Tuy nhiên, cần chú ý hơn về ngữ pháp và cách liên kết các ý. Hãy thực hành thêm về cách sử dụng linking words (furthermore, moreover, in addition...) để bài viết mạch lạc hơn."
        
        # Update using flag_modified
        submission.rubrics_scores = current_rubrics
        flag_modified(submission, "rubrics_scores")
        
        # Calculate weighted score
        writing_score = (82*0.3 + 75*0.2 + 88*0.2 + 79*0.2 + 85*0.1)
        submission.ai_score = writing_score / 10  # Convert to /10 scale
        
        db.commit()
        
        # Verify
        db.refresh(submission)
        print(f"✅ Added writing assessment to submission {submission.id}")
        print(f"AI Score: {submission.ai_score}/10")
        print(f"Rubrics scores keys: {list(submission.rubrics_scores.keys())}")
        if 'writing_assessment' in submission.rubrics_scores:
            print(f"Writing criteria: {list(submission.rubrics_scores['writing_assessment'].keys())}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_fake_writing_assessment()
