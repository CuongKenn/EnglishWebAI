# Bug Fixes - Comprehensive Test Submission & Data Structure

## 🐛 Bugs Fixed

### 1. **500 Internal Server Error - Datetime Comparison**

#### Error
```python
TypeError: can't compare offset-naive and offset-aware datetimes
```

#### Location
`backend/app/routers/exercises.py` line 907

#### Root Cause
```python
# OLD CODE (BROKEN)
if exercise.due_at and datetime.utcnow() > exercise.due_at:
    status_value = "late"
```

- `datetime.utcnow()` returns **naive datetime** (no timezone info)
- `exercise.due_at` from database is **timezone-aware** (has UTC timezone)
- Python cannot compare naive and aware datetimes

#### Fix
```python
# NEW CODE (FIXED)
from datetime import timezone

status_value = "submitted"
if exercise.due_at:
    now_utc = datetime.now(timezone.utc)
    # Make sure due_at is timezone-aware
    if exercise.due_at.tzinfo is None:
        due_at_aware = exercise.due_at.replace(tzinfo=timezone.utc)
    else:
        due_at_aware = exercise.due_at
    if now_utc > due_at_aware:
        status_value = "late"
```

**Solution:**
1. Use `datetime.now(timezone.utc)` instead of `datetime.utcnow()`
2. Ensure both datetimes are timezone-aware before comparison
3. Handle both aware and naive `due_at` values

---

### 2. **Comprehensive Test Data Structure Mismatch**

#### Problem
GPT-4 returns comprehensive test in one format, but frontend/backend expect different structure.

#### GPT-4 Response Format
```json
{
  "title": "Đề Giữa kỳ...",
  "questions": [
    {
      "section": "listening",
      "script": "...",
      "total_points": 2.5,
      "questions": [
        {"id": 1, "question": "...", "type": "multiple_choice", ...},
        {"id": 2, "question": "...", "type": "fill_blank", ...}
      ]
    },
    {
      "section": "reading",
      "passage": "...",
      "total_points": 2.5,
      "questions": [...]
    },
    {
      "section": "writing",
      "prompt": "...",
      "total_points": 2.5,
      ...
    },
    {
      "section": "speaking",
      "total_points": 2.5,
      ...
    }
  ]
}
```

#### Expected Format (Backend/Frontend)
```json
{
  "type": "comprehensive_test",
  "title": "Đề Giữa kỳ...",
  "listening": {
    "script": "...",
    "audio_url": "/api/v1/media/files/audio/...",
    "total_points": 2.5,
    "questions": [
      {"id": 1, "question": "...", "type": "multiple_choice", ...}
    ]
  },
  "reading": {
    "passage": "...",
    "total_points": 2.5,
    "questions": [...]
  },
  "writing": {
    "prompt": "...",
    "total_points": 2.5,
    ...
  },
  "speaking": {
    "total_points": 2.5,
    ...
  }
}
```

#### Fix Applied

**Backend Transform** (`backend/app/services/ai_exercise_generator.py`):

```python
# Parse JSON
result = json.loads(content)

# Transform comprehensive test structure
# GPT returns: {"questions": [{"section": "listening", ...}, ...]}
# We need: {"type": "comprehensive_test", "listening": {...}, ...}
if result.get("questions") and isinstance(result["questions"], list):
    transformed = {
        "type": "comprehensive_test",
        "title": result.get("title", "Comprehensive Test")
    }
    
    for section in result["questions"]:
        section_name = section.get("section", "").lower()
        if section_name in ["listening", "reading", "writing", "speaking"]:
            # Remove the 'section' key and store under section name
            section_data = {k: v for k, v in section.items() if k != "section"}
            transformed[section_name] = section_data
    
    result = transformed

# Generate audio for listening section
if result.get("listening") and result["listening"].get("script"):
    print("🎧 Generating audio for listening section...")
    audio_url = await self._generate_audio_from_text(result["listening"]["script"])
    if audio_url:
        result["listening"]["audio_url"] = audio_url
        print(f"✅ Audio URL: {audio_url}")

return result
```

**Frontend Parse** (`frontend/src/pages/student/DoExercise/DoExercise.jsx`):

```jsx
// OLD CODE (BROKEN)
const questions = exerciseContent.questions || [];
const listeningQuestions = questions.filter(q => q.skill === 'listening');
const readingQuestions = questions.filter(q => q.skill === 'reading');

// NEW CODE (FIXED)
const listening = exerciseContent.listening || {};
const reading = exerciseContent.reading || {};
const writing = exerciseContent.writing || {};
const speaking = exerciseContent.speaking || {};

// Get questions from each section
const listeningQuestions = listening.questions || [];
const readingQuestions = reading.questions || [];
```

---

## 🔍 Why These Bugs Occurred

### 1. Datetime Bug
- **When**: When student submits exercise
- **Cause**: Database stores timestamps with timezone (PostgreSQL `TIMESTAMP WITH TIME ZONE`)
- **Why not caught earlier**: Testing was done with exercises that don't have `due_at` set, so the comparison code wasn't executed

### 2. Data Structure Bug
- **When**: Comprehensive test exercise created with AI generator
- **Cause**: Mismatch between GPT-4 JSON response format and expected application format
- **Why not caught earlier**: 
  - GPT-4 naturally returns nested array with `section` field
  - Frontend was designed for direct section objects
  - No transformation layer between GPT response and storage

---

## ✅ Testing Performed

### Test 1: Submit Exercise (Fixed 500 Error)
```bash
# Before fix:
POST /api/v1/exercises/20/submit
→ 500 Internal Server Error
→ TypeError: can't compare offset-naive and offset-aware datetimes

# After fix:
POST /api/v1/exercises/20/submit
→ 200 OK
→ Submission created successfully
```

### Test 2: Comprehensive Test Data Structure
```bash
# Backend transformation:
GPT Response → Transform → Storage Format
✓ "section" field removed
✓ Nested under section names (listening, reading, writing, speaking)
✓ "type": "comprehensive_test" added
✓ Audio generated for listening

# Frontend parsing:
exerciseContent.listening.questions → ✓ Array of questions
exerciseContent.reading.questions → ✓ Array of questions
Audio player src → ✓ listening.audio_url
Reading passage → ✓ reading.passage
Writing prompt → ✓ writing.prompt
```

---

## 🎯 Impact & Resolution

### Before Fixes
❌ Students cannot submit comprehensive test exercises (500 error)
❌ Comprehensive test questions don't render correctly
❌ Listening audio not displayed
❌ Reading/Writing sections missing

### After Fixes
✅ Submissions work for all exercise types
✅ Comprehensive test renders all 4 sections correctly
✅ Listening audio plays properly
✅ All question types display (MC, Fill blank, T/F, Matching)
✅ Writing and speaking sections show correctly

---

## 📋 Additional Changes Made

### Backend (`exercises.py`)
- Added timezone handling for datetime comparisons
- Imported `timezone` from `datetime`
- Made comparison safe for both aware and naive datetimes

### Backend (`ai_exercise_generator.py`)
- Added data transformation layer after GPT-4 response
- Converts nested array structure to flat object structure
- Preserves all question data and section properties
- Generates audio URL after transformation

### Frontend (`DoExercise.jsx`)
- Changed from filtering global `questions` array to accessing section-specific questions
- `listeningQuestions = listening.questions`
- `readingQuestions = reading.questions`
- Removed `q.skill` filtering logic

---

## 🔧 Recommended Further Actions

### 1. Add Validation
```python
# In ai_exercise_generator.py after transformation
def validate_comprehensive_test(data: dict) -> bool:
    required_sections = ["listening", "reading", "writing", "speaking"]
    for section in required_sections:
        if section not in data:
            return False
        if "questions" in data[section] and not data[section]["questions"]:
            return False
    return True
```

### 2. Add Error Handling
```jsx
// In DoExercise.jsx
if (!listening.questions || listening.questions.length === 0) {
  console.warn('Listening section has no questions');
  // Show warning to student
}
```

### 3. Database Migration (Optional)
```python
# Ensure all datetime fields are timezone-aware
from datetime import timezone
# Convert existing naive timestamps
UPDATE exercises 
SET due_at = due_at AT TIME ZONE 'UTC' 
WHERE due_at IS NOT NULL;
```

### 4. Unit Tests
```python
# Test datetime comparison
def test_submit_exercise_with_due_date():
    exercise = Exercise(due_at=datetime.now(timezone.utc))
    # Should not raise TypeError
    
# Test data transformation
def test_transform_gpt_response():
    gpt_response = {
        "questions": [
            {"section": "listening", "questions": [...]}
        ]
    }
    result = transform_comprehensive_test(gpt_response)
    assert result["type"] == "comprehensive_test"
    assert "listening" in result
    assert "section" not in result["listening"]
```

---

## 🚀 Deployment Steps

1. **Restart Backend Container**
   ```bash
   docker compose restart backend
   # or
   docker compose up --build backend -d
   ```

2. **Clear Frontend Cache**
   ```bash
   # In browser: Ctrl+Shift+R (hard reload)
   # Or rebuild frontend
   docker compose up --build frontend -d
   ```

3. **Verify Fix**
   - Create new comprehensive test with AI
   - Check data structure in database
   - Submit test as student
   - Verify submission succeeds (200 OK)

---

## 📊 Summary

| Issue | Status | Fix Location | Type |
|-------|--------|--------------|------|
| 500 Error on Submit | ✅ Fixed | `exercises.py:907` | Datetime comparison |
| Data Structure Mismatch | ✅ Fixed | `ai_exercise_generator.py:298` | Data transformation |
| Frontend Parsing | ✅ Fixed | `DoExercise.jsx:600` | Question extraction |
| Audio Generation | ✅ Works | `ai_exercise_generator.py:315` | After transformation |

**All critical bugs resolved. System ready for comprehensive test usage.**
