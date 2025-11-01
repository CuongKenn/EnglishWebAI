"""
Test improved speaking scoring algorithm
Compare old vs new scoring methods
"""

def test_old_scoring(pronunciation_score, content_score):
    """OLD METHOD: Simple 50-50 split"""
    pronunciation_component = pronunciation_score / 100 * 1.25
    total = pronunciation_component + content_score
    return min(total, 2.5)

def test_new_scoring(pronunciation_score, fluency_score, completeness_score, accuracy_score, content_score):
    """NEW METHOD: Multi-component weighted scoring"""
    
    # Pronunciation component (30% of total = 0.75/2.5 points)
    pronunciation_component = (
        pronunciation_score * 0.5 +
        fluency_score * 0.3 +
        accuracy_score * 0.2
    ) / 100 * 0.75
    
    # Content component (50% of total = 1.25/2.5 points)
    # Content score is already scaled (e.g., 0.9 out of 2.5)
    content_component = content_score * 0.5
    
    # Completeness component (20% of total = 0.5/2.5 points)
    completeness_component = completeness_score / 100 * 0.5
    
    total = pronunciation_component + content_component + completeness_component
    
    return {
        "total": round(min(total, 2.5), 2),
        "pronunciation_component": round(pronunciation_component, 2),
        "content_component": round(content_component, 2),
        "completeness_component": round(completeness_component, 2)
    }

def main():
    print("=" * 80)
    print("SPEAKING SCORING COMPARISON - Old vs New Algorithm")
    print("=" * 80)
    
    # Test scenarios
    scenarios = [
        {
            "name": "Học sinh giỏi - Phát âm tốt, nội dung xuất sắc",
            "pronunciation": 85,
            "fluency": 88,
            "completeness": 90,
            "accuracy": 92,
            "content": 2.2  # ChatGPT gave 2.2/2.5
        },
        {
            "name": "Học sinh khá - Phát âm ổn, nội dung tốt",
            "pronunciation": 72,
            "fluency": 70,
            "completeness": 75,
            "accuracy": 78,
            "content": 1.8
        },
        {
            "name": "Học sinh trung bình - Phát âm yếu, nội dung đủ",
            "pronunciation": 60,
            "fluency": 55,
            "completeness": 65,
            "accuracy": 62,
            "content": 1.5
        },
        {
            "name": "Học sinh yếu - Phát âm kém, nội dung thiếu",
            "pronunciation": 45,
            "fluency": 40,
            "completeness": 50,
            "accuracy": 48,
            "content": 1.0
        },
        {
            "name": "Phát âm tốt nhưng nội dung sai chủ đề",
            "pronunciation": 80,
            "fluency": 78,
            "completeness": 85,
            "accuracy": 82,
            "content": 0.8  # Off-topic
        },
        {
            "name": "Nội dung hay nhưng phát âm kém",
            "pronunciation": 50,
            "fluency": 48,
            "completeness": 70,
            "accuracy": 55,
            "content": 2.0
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'=' * 80}")
        print(f"Scenario {i}: {scenario['name']}")
        print(f"{'=' * 80}")
        
        print("\n📊 Input Scores:")
        print(f"  Pronunciation (Azure): {scenario['pronunciation']}/100")
        print(f"  Fluency (Azure):       {scenario['fluency']}/100")
        print(f"  Completeness (Azure):  {scenario['completeness']}/100")
        print(f"  Accuracy (Azure):      {scenario['accuracy']}/100")
        print(f"  Content (ChatGPT):     {scenario['content']}/2.5")
        
        # Calculate old method
        old_score = test_old_scoring(scenario['pronunciation'], scenario['content'])
        
        # Calculate new method
        new_result = test_new_scoring(
            scenario['pronunciation'],
            scenario['fluency'],
            scenario['completeness'],
            scenario['accuracy'],
            scenario['content']
        )
        
        print("\n📈 OLD METHOD (50% pronunciation, 50% content):")
        print(f"  Pronunciation: {scenario['pronunciation']}/100 → {scenario['pronunciation']/100*1.25:.2f}/1.25")
        print(f"  Content:       {scenario['content']}/2.5")
        print(f"  ➡️  Total Score: {old_score:.2f}/2.5")
        
        print("\n📈 NEW METHOD (30% pronunciation, 50% content, 20% completeness):")
        print(f"  Pronunciation component: {new_result['pronunciation_component']:.2f}/0.75")
        print(f"    (combines: pronunciation {scenario['pronunciation']}, fluency {scenario['fluency']}, accuracy {scenario['accuracy']})")
        print(f"  Content component:       {new_result['content_component']:.2f}/1.25")
        print(f"  Completeness component:  {new_result['completeness_component']:.2f}/0.5")
        print(f"  ➡️  Total Score: {new_result['total']:.2f}/2.5")
        
        # Compare difference
        diff = new_result['total'] - old_score
        diff_symbol = "📈" if diff > 0 else "📉" if diff < 0 else "➡️"
        print(f"\n{diff_symbol} Difference: {diff:+.2f} điểm ({(diff/2.5*100):+.1f}%)")
        
        # Analysis
        print("\n💡 Analysis:")
        if diff > 0:
            print(f"  New method gives HIGHER score - rewards balanced skills")
        elif diff < 0:
            print(f"  New method gives LOWER score - penalizes weak areas")
        else:
            print(f"  Scores are similar")
    
    print("\n" + "=" * 80)
    print("KEY IMPROVEMENTS in New Method:")
    print("=" * 80)
    print("""
1. ✅ Multi-dimensional: Uses 4 Azure metrics (pronunciation, fluency, completeness, accuracy)
   instead of just 1 (pronunciation)

2. ✅ Balanced weighting: 
   - 30% Technical skills (pronunciation + fluency + accuracy)
   - 50% Content quality (ChatGPT evaluation)
   - 20% Completeness (how much they actually said)

3. ✅ Fairer assessment: 
   - Good pronunciation alone won't give high score if content is poor
   - Good content with poor pronunciation still gets reasonable score
   - Rewards students who complete the full response

4. ✅ More granular feedback with component breakdown
""")

if __name__ == "__main__":
    main()
