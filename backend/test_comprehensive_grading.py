"""
Test comprehensive test grading with listening_X and reading_X format
"""
import asyncio
import json

# Mock data
exercise_content = {
    "type": "comprehensive_test",
    "listening": {
        "audio_url": "test.mp3",
        "questions": [
            {"id": 1, "type": "multiple_choice", "question": "Q1", "correct_answer": "A", "points": 0.5},
            {"id": 2, "type": "fill_blank", "question": "Q2", "correct_answer": "restore", "points": 0.5},
            {"id": 3, "type": "true_false", "question": "Q3", "correct_answer": "True", "points": 0.5}
        ]
    },
    "reading": {
        "passage": "test passage",
        "questions": [
            {"id": 1, "type": "multiple_choice", "question": "Q1", "correct_answer": "A", "points": 0.5},
            {"id": 2, "type": "fill_blank", "question": "Q2", "correct_answer": "restore", "points": 0.5},
            {"id": 3, "type": "matching", "question": "Q3", "correct_answer": {"0": "pair1", "1": "pair2"}, "points": 0.5}
        ]
    }
}

# Student answers in NEW format (listening_X, reading_X)
student_answers_new = {
    "listening_1": "A",  # Correct
    "listening_2": "restore",  # Correct
    "listening_3": "False",  # Wrong
    "reading_1": "B",  # Wrong
    "reading_2": "restoration",  # Wrong
    "reading_3": {"0": "pair1", "1": "wrong"}  # Partially correct
}

# Student answers in OLD format (just numbers - CONFLICT!)
student_answers_old = {
    "1": "A",  # Which one? Listening or Reading?
    "2": "restore",
    "3": "True"
}

print("=" * 80)
print("TEST: Comprehensive Test Grading - Answer Key Format")
print("=" * 80)

print("\n📋 EXERCISE STRUCTURE:")
print(f"Listening questions: {len(exercise_content['listening']['questions'])}")
for q in exercise_content['listening']['questions']:
    print(f"  - Listening Q{q['id']}: {q['type']}, correct={q['correct_answer']}")

print(f"\nReading questions: {len(exercise_content['reading']['questions'])}")
for q in exercise_content['reading']['questions']:
    print(f"  - Reading Q{q['id']}: {q['type']}, correct={q['correct_answer']}")

print("\n" + "=" * 80)
print("SCENARIO 1: NEW FORMAT (listening_X, reading_X) - ✅ NO CONFLICT")
print("=" * 80)
print(json.dumps(student_answers_new, indent=2))

# Simulate grading logic
print("\n📊 Grading Listening:")
for q in exercise_content['listening']['questions']:
    q_id = q['id']
    # Try multiple formats
    student_ans = (
        student_answers_new.get(f"listening_{q_id}", "") or 
        student_answers_new.get(str(q_id), "") or 
        student_answers_new.get(q_id, "")
    )
    correct = q['correct_answer']
    is_correct = str(student_ans).strip().upper() == str(correct).strip().upper()
    status = "✅" if is_correct else "❌"
    print(f"  Q{q_id}: student='{student_ans}' vs correct='{correct}' → {status}")

print("\n📊 Grading Reading:")
for q in exercise_content['reading']['questions']:
    q_id = q['id']
    # Try multiple formats
    student_ans = (
        student_answers_new.get(f"reading_{q_id}", "") or 
        student_answers_new.get(str(q_id), "") or 
        student_answers_new.get(q_id, "")
    )
    correct = q['correct_answer']
    
    if isinstance(correct, dict):
        print(f"  Q{q_id}: matching type - student={student_ans}")
    else:
        is_correct = str(student_ans).strip().upper() == str(correct).strip().upper()
        status = "✅" if is_correct else "❌"
        print(f"  Q{q_id}: student='{student_ans}' vs correct='{correct}' → {status}")

print("\n" + "=" * 80)
print("SCENARIO 2: OLD FORMAT (just numbers) - ❌ CONFLICT!")
print("=" * 80)
print(json.dumps(student_answers_old, indent=2))

print("\n⚠️  PROBLEM: Both Listening Q1 and Reading Q1 try to access key '1'")
print("  → Only ONE answer stored!")
print("  → Last write wins (data loss)")

print("\n📊 Grading Listening (with OLD format):")
for q in exercise_content['listening']['questions']:
    q_id = q['id']
    student_ans = student_answers_old.get(str(q_id), "")
    correct = q['correct_answer']
    is_correct = str(student_ans).strip().upper() == str(correct).strip().upper()
    status = "✅" if is_correct else "❌"
    print(f"  Q{q_id}: student='{student_ans}' vs correct='{correct}' → {status}")
    if q_id == 1:
        print(f"       ^ Is this Listening Q1 or Reading Q1 answer? ⚠️")

print("\n📊 Grading Reading (with OLD format):")
for q in exercise_content['reading']['questions']:
    q_id = q['id']
    student_ans = student_answers_old.get(str(q_id), "")
    correct = q['correct_answer']
    
    if isinstance(correct, dict):
        print(f"  Q{q_id}: matching type")
    else:
        is_correct = str(student_ans).strip().upper() == str(correct).strip().upper()
        status = "✅" if is_correct else "❌"
        print(f"  Q{q_id}: student='{student_ans}' vs correct='{correct}' → {status}")
        if q_id == 1:
            print(f"       ^ Uses SAME key '1' as Listening Q1! ⚠️")

print("\n" + "=" * 80)
print("✅ CONCLUSION:")
print("=" * 80)
print("NEW FORMAT solves the conflict by using prefixed keys:")
print("  - listening_1, listening_2, listening_3")
print("  - reading_1, reading_2, reading_3")
print("\nBackend grading logic updated to support:")
print("  1. Try f'listening_{q_id}' first")
print("  2. Fallback to str(q_id)")
print("  3. Fallback to int(q_id)")
print("\n✅ This ensures backward compatibility while fixing the conflict!")
