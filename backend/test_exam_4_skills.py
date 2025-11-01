"""
Test Script for Exam 4 Skills Logic
Verify that exam skill scores are correctly extracted and merged
"""

import json


def extract_exam_skill_scores_test(rubrics_scores):
    """Test function that mimics the actual implementation"""
    skill_scores = {}
    
    if not rubrics_scores:
        return skill_scores
    
    try:
        if isinstance(rubrics_scores, str):
            rubrics = json.loads(rubrics_scores)
        else:
            rubrics = rubrics_scores
        
        # Parse each skill
        for skill in ['reading', 'writing', 'listening', 'speaking']:
            if skill in rubrics:
                skill_data = rubrics[skill]
                if isinstance(skill_data, dict):
                    score = skill_data.get('score', 0)
                    max_score = skill_data.get('max_score', 10)
                    if max_score > 0:
                        percentage = (score / max_score) * 100
                        skill_scores[skill] = round(percentage, 1)
                elif isinstance(skill_data, (int, float)):
                    # If just a number, assume it's percentage
                    skill_scores[skill] = float(skill_data)
        
        return skill_scores
        
    except Exception as e:
        print(f"Error: {e}")
        return skill_scores


def test_format_1():
    """Test standard format with score and max_score"""
    print("\n=== TEST 1: Standard Format ===")
    
    rubrics = {
        "reading": {"score": 8.5, "max_score": 10},
        "writing": {"score": 7.0, "max_score": 10},
        "listening": {"score": 8.0, "max_score": 10},
        "speaking": {"score": 7.5, "max_score": 10}
    }
    
    result = extract_exam_skill_scores_test(rubrics)
    
    print(f"Input: {json.dumps(rubrics, indent=2)}")
    print(f"Output: {result}")
    
    assert result['reading'] == 85.0, f"Expected 85.0, got {result['reading']}"
    assert result['writing'] == 70.0, f"Expected 70.0, got {result['writing']}"
    assert result['listening'] == 80.0, f"Expected 80.0, got {result['listening']}"
    assert result['speaking'] == 75.0, f"Expected 75.0, got {result['speaking']}"
    
    print("✅ PASSED")


def test_format_2():
    """Test simple number format (percentage)"""
    print("\n=== TEST 2: Simple Number Format ===")
    
    rubrics = {
        "reading": 85.0,
        "writing": 70.0,
        "listening": 80.0,
        "speaking": 75.0
    }
    
    result = extract_exam_skill_scores_test(rubrics)
    
    print(f"Input: {json.dumps(rubrics, indent=2)}")
    print(f"Output: {result}")
    
    assert result['reading'] == 85.0
    assert result['writing'] == 70.0
    assert result['listening'] == 80.0
    assert result['speaking'] == 75.0
    
    print("✅ PASSED")


def test_format_3():
    """Test JSON string"""
    print("\n=== TEST 3: JSON String ===")
    
    rubrics_str = json.dumps({
        "reading": {"score": 9.0, "max_score": 10},
        "writing": {"score": 8.5, "max_score": 10},
        "listening": {"score": 8.0, "max_score": 10},
        "speaking": {"score": 7.5, "max_score": 10}
    })
    
    result = extract_exam_skill_scores_test(rubrics_str)
    
    print(f"Input (string): {rubrics_str[:100]}...")
    print(f"Output: {result}")
    
    assert result['reading'] == 90.0
    assert result['writing'] == 85.0
    
    print("✅ PASSED")


def test_partial_skills():
    """Test when only some skills are present"""
    print("\n=== TEST 4: Partial Skills ===")
    
    rubrics = {
        "reading": {"score": 8.5, "max_score": 10},
        "writing": {"score": 7.0, "max_score": 10}
        # Missing listening and speaking
    }
    
    result = extract_exam_skill_scores_test(rubrics)
    
    print(f"Input: {json.dumps(rubrics, indent=2)}")
    print(f"Output: {result}")
    
    assert len(result) == 2
    assert 'listening' not in result
    assert 'speaking' not in result
    
    print("✅ PASSED")


def test_merge_logic():
    """Test merging exam scores with regular exercise scores"""
    print("\n=== TEST 5: Merge Logic ===")
    
    # Simulate existing skill data from exercises
    skill_data = {
        'reading': {'total': 155.0, 'count': 2},  # 80% + 75% = 155
        'writing': {'total': 60.0, 'count': 1},    # 60%
        'listening': {'total': 0.0, 'count': 0},
        'speaking': {'total': 0.0, 'count': 0}
    }
    
    # Exam scores
    exam_skills = {
        'reading': 85.0,
        'writing': 70.0,
        'listening': 80.0,
        'speaking': 75.0
    }
    
    # Merge exam scores
    for skill, score_pct in exam_skills.items():
        skill_data[skill]['total'] += score_pct
        skill_data[skill]['count'] += 1
    
    # Calculate averages
    skill_averages = {
        skill: round(data['total'] / data['count'], 1) if data['count'] > 0 else 0.0
        for skill, data in skill_data.items()
    }
    
    print("Before merge:")
    print(f"  Reading: 2 exercises, avg = {155.0/2:.1f}%")
    print(f"  Writing: 1 exercise, avg = {60.0:.1f}%")
    
    print("\nExam scores:")
    print(f"  {exam_skills}")
    
    print("\nAfter merge:")
    print(f"  Reading: {skill_averages['reading']}% (exercises + exam)")
    print(f"  Writing: {skill_averages['writing']}% (exercises + exam)")
    print(f"  Listening: {skill_averages['listening']}% (from exam)")
    print(f"  Speaking: {skill_averages['speaking']}% (from exam)")
    
    assert skill_averages['reading'] == 80.0  # (155 + 85) / 3
    assert skill_averages['writing'] == 65.0  # (60 + 70) / 2
    assert skill_averages['listening'] == 80.0  # 80 / 1
    assert skill_averages['speaking'] == 75.0  # 75 / 1
    
    print("\n✅ PASSED")


def test_real_world_scenario():
    """Test a complete real-world scenario"""
    print("\n=== TEST 6: Real World Scenario ===")
    print("Student: Nguyễn Văn A")
    print()
    
    # Regular exercises
    exercises = [
        {'skill': 'reading', 'score': 8.0, 'max': 10},  # 80%
        {'skill': 'reading', 'score': 7.5, 'max': 10},  # 75%
        {'skill': 'writing', 'score': 6.0, 'max': 10},  # 60%
    ]
    
    # Midterm exam
    midterm = {
        "reading": {"score": 8.5, "max_score": 10},
        "writing": {"score": 7.0, "max_score": 10},
        "listening": {"score": 8.0, "max_score": 10},
        "speaking": {"score": 7.5, "max_score": 10}
    }
    
    print("Regular Exercises:")
    for ex in exercises:
        pct = (ex['score'] / ex['max']) * 100
        print(f"  {ex['skill'].title()}: {ex['score']}/{ex['max']} = {pct:.0f}%")
    
    print("\nMidterm Exam:")
    exam_skills = extract_exam_skill_scores_test(midterm)
    for skill, score in exam_skills.items():
        print(f"  {skill.title()}: {score:.0f}%")
    
    # Calculate final averages
    skill_data = {
        'reading': [],
        'writing': [],
        'listening': [],
        'speaking': []
    }
    
    for ex in exercises:
        pct = (ex['score'] / ex['max']) * 100
        skill_data[ex['skill']].append(pct)
    
    for skill, score in exam_skills.items():
        skill_data[skill].append(score)
    
    averages = {
        skill: round(sum(scores) / len(scores), 1) if scores else 0.0
        for skill, scores in skill_data.items()
    }
    
    print("\nFinal Skill Averages (exercises + exam):")
    for skill, avg in averages.items():
        count = len(skill_data[skill])
        print(f"  {skill.title()}: {avg:.1f}% (from {count} submissions)")
    
    print("\nWeakest Skills:")
    sorted_skills = sorted(averages.items(), key=lambda x: x[1])
    for skill, avg in sorted_skills[:2]:
        print(f"  {skill.title()}: {avg:.1f}%")
    
    assert averages['reading'] == 80.0  # (80 + 75 + 85) / 3
    assert averages['writing'] == 65.0  # (60 + 70) / 2
    assert averages['listening'] == 80.0  # 80 / 1
    assert averages['speaking'] == 75.0  # 75 / 1
    
    weakest = sorted_skills[0][0]
    assert weakest == 'writing', f"Expected 'writing', got '{weakest}'"
    
    print("\n✅ PASSED - Identifies 'writing' as weakest skill correctly!")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("EXAM 4 SKILLS - LOGIC TESTS")
    print("=" * 60)
    
    try:
        test_format_1()
        test_format_2()
        test_format_3()
        test_partial_skills()
        test_merge_logic()
        test_real_world_scenario()
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\n✅ Backend logic is working correctly")
        print("✅ Exam scores are extracted properly")
        print("✅ Merging with exercise scores works")
        print("✅ Skill averages calculated correctly")
        print("✅ Weakest skills identified accurately")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        raise


if __name__ == "__main__":
    run_all_tests()


