# Rich Course Content API - Documentation

## 📖 Tổng quan

Hệ thống đã được nâng cấp để hỗ trợ **nội dung phong phú** cho tất cả 4 kỹ năng:
- **Reading**: Passages với paragraphs và questions
- **Writing**: Prompts với rubrics chấm điểm chi tiết
- **Listening**: Audio với transcript và questions
- **Speaking**: Prompts với criteria đánh giá

## 🗄️ Database Schema

### Reading Tables
```
reading_passages
├── id, unit_id, title, subtitle
├── difficulty, estimated_time, total_questions
└── paragraphs (1-N)
    ├── paragraph_id (A, B, C...)
    ├── heading, content, order_index
    └── questions (1-N)
        ├── type, instruction, options_json
        └── correct_answer, points
```

### Writing Tables
```
writing_prompts
├── id, unit_id, title, type
├── instruction, prompt, additional_instruction
├── min_words, max_words, time_limit
├── difficulty, sample_answer, hints_json
└── rubrics (1-N)
    ├── category (Content, Grammar, Vocabulary...)
    ├── description, max_points
    └── order_index
```

### Listening Tables
```
listening_audios
├── id, unit_id, title, description
├── audio_url, duration, difficulty
├── topic, accent, speed
├── transcript, has_transcript
└── questions (1-N)
    ├── type, question_text, options_json
    ├── correct_answer, explanation
    └── timestamp, points
```

### Speaking Tables
```
speaking_prompts
├── id, unit_id, title, type
├── instruction, prompt, context
├── preparation_time, response_time
├── difficulty, sample_response
├── sample_audio_url, tips_json, vocabulary_json
└── criteria (1-N)
    ├── category (Fluency, Pronunciation...)
    ├── description, max_points
    └── order_index
```

## 🔌 API Endpoints

Base URL: `/api/v1/content`

### Reading Endpoints

**Create Reading Passage**
```http
POST /api/v1/content/units/{unit_id}/reading
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "The Rainmakers",
  "subtitle": "Science and technology work with nature...",
  "difficulty": "Intermediate",
  "estimated_time": 15,
  "total_questions": 5,
  "paragraphs": [
    {
      "paragraph_id": "A",
      "heading": "A worried farmer",
      "content": "Gang Liu, a wheat farmer...",
      "order_index": 0,
      "questions": [
        {
          "type": "multiple-choice",
          "instruction": "What is cloud seeding?",
          "options": ["Option A", "Option B", "Option C"],
          "correct_answer": 1,
          "points": 1,
          "order_index": 0
        }
      ]
    }
  ]
}
```

**Get Reading Passage**
```http
GET /api/v1/content/units/{unit_id}/reading
Authorization: Bearer {token}
```

**Update Reading Passage**
```http
PUT /api/v1/content/reading/{passage_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Updated Title",
  "difficulty": "Advanced"
}
```

**Delete Reading Passage**
```http
DELETE /api/v1/content/reading/{passage_id}
Authorization: Bearer {token}
```

### Writing Endpoints

**Create Writing Prompt**
```http
POST /api/v1/content/units/{unit_id}/writing
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Essay: Technology Impact",
  "type": "essay",
  "instruction": "Write an essay about...",
  "prompt": "Do you agree or disagree...",
  "additional_instruction": "Use specific examples...",
  "min_words": 250,
  "max_words": 350,
  "time_limit": 40,
  "difficulty": "Intermediate",
  "sample_answer": "Sample response...",
  "hints": ["Hint 1", "Hint 2"],
  "rubrics": [
    {
      "category": "Content and Ideas",
      "description": "Clarity and relevance of ideas",
      "max_points": 40,
      "order_index": 0
    },
    {
      "category": "Grammar",
      "description": "Grammatical accuracy",
      "max_points": 25,
      "order_index": 1
    }
  ]
}
```

**Get/Update/Delete** - Tương tự Reading với endpoints:
- `GET /api/v1/content/units/{unit_id}/writing`
- `PUT /api/v1/content/writing/{prompt_id}`
- `DELETE /api/v1/content/writing/{prompt_id}`

### Listening Endpoints

**Create Listening Audio**
```http
POST /api/v1/content/units/{unit_id}/listening
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "BBC News Report",
  "description": "A news report about climate change",
  "audio_url": "/media/audio/listening_unit1.mp3",
  "duration": 180,
  "difficulty": "Advanced",
  "topic": "Environment",
  "accent": "British",
  "speed": "normal",
  "transcript": "Full transcript here...",
  "has_transcript": true,
  "total_questions": 5,
  "questions": [
    {
      "type": "multiple-choice",
      "question_text": "What is the main topic?",
      "options": ["Option A", "Option B", "Option C"],
      "correct_answer": "Option A",
      "explanation": "The answer is A because...",
      "timestamp": 30.5,
      "points": 2,
      "order_index": 0
    }
  ]
}
```

**Get/Update/Delete** - Tương tự với endpoints:
- `GET /api/v1/content/units/{unit_id}/listening`
- `PUT /api/v1/content/listening/{audio_id}`
- `DELETE /api/v1/content/listening/{audio_id}`

### Speaking Endpoints

**Create Speaking Prompt**
```http
POST /api/v1/content/units/{unit_id}/speaking
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Describe Your Hometown",
  "type": "description",
  "instruction": "Describe your hometown in detail",
  "prompt": "Tell me about your hometown. What is special about it?",
  "context": "Part 1: Introduction and Interview",
  "preparation_time": 30,
  "response_time": 120,
  "difficulty": "Intermediate",
  "sample_response": "I come from...",
  "sample_audio_url": "/media/audio/sample_speaking.mp3",
  "tips": ["Speak clearly", "Use varied vocabulary"],
  "vocabulary": {
    "hometown": "quê hương",
    "special": "đặc biệt"
  },
  "criteria": [
    {
      "category": "Fluency and Coherence",
      "description": "Ability to speak smoothly",
      "max_points": 25,
      "order_index": 0
    },
    {
      "category": "Pronunciation",
      "description": "Clarity and accuracy",
      "max_points": 25,
      "order_index": 1
    }
  ]
}
```

**Get/Update/Delete** - Tương tự với endpoints:
- `GET /api/v1/content/units/{unit_id}/speaking`
- `PUT /api/v1/content/speaking/{prompt_id}`
- `DELETE /api/v1/content/speaking/{prompt_id}`

## 🎨 Frontend Integration

### API Service (`frontend/src/api/courseContent.js`)

```javascript
import { getReadingPassage } from '../../api/courseContent';

// Sử dụng
const data = await getReadingPassage(unitId);
```

### Frontend Pages - Automatic Fallback

Tất cả 4 pages đã được update với **automatic fallback**:
1. **Try new API first** - Nếu có rich content data
2. **Fallback to old API** - Nếu không có (dùng CourseQuestions)

```javascript
// Example từ ReadingExercise.jsx
try {
  const data = await getReadingPassage(lessonId);
  // Use rich content
  setReadingData(transformData(data));
} catch (err) {
  // Fallback to old CourseQuestions API
  const questions = await coursesAPI.getQuestions(lessonId);
  // Use old format
}
```

### Updated Pages:
✅ `ReadingExercise.jsx` - Hỗ trợ passages với paragraphs  
✅ `WritingExercise.jsx` - Hỗ trợ prompts với rubrics  
✅ `ListeningExercise.jsx` - Hỗ trợ audio với transcript  
✅ `SpeakingExercise.jsx` - Hỗ trợ prompts với criteria  

## 🚀 Migration Strategy

### Cách tạo nội dung mới:

**Option 1: Dùng Teacher Dashboard**
- Tạo Course → Tạo Unit → Thêm Rich Content qua UI (coming soon)

**Option 2: Direct API Call**
```bash
# Example: Tạo Reading Passage
curl -X POST http://localhost:8000/api/v1/content/units/1/reading \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @reading_data.json
```

**Option 3: Python Script**
```python
import requests

token = "YOUR_TOKEN"
headers = {"Authorization": f"Bearer {token}"}
url = "http://localhost:8000/api/v1/content/units/1/reading"

data = {
    "title": "Sample Reading",
    "paragraphs": [...]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Data Migration từ CourseQuestions

Nếu có dữ liệu cũ trong `course_questions`, cần migrate:

```python
# Script migrate (tự tạo)
from app.models.course import CourseQuestion
from app.models.course_content import ReadingPassage, ReadingParagraph

# Lấy questions cũ
questions = db.query(CourseQuestion).filter_by(unit_id=unit_id).all()

# Tạo reading passage mới
passage = ReadingPassage(
    unit_id=unit_id,
    title="Migrated Content",
    paragraphs=[...]
)
db.add(passage)
db.commit()
```

## 📊 Benefits

### Before (Old System)
- ❌ Flat structure: Questions trực tiếp trong CourseQuestions
- ❌ Limited metadata: Không có difficulty, time estimates
- ❌ No hierarchical content: Reading không có paragraphs
- ❌ Basic grading: Không có rubrics chi tiết

### After (New System)
- ✅ Rich structure: Hierarchical content (Passage → Paragraphs → Questions)
- ✅ Detailed metadata: Difficulty, time, topics, accents, etc.
- ✅ Professional grading: Rubrics & criteria với points breakdown
- ✅ Better UX: Sample answers, hints, transcripts, vocabulary

## 🔍 Testing

### Test Reading API:
```bash
# Lấy token (giả sử đã có user)
TOKEN="your_token_here"

# Tạo reading passage
curl -X POST http://localhost:8000/api/v1/content/units/1/reading \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Passage",
    "difficulty": "Beginner",
    "paragraphs": [{
      "paragraph_id": "A",
      "content": "Test content",
      "questions": [{
        "type": "multiple-choice",
        "instruction": "Test question?",
        "options": ["A", "B", "C"],
        "correct_answer": 0,
        "points": 1,
        "order_index": 0
      }]
    }]
  }'

# Lấy reading passage
curl http://localhost:8000/api/v1/content/units/1/reading \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 Next Steps

1. **Teacher UI for Content Creation** - Tạo UI để giáo viên thêm rich content dễ dàng
2. **AI Content Generation** - Tích hợp AI để tự động generate passages, prompts
3. **Analytics Dashboard** - Tracking student performance với rich content
4. **Export/Import** - Export content ra JSON/Excel để chia sẻ

## 📞 Support

Nếu cần hỗ trợ:
- Check logs: `docker logs englishwebai_backend`
- Test API: Swagger UI tại `http://localhost:8000/api/v1/docs`
- Database: PostgreSQL tại `localhost:5432`

---

**Created**: November 1, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

