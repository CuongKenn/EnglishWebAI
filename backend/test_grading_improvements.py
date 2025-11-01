"""
Test for improved grading logic
Tests new features: normalize matching, fuzzy matching, strip articles, duplicate detection
"""
import asyncio
import sys
import os
from difflib import SequenceMatcher
import string

# Standalone implementations for testing (copied from ai_grading_service.py)

async def grade_matching_test(question: dict, student_answer: dict) -> dict:
    """Grade matching question with normalize"""
    pairs = question.get("pairs", [])
    
    def normalize(text):
        if text is None:
            return ""
        return " ".join(str(text).strip().lower().split())
    
    if not student_answer or not isinstance(student_answer, dict):
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": "Chưa trả lời."
        }
    
    correct_count = 0
    total_pairs = len(pairs)
    
    for idx, pair in enumerate(pairs):
        correct_right = pair['right']
        student_right = student_answer.get(idx)
        
        student_right_norm = normalize(student_right) if student_right else ""
        correct_right_norm = normalize(correct_right)
        is_match = student_right_norm == correct_right_norm
        
        if is_match:
            correct_count += 1
    
    # Validate for duplicate answers
    right_values = [v for v in student_answer.values() if v is not None and str(v).strip() != ""]
    normalized_right_values = [normalize(v) for v in right_values]
    unique_normalized = set(normalized_right_values)
    
    duplicate_warning = ""
    if len(normalized_right_values) != len(unique_normalized):
        duplicate_count = len(normalized_right_values) - len(unique_normalized)
        duplicate_warning = f" ⚠️ Phát hiện {duplicate_count} câu trả lời trùng lặp."
    
    score_percentage = (correct_count / total_pairs * 100) if total_pairs > 0 else 0
    max_points = question.get("points", 0.25)
    points_earned = max_points * (correct_count / total_pairs) if total_pairs > 0 else 0
    
    return {
        "is_correct": correct_count == total_pairs,
        "points_earned": round(points_earned, 2),
        "max_points": max_points,
        "feedback": f"Ghép đúng {correct_count}/{total_pairs} cặp ({score_percentage:.0f}%){duplicate_warning}"
    }


async def grade_fill_blank_test(question: dict, student_answer: str) -> dict:
    """Grade fill blank with fuzzy matching and article stripping"""
    correct_answer = question.get("correct_answer", "")
    
    def _normalize(text: str) -> str:
        if text is None:
            return ""
        return " ".join(str(text).strip().lower().split())
    
    def _normalize_advanced(text: str) -> str:
        if text is None:
            return ""
        text = text.translate(str.maketrans('', '', string.punctuation))
        words = text.lower().split()
        articles = {'a', 'an', 'the'}
        words = [w for w in words if w not in articles]
        return " ".join(words)
    
    def is_fuzzy_match(s1: str, s2: str, threshold: float = 0.9) -> bool:
        if not s1 or not s2:
            return False
        ratio = SequenceMatcher(None, s1, s2).ratio()
        return ratio >= threshold
    
    if student_answer is None or student_answer == "":
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": f"Chưa trả lời. Đáp án đúng: {correct_answer}"
        }
    
    student_norm = _normalize(student_answer)
    correct_norm = _normalize(correct_answer)
    
    is_correct = (student_norm == correct_norm)
    feedback_type = "exact"
    
    # Check multiple acceptable answers
    if not is_correct and ('|' in correct_answer or '/' in correct_answer):
        separators = ['|', '/']
        acceptable_answers = [correct_answer]
        for sep in separators:
            if sep in correct_answer:
                acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                break
        
        for acceptable in acceptable_answers:
            if _normalize(acceptable) == student_norm:
                is_correct = True
                feedback_type = "exact"
                break
    
    # Advanced normalize (strip articles & punctuation)
    if not is_correct:
        student_advanced = _normalize_advanced(student_answer)
        correct_advanced = _normalize_advanced(correct_answer)
        
        if student_advanced == correct_advanced:
            is_correct = True
            feedback_type = "advanced"
        elif '|' in correct_answer or '/' in correct_answer:
            separators = ['|', '/']
            acceptable_answers = [correct_answer]
            for sep in separators:
                if sep in correct_answer:
                    acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                    break
            
            for acceptable in acceptable_answers:
                if _normalize_advanced(acceptable) == student_advanced:
                    is_correct = True
                    feedback_type = "advanced"
                    break
    
    # Fuzzy matching
    if not is_correct:
        if is_fuzzy_match(student_norm, correct_norm, threshold=0.9):
            is_correct = True
            feedback_type = "fuzzy"
        elif '|' in correct_answer or '/' in correct_answer:
            separators = ['|', '/']
            acceptable_answers = [correct_answer]
            for sep in separators:
                if sep in correct_answer:
                    acceptable_answers = [ans.strip() for ans in correct_answer.split(sep)]
                    break
            
            for acceptable in acceptable_answers:
                if is_fuzzy_match(student_norm, _normalize(acceptable), threshold=0.9):
                    is_correct = True
                    feedback_type = "fuzzy"
                    break
    
    max_points = question.get("points", 0.25)
    points_earned = max_points if is_correct else 0
    
    if is_correct:
        if feedback_type == "fuzzy":
            feedback = "Gần đúng! Có thể có lỗi chính tả nhỏ."
        elif feedback_type == "advanced":
            feedback = "Chính xác! (Bỏ qua dấu câu và mạo từ)"
        else:
            feedback = "Chính xác!"
    else:
        feedback = f"Sai. Đáp án đúng: {correct_answer}"
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "max_points": max_points,
        "feedback": feedback
    }


async def run_tests():
    print("="*80)
    print("TEST IMPROVED GRADING LOGIC")
    print("="*80)
    
    all_passed = True
    
    # ========== MATCHING TESTS ==========
    print("\n" + "="*80)
    print("MATCHING TESTS - Normalize (case-insensitive)")
    print("="*80)
    
    # Test 1: Matching with case difference
    print("\n[TEST 1] Matching - Case Insensitive")
    result = await grade_matching_test(
        {
            'id': 1,
            'pairs': [
                {'left': 'Cat', 'right': 'Con mèo'},
                {'left': 'Dog', 'right': 'Con chó'}
            ],
            'points': 2.0
        },
        {0: 'con mèo', 1: 'CON CHÓ'}  # Different cases
    )
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/2.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True and result['points_earned'] == 2.0:
        print("✅ PASSED - Case insensitive works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 2: Matching with extra spaces
    print("\n[TEST 2] Matching - Extra Spaces")
    result = await grade_matching_test(
        {
            'id': 2,
            'pairs': [
                {'left': 'Apple', 'right': 'Quả táo'},
                {'left': 'Banana', 'right': 'Quả chuối'}
            ],
            'points': 1.0
        },
        {0: '  Quả táo  ', 1: 'Quả  chuối'}  # Extra spaces
    )
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True and result['points_earned'] == 1.0:
        print("✅ PASSED - Space normalization works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 3: Matching with duplicate answers (should warn)
    print("\n[TEST 3] Matching - Duplicate Detection")
    result = await grade_matching_test(
        {
            'id': 3,
            'pairs': [
                {'left': 'A', 'right': '1'},
                {'left': 'B', 'right': '2'},
                {'left': 'C', 'right': '3'}
            ],
            'points': 1.5
        },
        {0: '1', 1: '1', 2: '1'}  # All same answer (duplicate)
    )
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.5")
    print(f"Feedback: {result['feedback']}")
    if '⚠️' in result['feedback'] and 'trùng lặp' in result['feedback']:
        print("✅ PASSED - Duplicate warning works!")
    else:
        print("❌ FAILED - No duplicate warning")
        all_passed = False
    
    # ========== FILL BLANK TESTS ==========
    print("\n" + "="*80)
    print("FILL BLANK TESTS - Fuzzy Matching & Articles")
    print("="*80)
    
    # Test 4: Fuzzy matching (1 typo)
    print("\n[TEST 4] Fill Blank - Fuzzy Match (1 typo)")
    result = await grade_fill_blank_test(
        {'id': 4, 'correct_answer': 'restaurant', 'points': 1.0},
        'resturant'  # Missing 'a' (1 typo)
    )
    print(f"Student: 'resturant', Correct: 'restaurant'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True and 'Gần đúng' in result['feedback']:
        print("✅ PASSED - Fuzzy matching works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 5: Fuzzy matching (2 typos)
    print("\n[TEST 5] Fill Blank - Fuzzy Match (2 typos)")
    result = await grade_fill_blank_test(
        {'id': 5, 'correct_answer': 'beautiful', 'points': 1.0},
        'beutiful'  # Missing 'a', swapped 'e' and 'a' (2 typos)
    )
    print(f"Student: 'beutiful', Correct: 'beautiful'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True and 'Gần đúng' in result['feedback']:
        print("✅ PASSED - Fuzzy matching works with 2 typos!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 6: Strip articles
    print("\n[TEST 6] Fill Blank - Strip Articles (a/an/the)")
    result = await grade_fill_blank_test(
        {'id': 6, 'correct_answer': 'dog', 'points': 1.0},
        'a dog'  # Extra article
    )
    print(f"Student: 'a dog', Correct: 'dog'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True:
        print("✅ PASSED - Article stripping works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 7: Strip punctuation
    print("\n[TEST 7] Fill Blank - Strip Punctuation")
    result = await grade_fill_blank_test(
        {'id': 7, 'correct_answer': 'hello', 'points': 1.0},
        'hello.'  # Extra punctuation
    )
    print(f"Student: 'hello.', Correct: 'hello'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True:
        print("✅ PASSED - Punctuation stripping works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 8: Combined - article + punctuation
    print("\n[TEST 8] Fill Blank - Article + Punctuation")
    result = await grade_fill_blank_test(
        {'id': 8, 'correct_answer': 'answer', 'points': 1.0},
        'the answer.'  # Both article and punctuation
    )
    print(f"Student: 'the answer.', Correct: 'answer'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True:
        print("✅ PASSED - Combined normalization works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 9: Fuzzy + multiple acceptable answers
    print("\n[TEST 9] Fill Blank - Fuzzy + Multiple Answers")
    result = await grade_fill_blank_test(
        {'id': 9, 'correct_answer': 'color|colour', 'points': 1.0},
        'colur'  # Typo of 'colour' (missing 'o')
    )
    print(f"Student: 'colur', Correct: 'color|colour'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == True:
        print("✅ PASSED - Fuzzy matching with multiple answers works!")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 10: Too many typos (should fail)
    print("\n[TEST 10] Fill Blank - Too Many Typos (should fail)")
    result = await grade_fill_blank_test(
        {'id': 10, 'correct_answer': 'restaurant', 'points': 1.0},
        'rest'  # Too different (< 90% similarity)
    )
    print(f"Student: 'rest', Correct: 'restaurant'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == False:
        print("✅ PASSED - Correctly rejected (too different)")
    else:
        print("❌ FAILED - Should have rejected")
        all_passed = False
    
    # ========== SUMMARY ==========
    print("\n" + "="*80)
    if all_passed:
        print("✅ ALL TESTS PASSED! 🎉")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*80)
    
    return all_passed


if __name__ == "__main__":
    result = asyncio.run(run_tests())
    sys.exit(0 if result else 1)
