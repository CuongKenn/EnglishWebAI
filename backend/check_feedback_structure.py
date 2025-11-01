from app.core.database import SessionLocal
from app.models.submission import Submission
import json

db = SessionLocal()
sub = db.query(Submission).filter(Submission.id == 11).first()

print("=" * 60)
print("Raw ai_feedback (first 800 chars):")
print("=" * 60)
print(sub.ai_feedback[:800])
print()

print("=" * 60)
print("Trying to parse as JSON...")
print("=" * 60)
try:
    parsed = json.loads(sub.ai_feedback)
    print(f"✅ Parsed successfully!")
    print(f"Type: {type(parsed)}")
    
    if isinstance(parsed, dict):
        print(f"Keys: {list(parsed.keys())}")
        print()
        print("Structure:")
        for key, value in parsed.items():
            print(f"  {key}: {type(value).__name__}")
            if isinstance(value, dict):
                print(f"    -> Sub-keys: {list(value.keys())[:5]}")
except Exception as e:
    print(f"❌ Parse error: {e}")

db.close()
