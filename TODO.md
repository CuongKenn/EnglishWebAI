# EnglishWebAI - TODO List

## 📋 TỔNG QUAN CẤU TRÚC SẢN PHẨM (3 Mô-đun chính)

### ✅ MÔ-ĐUN 1: Trợ lý soạn phiếu học tập
**Mục tiêu**: AI tự động tạo phiếu bài tập theo chương trình học

**Hiện trạng**:
- ✅ Có `/question-bank/generate-test` - tạo đề từ config
- ❌ Chưa có endpoint tạo phiếu theo tuần học/chủ đề/lớp
- ❌ Chưa tích hợp phân phối chương trình môn học

**Cần làm**:
- [ ] Backend: Tạo endpoint `POST /ai/generate-exercise-sheet`
  - Input: `{topic, grade, skill_type, week_number}`
  - AI tự động tạo phiếu bài tập hoàn chỉnh theo chương trình
  - Trả về: questions, scoring rubrics, time allocation
- [ ] Frontend: Tạo page **ExerciseSheetGenerator** cho Teacher
  - Form nhập: Chủ đề, Lớp, Kỹ năng, Tuần học
  - Preview phiếu trước khi lưu
  - Lưu vào exercise database với đầy đủ content

---

### ⚠️ MÔ-ĐUN 2: Chấm & phản hồi tự động
**Mục tiêu**: AI chấm bài Writing/Speaking, Teacher review trước khi gửi học sinh

**Hiện trạng**:
- ✅ Có `/teacher-grading/submissions/{id}/ai-grade` - lưu kết quả AI
- ✅ Có AI services: `gemini_service.check_writing()`, `check_pronunciation()`
- ⚠️ Chưa tự động trigger AI khi student submit
- ⚠️ UI chưa hiển thị rubrics breakdown + error analysis chi tiết

**Cần làm**:

#### Backend
- [ ] Auto-trigger AI grading khi submit Writing/Speaking
  - Hook vào `POST /exercises/{id}/submit`
  - Gọi `gemini_service` tự động
  - Lưu `rubrics_scores`, `error_analysis`, `suggestions` vào submission
- [ ] Improve AI feedback structure
  - Rubrics: `{grammar: 8, vocabulary: 7, coherence: 9, mechanics: 6}`
  - Error analysis: `[{type: "grammar", location: "line 2", error: "subject-verb", suggestion: "..."}]`
  - Overall suggestions: string[]

#### Frontend - Teacher
- [ ] **GradingFeedback.jsx** improvements
  - Hiển thị rubrics scores dạng progress bar
  - Bảng error analysis với type/location/suggestion
  - Textarea chỉnh sửa feedback
  - Buttons: Approve (gửi nguyên), Edit & Send, Reject & Re-grade
- [ ] Bulk grading: chấm nhiều bài cùng lúc

#### Frontend - Student
- [ ] **DoExercise.jsx** - renderResultView enhancements
  - Score breakdown by rubrics
  - Error analysis table với highlight location
  - Suggestions section với action items
  - "Làm lại" button nếu được phép

---

### ❌ MÔ-ĐUN 3: Theo dõi và phân tích tiến bộ
**Mục tiêu**: Dashboard tiến bộ, biểu đồ, xuất báo cáo PDF/Excel

**Hiện trạng**:
- ✅ Có `/teacher-grading/classes/{id}/analytics/students` - basic progress
- ❌ Chưa có time-series data (tiến bộ theo tuần/tháng)
- ❌ Chưa có grouping/clustering students
- ❌ Export chỉ trả về "coming soon"

**Cần làm**:

#### Database
- [ ] Tạo bảng `student_progress_history`
  ```sql
  CREATE TABLE student_progress_history (
    id INT PRIMARY KEY,
    student_id INT,
    class_id INT,
    skill_type VARCHAR(20), -- listening|speaking|reading|writing
    avg_score FLOAT,
    submission_count INT,
    week_start DATE,
    week_end DATE,
    created_at TIMESTAMP
  )
  ```
- [ ] Cronjob/Background task: aggregate submissions → weekly snapshots

#### Backend Analytics
- [ ] Expand `/analytics/students` endpoint
  - Query param: `time_period` (week|month|semester)
  - Return: time-series data per skill
  - Add `weak_groups`: students grouped by skill weakness
- [ ] Endpoint: `GET /analytics/skill-comparison`
  - Compare 4 skills across all students
  - Return data for bar chart
- [ ] Endpoint: `GET /analytics/class-heatmap`
  - Matrix: students x skills
  - Color by performance level

#### Backend Export
- [ ] Implement PDF export (`reportlab` or `weasyprint`)
  - Template: School header, student list, charts (matplotlib), recommendations
  - Include: avg scores, skill breakdown, progress trends, weak areas
- [ ] Implement Excel export (`openpyxl`)
  - Sheets: Overview, Individual Student Data, Skill Analysis
  - Charts embedded in Excel

#### Frontend - Teacher Dashboard
- [ ] Tạo page **AnalyticsDashboard.jsx**
  - Line chart: tiến bộ theo thời gian (Chart.js hoặc Recharts)
  - Bar chart: so sánh 4 skills
  - Heatmap: performance matrix
  - Table: nhóm học sinh yếu kỹ năng (với recommendations)
  - Export buttons: PDF, Excel
- [ ] Route: `/teacher/analytics/class/:classId`

---

## 🔧 TÍCH HỢP & CẢI THIỆN

### Exercise Creation Flow
- [ ] **ExercisesTests.jsx** - Improve create form
  - Add skill_type selector
  - Content builder: Questions, Audio upload, Passage input
  - Rubrics configuration (nếu enable AI grading)
  - Preview modal trước khi tạo
  - Validate: phải có skill_type + content trước khi save

### AI Assistants Integration
- [ ] Kiểm tra `/ai/writing`, `/ai/reading` có tích hợp vào exercise workflow chưa
  - Student làm bài → gọi AI check realtime?
  - Kết quả AI có lưu vào submission không?
- [ ] SpeakingExercise: cần endpoint `/ai/speaking/check-pronunciation`

### Testing
- [ ] Unit tests cho AI services
  - `gemini_service.check_writing()`
  - `gemini_service.generate_exercise_sheet()`
  - Auto-grading workflow
- [ ] Integration tests
  - Submit exercise → AI grade → Teacher review → Send to student

---

## 📊 PRIORITY

**🔥 HIGH (Core features thiếu)**
1. Mô-đun 2: Auto AI grading khi submit
2. Mô-đun 2: Teacher review UI với rubrics/errors
3. Mô-đun 3: Analytics dashboard với charts
4. Exercise creation form improvements
5. Student view - Error analysis + suggestions

**⚡ MEDIUM (Enhancements)**
6. Mô-đun 1: AI Exercise Sheet Generator
7. Mô-đun 3: Export PDF/Excel
8. Database: student_progress_history table
9. Bulk grading UI

**🔹 LOW (Nice to have)**
10. AI assistants integration check
11. Speaking pronunciation check endpoint
12. Unit tests coverage

---

## 📝 NOTES
- ✅ Link sharing cho exercise: DONE (ExerciseDetailModal.jsx)
- ⚠️ Nhiều exercise được tạo không có content → cần validate form
- 🚧 Backend AI infrastructure đã sẵn, chỉ cần kết nối workflow
- 📦 Dependencies cần thêm: `reportlab`, `openpyxl`, `matplotlib` (for charts in PDF)

