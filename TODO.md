# EnglishWebAI - TODO List (Cập nhật 28/10/2025)

## ✅ ĐÃ HOÀN THÀNH (Recent Progress)

### 🎉 Mô-đun 2: Auto AI Grading - DONE!
**Backend**: `_auto_grade_submission()` trong `exercises.py`
- ✅ Auto-trigger khi student submit Writing/Speaking
- ✅ Gemini AI grading cho Writing: rubrics (content, organization, vocab, grammar, mechanics)
- ✅ Azure Speech API cho Speaking: pronunciation, fluency, completeness, accuracy
- ✅ Lưu `rubrics_scores`, `ai_feedback`, `ai_score` vào submission
- ✅ Status "pending_review" - Teacher có thể review/confirm

**Frontend Teacher**: `GradingFeedback.jsx`
- ✅ Hiển thị rubrics scores dạng score cards + progress bars
- ✅ Speaking assessment: 4 metrics visualization
- ✅ Writing assessment: content/organization/vocab/grammar/mechanics
- ✅ Recognized text (Speaking), word count (Writing)
- ✅ Strengths, improvements, corrections display
- ✅ Detailed feedback section
- ✅ Teacher có thể edit feedback trước khi approve

### 🎨 Exercise Creation - Complete UI!
**Frontend**: `CreateExerciseModalComplete.jsx` (1293 lines)
- ✅ Skill type selector: Listening, Speaking, Reading, Writing
- ✅ Test type: Skill Exercise, 15min Test, Midterm, Final
- ✅ Creation methods: Manual, AI Generate, Question Bank
- ✅ Content builder:
  - Listening: Audio upload + Transcript
  - Reading: Text input or File upload
  - Speaking: Prompt + Instructions + Time settings
  - Writing: Prompt + Type + Word limit + Instructions
- ✅ Questions management: Add/Edit/Delete
- ✅ Question Bank integration modal
- ✅ AI generation options (files/prompt based)
- ✅ Preview before create

---

## ⚠️ ĐANG THIẾU (High Priority)

### 1. 🎯 STUDENT VIEW - Error Analysis Display
**File**: `DoExercise.jsx` - renderResultView()
**Hiện trạng**: Chỉ hiển thị score/feedback cơ bản

**Cần làm**:
```jsx
// Backend đã có data trong submission.rubrics_scores:
{
  speaking_assessment: {pronunciation: 85, fluency: 78, ...},
  writing_assessment: {content: 8, grammar: 7, ...},
  recognized_text: "...",
  word_count: 245,
  strengths: ["Good vocabulary", ...],
  improvements: ["Work on grammar", ...],
  corrections: ["error1 -> fix1", ...],
  suggestions: "Practice more..."
}
```

**Implement**:
- [ ] Rubrics breakdown visualization (similar to GradingFeedback)
- [ ] Error analysis table với highlight
- [ ] Corrections list với before/after
- [ ] Suggestions section actionable
- [ ] Speaking: Audio player + recognized text comparison
- [ ] Writing: Word count + criteria scores

---

### 2. 📊 ANALYTICS DASHBOARD - Chưa có trang
**Hiện trạng**: 
- `StatisticsReports.jsx` chỉ có mock data
- Backend `/analytics/students` chỉ trả current state

**Cần tạo**: `AnalyticsDashboard.jsx`

**Features**:
- [ ] **Line Chart**: Tiến bộ theo thời gian từng học sinh
  - X-axis: Tuần/Tháng
  - Y-axis: Average score
  - Multiple lines: 4 skills
  - Library: Chart.js hoặc Recharts
  
- [ ] **Bar Chart**: So sánh 4 skills across all students
  - Grouped bars: Listening, Speaking, Reading, Writing
  - Filter by class
  
- [ ] **Heatmap**: Performance matrix
  - Rows: Students
  - Columns: Skills
  - Color: Score levels (green/yellow/red)
  
- [ ] **Table**: Nhóm học sinh yếu kỹ năng
  - Auto clustering by skill scores
  - Recommendations for each group
  - Export list for intervention planning

**Backend Endpoint**: Mở rộng `/analytics/students`
```python
GET /teacher-grading/classes/{id}/analytics/progress
Query params:
  - time_period: week|month|semester
  - start_date, end_date
  - skill_type (optional filter)
  
Response:
{
  time_series: [
    {week: "2025-W01", listening: 7.5, speaking: 6.8, ...},
    {week: "2025-W02", listening: 7.8, speaking: 7.1, ...}
  ],
  skill_comparison: {listening: 7.5, speaking: 6.8, reading: 8.2, writing: 7.1},
  weak_groups: {
    speaking_weak: [student_ids],
    writing_weak: [student_ids],
    recommendations: {...}
  },
  heatmap_data: [
    {student_id: 1, name: "...", scores: {listening: 8, speaking: 6, ...}},
    ...
  ]
}
```

---

### 3. 📄 EXPORT PDF/EXCEL - Coming Soon
**File**: `teacher_grading.py` - `export_progress_report()`
**Hiện trạng**: Trả về `{"message": "PDF/Excel export coming soon"}`

**Implement**:

#### PDF Export (ReportLab / WeasyPrint)
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
import matplotlib.pyplot as plt
```

**Template**:
- [ ] School header (logo, name, address)
- [ ] Class information section
- [ ] Student list with scores table
- [ ] Charts:
  - Progress line chart (matplotlib → image → PDF)
  - Skills radar chart
- [ ] Summary statistics
- [ ] Weak students identification
- [ ] Recommendations section
- [ ] Teacher signature area

#### Excel Export (openpyxl)
```python
from openpyxl import Workbook
from openpyxl.chart import LineChart, BarChart
```

**Sheets**:
- [ ] **Overview**: Class summary, average scores, attendance
- [ ] **Students Data**: Detailed table (student, all scores, submissions)
- [ ] **Skill Analysis**: Breakdown by skill with charts
- [ ] **Timeline**: Weekly/monthly progress data
- [ ] **Recommendations**: Auto-generated based on data

**Dependencies cần thêm**:
```bash
pip install reportlab weasyprint openpyxl matplotlib
```

---

### 4. 💾 DATABASE - student_progress_history Table
**Mục đích**: Tracking tiến bộ theo thời gian cho time-series charts

**Migration**:
```python
# alembic/versions/010_student_progress_history.py
def upgrade():
    op.create_table(
        'student_progress_history',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('student_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('class_id', sa.Integer, sa.ForeignKey('classes.id')),
        sa.Column('skill_type', sa.String(20)),  # listening|speaking|reading|writing
        sa.Column('avg_score', sa.Float),
        sa.Column('submission_count', sa.Integer),
        sa.Column('week_start', sa.Date),
        sa.Column('week_end', sa.Date),
        sa.Column('created_at', sa.DateTime, default=datetime.utcnow)
    )
    op.create_index('ix_progress_student_week', 'student_progress_history', 
                    ['student_id', 'week_start'])
```

**Background Task** (Celery / APScheduler):
```python
# Run every Sunday midnight
@scheduler.task('cron', day_of_week='sun', hour=0)
def aggregate_weekly_progress():
    # Query all submissions from last week
    # GROUP BY student_id, skill_type
    # Calculate AVG(score), COUNT(*)
    # INSERT INTO student_progress_history
```

---

## � MEDIUM PRIORITY

### 5. 🤖 Mô-đun 1: AI Exercise Sheet Generator
**Hiện trạng**: 
- `/question-bank/generate-test` có nhưng không tích hợp curriculum
- `CreateExerciseModalComplete` đã có AI option

**Cần làm**:
- [ ] Endpoint mới: `POST /ai/generate-exercise-sheet`
  ```python
  {
    "topic": "Present Perfect Tense",
    "grade": "10",
    "skill_type": "listening",
    "week_number": 5,
    "difficulty": "medium",
    "curriculum_standard": "Vietnamese_MOE_2018"  # Optional
  }
  
  Response:
  {
    "exercise": {
      "title": "...",
      "content": {...},
      "questions": [...],
      "suggested_rubrics": {...},
      "estimated_time": 45
    }
  }
  ```

- [ ] Frontend: Connect AI Generate button trong CreateExerciseModalComplete
- [ ] Curriculum mapping data (JSON file với week-by-week topics)

### 6. ⚡ BULK GRADING
**Hiện trạng**: GradingFeedback chấm từng bài

**Features**:
- [ ] Checkbox select multiple submissions
- [ ] Bulk actions:
  - Approve all AI scores
  - Apply feedback template to selected
  - Batch export results
- [ ] Queue system cho AI grading (nếu >50 bài)
- [ ] Progress indicator

### 7. 🧪 TESTING
- [ ] Unit tests: `gemini_service.grade_writing()`
- [ ] Unit tests: `azure_speech_service.assess_pronunciation()`
- [ ] Integration: Submit → Auto grade → Teacher review workflow
- [ ] Load tests: 100 submissions đồng thời
- [ ] Analytics calculations accuracy

---

## � LOW PRIORITY

### 8. � PERFORMANCE
- [ ] Cache classes/exercises list (Redis/localStorage)
- [ ] Lazy load exercises với pagination
- [ ] Background task cho AI grading (Celery)
- [ ] Database indexes:
  ```sql
  CREATE INDEX idx_submissions_exercise_student ON exercise_submissions(exercise_id, student_id);
  CREATE INDEX idx_submissions_status ON exercise_submissions(status);
  CREATE INDEX idx_exercises_class_due ON exercises(class_id, due_at);
  ```

### 9. � MOBILE RESPONSIVE
- [ ] GradingFeedback mobile layout
- [ ] AnalyticsDashboard touch-friendly charts
- [ ] CreateExerciseModal scrollable sections

---

## 📝 NOTES

**✅ Hoàn thành gần đây**:
- Auto AI grading cho Writing/Speaking
- Teacher review UI với rubrics display
- Complete exercise creation form
- Link sharing cho exercises

**🔥 Top 3 priority ngay**:
1. Student view - Error analysis display (1-2h)
2. Analytics dashboard với charts (4-6h)
3. Export PDF/Excel implementation (6-8h)

**📦 Dependencies cần cài**:
```bash
# Backend
pip install reportlab weasyprint openpyxl matplotlib celery redis

# Frontend
npm install chart.js recharts react-chartjs-2
```

**🎯 Sprint goal**: 
Hoàn thiện 3 mô-đun chính trong 2 tuần!


