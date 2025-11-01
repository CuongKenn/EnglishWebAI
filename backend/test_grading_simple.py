"""
Simple test for grading logic without database dependencies
"""
import asyncio


# Copy grading functions here for testing
async def grade_multiple_choice(question: dict, student_answer: str) -> dict:
    """Grade multiple choice question"""
    correct = question.get("correct_answer", "")
    
    # Handle None/empty values
    if student_answer is None or student_answer == "":
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": f"Chưa trả lời. Đáp án đúng là: {correct}"
        }
    
    # Normalize answers for comparison (trim whitespace, collapse spaces, uppercase)
    def normalize(text):
        if text is None:
            return ""
        return " ".join(str(text).strip().upper().split())
    
    student_normalized = normalize(student_answer)
    correct_normalized = normalize(correct)
    
    is_correct = student_normalized == correct_normalized
    points_earned = question.get("points", 0.25) if is_correct else 0
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "max_points": question.get("points", 0.25),
        "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng là: {correct}"
    }


async def grade_fill_blank(question: dict, student_answer: str) -> dict:
    """Grade fill in the blank"""
    correct_answer = question.get("correct_answer", "")

    def _normalize(text: str) -> str:
        if text is None:
            return ""
        return " ".join(str(text).strip().lower().split())

    # Handle None/empty values
    if student_answer is None or student_answer == "":
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": f"Chưa trả lời. Đáp án đúng: {correct_answer}"
        }

    student_norm = _normalize(student_answer)
    correct_norm = _normalize(correct_answer)

    # Check exact match first
    is_correct = (student_norm == correct_norm)
    
    # If not exact match, check if correct_answer contains multiple acceptable answers
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
                break

    max_points = question.get("points", 0.25)
    points_earned = max_points if is_correct else 0

    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "max_points": max_points,
        "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng: {correct_answer}"
    }


async def grade_true_false(question: dict, student_answer: str) -> dict:
    """Grade true/false question"""
    correct = str(question.get("correct_answer", "")).strip().lower()
    
    # Handle None/empty values
    if student_answer is None or student_answer == "":
        true_values = ['true', '1', 'yes', 'đúng', 't', 'y']
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": f"Chưa trả lời. Đáp án đúng: {'Đúng' if correct in true_values else 'Sai'}"
        }
    
    student = str(student_answer).strip().lower()
    
    # Normalize true values
    true_values = ['true', '1', 'yes', 'đúng', 't', 'y']
    false_values = ['false', '0', 'no', 'sai', 'f', 'n']
    
    # Map student answer to true/false
    student_normalized = None
    if student in true_values:
        student_normalized = 'true'
    elif student in false_values:
        student_normalized = 'false'
    else:
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": f"Đáp án không hợp lệ. Đáp án đúng: {'Đúng' if correct in true_values else 'Sai'}"
        }
    
    # Map correct answer to true/false
    correct_normalized = 'true' if correct in true_values else 'false'
    
    is_correct = student_normalized == correct_normalized
    points_earned = question.get("points", 0.25) if is_correct else 0
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "max_points": question.get("points", 0.25),
        "feedback": "Chính xác!" if is_correct else f"Sai. Đáp án đúng: {'Đúng' if correct_normalized == 'true' else 'Sai'}"
    }


async def grade_matching(question: dict, student_answer: dict) -> dict:
    """Grade matching question"""
    correct_pairs = question.get("correct_answer", {})
    
    # Handle None/empty values
    if not student_answer or not isinstance(student_answer, dict):
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": "Chưa trả lời hoặc định dạng không đúng. Ghép đúng 0 cặp."
        }
    
    correct_count = 0
    total_pairs = len(correct_pairs)
    
    if total_pairs == 0:
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": question.get("points", 0.25),
            "feedback": "Câu hỏi không có đáp án đúng"
        }
    
    for left, right in correct_pairs.items():
        student_right = student_answer.get(left)
        student_right_norm = str(student_right).strip() if student_right else ""
        right_norm = str(right).strip() if right else ""
        is_match = student_right_norm == right_norm
        if is_match:
            correct_count += 1
    
    score_percentage = (correct_count / total_pairs * 100) if total_pairs > 0 else 0
    max_points = question.get("points", 0.25)
    points_earned = max_points * (correct_count / total_pairs)
    
    return {
        "is_correct": correct_count == total_pairs,
        "points_earned": round(points_earned, 2),
        "max_points": max_points,
        "feedback": f"Ghép đúng {correct_count}/{total_pairs} cặp ({score_percentage:.0f}%)"
    }


async def run_tests():
    print("="*80)
    print("TEST GRADING LOGIC FIXES")
    print("="*80)
    
    all_passed = True
    
    # Test 1: Multiple Choice with extra spaces
    print("\n[TEST 1] Multiple Choice - Extra Spaces")
    result = await grade_multiple_choice(
        {'id': 1, 'correct_answer': 'A', 'points': 1.0},
        '  A  '
    )
    print(f"Student: '  A  ', Correct: 'A'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    if result['is_correct'] == True:
        print("✅ PASSED")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 2: Multiple Choice - None value
    print("\n[TEST 2] Multiple Choice - None Value")
    result = await grade_multiple_choice(
        {'id': 2, 'correct_answer': 'B', 'points': 1.0},
        None
    )
    print(f"Student: None, Correct: 'B'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    if result['is_correct'] == False and result['points_earned'] == 0:
        print("✅ PASSED")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 3: Fill Blank - Multiple acceptable answers
    print("\n[TEST 3] Fill Blank - Multiple Acceptable Answers (/ separator)")
    result = await grade_fill_blank(
        {'id': 4, 'correct_answer': 'restore/restores', 'points': 1.0},
        'restores'
    )
    print(f"Student: 'restores', Correct: 'restore/restores'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    if result['is_correct'] == True:
        print("✅ PASSED")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 4: Fill Blank - With |
    print("\n[TEST 4] Fill Blank - With | separator")
    result = await grade_fill_blank(
        {'id': 5, 'correct_answer': 'color|colour', 'points': 1.0},
        'colour'
    )
    print(f"Student: 'colour', Correct: 'color|colour'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    if result['is_correct'] == True:
        print("✅ PASSED")
    else:
        print("❌ FAILED")
        all_passed = False
    
    # Test 5: True/False - Various formats
    print("\n[TEST 5] True/False - Various Formats")
    test_cases = [
        ('True', 'true', True),
        ('true', 'true', True),
        ('TRUE', 'true', True),
        ('1', 'true', True),
        ('yes', 'true', True),
        ('False', 'true', False),
        ('false', 'false', True),
        ('0', 'false', True),
        ('no', 'false', True),
    ]
    
    test5_passed = True
    for student, correct, expected in test_cases:
        result = await grade_true_false(
            {'id': 6, 'correct_answer': correct, 'points': 1.0},
            student
        )
        status = "✅" if result['is_correct'] == expected else "❌"
        print(f"  {status} Student: '{student}', Correct: '{correct}' => {result['is_correct']} (expected: {expected})")
        if result['is_correct'] != expected:
            test5_passed = False
            all_passed = False
    
    if test5_passed:
        print("✅ ALL SUB-TESTS PASSED")
    else:
        print("❌ SOME SUB-TESTS FAILED")
    
    # Test 6: Matching - Partial credit
    print("\n[TEST 6] Matching - Partial Credit")
    result = await grade_matching(
        {'id': 7, 'correct_answer': {'A': '1', 'B': '2', 'C': '3', 'D': '4'}, 'points': 2.0},
        {'A': '1', 'B': '2', 'C': 'wrong', 'D': '4'}
    )
    print(f"Correct: 3/4 pairs")
    print(f"Result: Points: {result['points_earned']}/2.0")
    print(f"Feedback: {result['feedback']}")
    expected_points = 1.5
    if result['points_earned'] == expected_points:
        print("✅ PASSED")
    else:
        print(f"❌ FAILED - Expected {expected_points}, got {result['points_earned']}")
        all_passed = False
    
    # Test 7: Matching - None value
    print("\n[TEST 7] Matching - None/Empty Value")
    result = await grade_matching(
        {'id': 8, 'correct_answer': {'A': '1', 'B': '2'}, 'points': 1.0},
        None
    )
    print(f"Student: None")
    print(f"Result: Points: {result['points_earned']}/1.0")
    if result['points_earned'] == 0:
        print("✅ PASSED")
    else:
        print("❌ FAILED")
        all_passed = False
    
    print("\n" + "="*80)
    if all_passed:
        print("✅✅✅ ALL TESTS PASSED! ✅✅✅")
    else:
        print("❌❌❌ SOME TESTS FAILED! ❌❌❌")
    print("="*80)
    
    return all_passed


if __name__ == "__main__":
    import sys
    try:
        result = asyncio.run(run_tests())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
