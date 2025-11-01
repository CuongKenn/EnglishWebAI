"""
Simple standalone test for True/False grading logic
No database or dependencies required
"""


def grade_true_false_logic(correct_answer, student_answer, points=0.5):
    """
    Replicate the exact logic from ai_grading_service.grade_true_false
    """
    print(f"\n{'='*60}")
    print(f"Testing: Student='{student_answer}' vs Correct='{correct_answer}'")
    print(f"{'='*60}")
    
    # Convert to string and normalize (exact logic from service)
    correct_raw = correct_answer
    student_raw = student_answer
    
    print(f"RAW - Correct: '{correct_raw}' (type: {type(correct_raw).__name__})")
    print(f"RAW - Student: '{student_raw}' (type: {type(student_raw).__name__})")
    
    correct = str(correct_raw).strip().lower()
    print(f"NORMALIZED - Correct: '{correct}'")
    
    # Handle None/empty
    if student_answer is None or student_answer == "":
        print(f"Result: EMPTY/NONE - 0 points")
        return {"is_correct": False, "points": 0, "reason": "Empty answer"}
    
    student = str(student_raw).strip().lower()
    print(f"NORMALIZED - Student: '{student}'")
    
    # Normalize values
    true_values = ['true', '1', 'yes', 'đúng', 't', 'y']
    false_values = ['false', '0', 'no', 'sai', 'f', 'n']
    
    # Map student answer
    if student in true_values:
        student_normalized = 'true'
    elif student in false_values:
        student_normalized = 'false'
    else:
        print(f"Result: INVALID - 0 points (not in accepted values)")
        return {"is_correct": False, "points": 0, "reason": "Invalid answer"}
    
    # Map correct answer
    correct_normalized = 'true' if correct in true_values else 'false'
    
    print(f"MAPPED - Student: '{student_normalized}' vs Correct: '{correct_normalized}'")
    
    is_correct = student_normalized == correct_normalized
    points_earned = points if is_correct else 0
    
    print(f"Result: {'✅ CORRECT' if is_correct else '❌ WRONG'} - {points_earned}/{points} points")
    
    return {
        "is_correct": is_correct,
        "points": points_earned,
        "max_points": points
    }


def main():
    print("\n" + "="*80)
    print("TRUE/FALSE GRADING LOGIC TEST")
    print("="*80)
    
    test_cases = [
        # (correct_answer, student_answer, expected_correct, description)
        ("false", "false", True, "Exact match lowercase"),
        ("false", "False", True, "Student capital F"),
        ("false", "FALSE", True, "Student all caps"),
        ("False", "false", True, "Correct capital F"),
        ("False", "False", True, "Both capital F"),
        (False, False, True, "Both boolean False"),
        (False, "False", True, "Boolean correct vs string student"),
        ("false", False, True, "String correct vs boolean student"),
        ("false", "0", True, "Numeric 0 = false"),
        ("false", "sai", True, "Vietnamese 'sai'"),
        ("false", "f", True, "Single letter 'f'"),
        ("false", "no", True, "'no' = false"),
        ("true", "true", True, "True exact match"),
        ("true", "True", True, "True with capital"),
        ("true", "1", True, "Numeric 1 = true"),
        ("true", "yes", True, "'yes' = true"),
        ("true", "đúng", True, "Vietnamese 'đúng'"),
        ("false", "true", False, "Wrong: answered true"),
        ("true", "false", False, "Wrong: answered false"),
        ("true", "", False, "Empty answer"),
        ("true", None, False, "None answer"),
        ("true", "maybe", False, "Invalid answer"),
        ("  false  ", "  False  ", True, "Whitespace handling"),
    ]
    
    passed = 0
    failed = 0
    
    for correct, student, expected, desc in test_cases:
        result = grade_true_false_logic(correct, student)
        
        if result["is_correct"] == expected:
            print(f"✅ PASS: {desc}")
            passed += 1
        else:
            print(f"❌ FAIL: {desc}")
            print(f"   Expected: {expected}, Got: {result['is_correct']}")
            failed += 1
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total: {len(test_cases)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {passed/len(test_cases)*100:.1f}%")
    
    # Specific test case from user
    print("\n" + "="*80)
    print("USER'S SPECIFIC CASE (Câu 4)")
    print("="*80)
    result = grade_true_false_logic("false", "False", 0.50)
    
    if result["is_correct"] and result["points"] == 0.50:
        print("✅ USER'S CASE PASSED!")
    else:
        print("❌ USER'S CASE FAILED!")
    
    print("="*80 + "\n")
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
