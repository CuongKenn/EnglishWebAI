"""
Test script to verify grading logic improvements
"""
import asyncio
import sys
from app.services.ai_grading_service import AIGradingService

async def test_grading_logic():
    service = AIGradingService()
    
    print("="*80)
    print("TEST GRADING LOGIC FIXES")
    print("="*80)
    
    # Test 1: Multiple Choice with extra spaces
    print("\n[TEST 1] Multiple Choice - Extra Spaces")
    result = await service.grade_multiple_choice(
        {'id': 1, 'correct_answer': 'A', 'points': 1.0},
        '  A  '  # Extra spaces
    )
    print(f"Student: '  A  ', Correct: 'A'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    assert result['is_correct'] == True, "Should be correct!"
    print("✅ PASSED")
    
    # Test 2: Multiple Choice - None value
    print("\n[TEST 2] Multiple Choice - None Value")
    result = await service.grade_multiple_choice(
        {'id': 2, 'correct_answer': 'B', 'points': 1.0},
        None
    )
    print(f"Student: None, Correct: 'B'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    print(f"Feedback: {result['feedback']}")
    assert result['is_correct'] == False, "Should be incorrect!"
    assert result['points_earned'] == 0, "Should get 0 points!"
    print("✅ PASSED")
    
    # Test 3: Multiple Choice - Empty string
    print("\n[TEST 3] Multiple Choice - Empty String")
    result = await service.grade_multiple_choice(
        {'id': 3, 'correct_answer': 'C', 'points': 1.0},
        ''
    )
    print(f"Student: '', Correct: 'C'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    assert result['is_correct'] == False, "Should be incorrect!"
    print("✅ PASSED")
    
    # Test 4: Fill Blank - Multiple acceptable answers
    print("\n[TEST 4] Fill Blank - Multiple Acceptable Answers")
    result = await service.grade_fill_blank(
        {'id': 4, 'correct_answer': 'restore/restores', 'points': 1.0},
        'restores'
    )
    print(f"Student: 'restores', Correct: 'restore/restores'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    assert result['is_correct'] == True, "Should accept alternative answer!"
    print("✅ PASSED")
    
    # Test 5: Fill Blank - With |
    print("\n[TEST 5] Fill Blank - With | separator")
    result = await service.grade_fill_blank(
        {'id': 5, 'correct_answer': 'color|colour', 'points': 1.0},
        'colour'
    )
    print(f"Student: 'colour', Correct: 'color|colour'")
    print(f"Result: {result['is_correct']} - Points: {result['points_earned']}/1.0")
    assert result['is_correct'] == True, "Should accept UK spelling!"
    print("✅ PASSED")
    
    # Test 6: True/False - Various formats
    print("\n[TEST 6] True/False - Various Formats")
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
    
    for student, correct, expected in test_cases:
        result = await service.grade_true_false(
            {'id': 6, 'correct_answer': correct, 'points': 1.0},
            student
        )
        print(f"  Student: '{student}', Correct: '{correct}' => {result['is_correct']}")
        assert result['is_correct'] == expected, f"Failed for {student} vs {correct}"
    print("✅ ALL PASSED")
    
    # Test 7: Matching - Partial credit
    print("\n[TEST 7] Matching - Partial Credit")
    result = await service.grade_matching(
        {'id': 7, 'correct_answer': {'A': '1', 'B': '2', 'C': '3', 'D': '4'}, 'points': 2.0},
        {'A': '1', 'B': '2', 'C': 'wrong', 'D': '4'}  # 3/4 correct
    )
    print(f"Correct: 3/4 pairs")
    print(f"Result: Points: {result['points_earned']}/2.0")
    print(f"Feedback: {result['feedback']}")
    expected_points = 2.0 * (3/4)  # Should be 1.5
    assert result['points_earned'] == round(expected_points, 2), f"Should get {expected_points} points!"
    print("✅ PASSED")
    
    # Test 8: Matching - None value
    print("\n[TEST 8] Matching - None/Empty Value")
    result = await service.grade_matching(
        {'id': 8, 'correct_answer': {'A': '1', 'B': '2'}, 'points': 1.0},
        None
    )
    print(f"Student: None")
    print(f"Result: Points: {result['points_earned']}/1.0")
    assert result['points_earned'] == 0, "Should get 0 points!"
    print("✅ PASSED")
    
    print("\n" + "="*80)
    print("✅ ALL TESTS PASSED!")
    print("="*80)

if __name__ == "__main__":
    try:
        asyncio.run(test_grading_logic())
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
