"""
Test script for True/False grading logic
Tests various input formats and edge cases
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ai_grading_service import AIGradingService


async def test_true_false():
    """Test true/false grading with various formats"""
    
    ai_service = AIGradingService()
    
    print("=" * 80)
    print("TRUE/FALSE GRADING TEST SUITE")
    print("=" * 80)
    
    test_cases = [
        # Format: (question, student_answer, expected_correct, description)
        
        # Test 1: Exact lowercase match
        (
            {"id": 1, "correct_answer": "false", "points": 0.5},
            "false",
            True,
            "Exact lowercase 'false' match"
        ),
        
        # Test 2: Capital F in student answer
        (
            {"id": 2, "correct_answer": "false", "points": 0.5},
            "False",
            True,
            "Capital F: 'False' vs 'false'"
        ),
        
        # Test 3: All caps student answer
        (
            {"id": 3, "correct_answer": "false", "points": 0.5},
            "FALSE",
            True,
            "All caps: 'FALSE' vs 'false'"
        ),
        
        # Test 4: Numeric format (0 = false)
        (
            {"id": 4, "correct_answer": "false", "points": 0.5},
            "0",
            True,
            "Numeric: '0' vs 'false'"
        ),
        
        # Test 5: Vietnamese 'sai' = false
        (
            {"id": 5, "correct_answer": "false", "points": 0.5},
            "sai",
            True,
            "Vietnamese: 'sai' vs 'false'"
        ),
        
        # Test 6: Single letter 'f' = false
        (
            {"id": 6, "correct_answer": "false", "points": 0.5},
            "f",
            True,
            "Single letter: 'f' vs 'false'"
        ),
        
        # Test 7: Boolean object (Python False)
        (
            {"id": 7, "correct_answer": "false", "points": 0.5},
            False,
            True,
            "Boolean object: False vs 'false'"
        ),
        
        # Test 8: Correct answer with capital F
        (
            {"id": 8, "correct_answer": "False", "points": 0.5},
            "false",
            True,
            "Correct answer capital: 'False' vs 'false'"
        ),
        
        # Test 9: Both boolean False
        (
            {"id": 9, "correct_answer": False, "points": 0.5},
            False,
            True,
            "Both boolean: False vs False"
        ),
        
        # Test 10: True variants
        (
            {"id": 10, "correct_answer": "true", "points": 0.5},
            "True",
            True,
            "True variants: 'True' vs 'true'"
        ),
        
        # Test 11: Numeric true (1)
        (
            {"id": 11, "correct_answer": "true", "points": 0.5},
            "1",
            True,
            "Numeric true: '1' vs 'true'"
        ),
        
        # Test 12: Vietnamese 'đúng' = true
        (
            {"id": 12, "correct_answer": "true", "points": 0.5},
            "đúng",
            True,
            "Vietnamese true: 'đúng' vs 'true'"
        ),
        
        # Test 13: Wrong answer (true vs false)
        (
            {"id": 13, "correct_answer": "false", "points": 0.5},
            "true",
            False,
            "Wrong answer: 'true' vs 'false'"
        ),
        
        # Test 14: Wrong answer (false vs true)
        (
            {"id": 14, "correct_answer": "true", "points": 0.5},
            "false",
            False,
            "Wrong answer: 'false' vs 'true'"
        ),
        
        # Test 15: Empty student answer
        (
            {"id": 15, "correct_answer": "true", "points": 0.5},
            "",
            False,
            "Empty student answer"
        ),
        
        # Test 16: None student answer
        (
            {"id": 16, "correct_answer": "true", "points": 0.5},
            None,
            False,
            "None student answer"
        ),
        
        # Test 17: Invalid student answer
        (
            {"id": 17, "correct_answer": "true", "points": 0.5},
            "maybe",
            False,
            "Invalid answer: 'maybe'"
        ),
        
        # Test 18: Whitespace handling
        (
            {"id": 18, "correct_answer": "  false  ", "points": 0.5},
            "  False  ",
            True,
            "Whitespace: '  False  ' vs '  false  '"
        ),
        
        # Test 19: Yes/No format
        (
            {"id": 19, "correct_answer": "true", "points": 0.5},
            "yes",
            True,
            "Yes/No: 'yes' vs 'true'"
        ),
        
        # Test 20: No format
        (
            {"id": 20, "correct_answer": "false", "points": 0.5},
            "no",
            True,
            "Yes/No: 'no' vs 'false'"
        ),
    ]
    
    passed = 0
    failed = 0
    
    for i, (question, student_answer, expected_correct, description) in enumerate(test_cases, 1):
        print(f"\n{'─' * 80}")
        print(f"Test Case {i}: {description}")
        print(f"{'─' * 80}")
        
        try:
            result = await ai_service.grade_true_false(question, student_answer)
            
            is_correct = result["is_correct"]
            points_earned = result["points_earned"]
            max_points = result["max_points"]
            
            # Check if result matches expectation
            if is_correct == expected_correct:
                status = "✅ PASS"
                passed += 1
            else:
                status = "❌ FAIL"
                failed += 1
            
            print(f"Status: {status}")
            print(f"Expected: {expected_correct}, Got: {is_correct}")
            print(f"Points: {points_earned}/{max_points}")
            print(f"Feedback: {result['feedback']}")
            
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")
            failed += 1
    
    # Summary
    print(f"\n{'=' * 80}")
    print("TEST SUMMARY")
    print(f"{'=' * 80}")
    print(f"Total Tests: {len(test_cases)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {passed/len(test_cases)*100:.1f}%")
    print(f"{'=' * 80}\n")
    
    return failed == 0


async def test_specific_case():
    """Test the specific case from user's screenshot"""
    
    ai_service = AIGradingService()
    
    print("\n" + "=" * 80)
    print("SPECIFIC TEST: User's Screenshot Case")
    print("=" * 80)
    print("Câu 4: Student answered 'False', Correct answer 'false'")
    print("Expected: Should be CORRECT (0.50/0.50 points)")
    print("=" * 80 + "\n")
    
    question = {
        "id": 4,
        "correct_answer": "false",
        "points": 0.50
    }
    
    student_answer = "False"
    
    result = await ai_service.grade_true_false(question, student_answer)
    
    print(f"\nResult:")
    print(f"  Is Correct: {result['is_correct']}")
    print(f"  Points Earned: {result['points_earned']}")
    print(f"  Max Points: {result['max_points']}")
    print(f"  Feedback: {result['feedback']}")
    
    if result['is_correct'] and result['points_earned'] == 0.50:
        print(f"\n✅ TEST PASSED: Grading works correctly!")
    else:
        print(f"\n❌ TEST FAILED: Should be correct with 0.50 points!")
    
    print("=" * 80 + "\n")


async def main():
    """Run all tests"""
    
    # Test specific case first
    await test_specific_case()
    
    # Then run full test suite
    success = await test_true_false()
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
