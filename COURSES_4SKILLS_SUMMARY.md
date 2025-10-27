# 📚 ADD 4 SKILLS TO COURSES - SUMMARY

## 🎯 MỤC TIÊU

Thêm khả năng add content 4 kỹ năng (Listening, Speaking, Reading, Writing) vào lessons trong courses, với nhiều câu hỏi.

## 📁 FILES CẦN TẠO/UPDATE

### 1. AddLessonContentModal.jsx (NEW)
**Location:** `frontend/src/pages/Teacher/TeacherDashboardV3/components/Courses/AddLessonContentModal.jsx`

**Structure:** Giống `CreateExerciseModalComplete.jsx` nhưng:
- KHÔNG có test type selection (chỉ có 4 skills)
- KHÔNG có creation method (chỉ manual cho lessons)
- Title khác: "Thêm Nội dung Bài học"
- Data structure cho lesson content

**Props:**
```javascript
{
  lessonId: string,
  courseId: string,
  onClose: () => void,
  onAdd: (content) => void
}
```

**Content Structure:**
```javascript
{
  skill_type: 'listening' | 'speaking' | 'reading' | 'writing',
  content: {
    // Same as exercise content
    // Listening: audio + transcript + questions
    // Speaking: prompt + instructions + time
    // Reading: passage/file + questions
    // Writing: prompt + type + word limits
  },
  files: {
    audio_file: File | null,
    passage_file: File | null
  }
}
```

### 2. Courses.jsx (UPDATE)
**Thêm:**
- Import `AddLessonContentModal`
- State: `showAddContentModal`
- Button "Thêm nội dung" trong lesson detail view
- Handler: `handleAddContent`

**Example:**
```javascript
// In lesson detail view
<button onClick={() => setShowAddContentModal(true)}>
  <Plus size={18} />
  Thêm nội dung bài học
</button>

{showAddContentModal && (
  <AddLessonContentModal
    lessonId={selectedLesson.id}
    courseId={selectedCourse.id}
    onClose={() => setShowAddContentModal(false)}
    onAdd={handleAddContent}
  />
)}
```

---

## 🚀 QUICK IMPLEMENTATION

Do `AddLessonContentModal` giống 90% với `CreateExerciseModalComplete`, tôi sẽ:
1. Copy CreateExerciseModalComplete
2. Remove test type selection
3. Remove creation method (import, AI)
4. Update title và labels
5. Update data structure

**Estimated time:** 30 mins

---

## ✅ SUCCESS CRITERIA

- [ ] AddLessonContentModal hiển thị
- [ ] Chọn skill: Listening, Speaking, Reading, Writing
- [ ] Form tương ứng hiển thị (audio upload, text, etc)
- [ ] Add nhiều câu hỏi
- [ ] Câu hỏi từ Question Bank
- [ ] Submit lưu vào lesson
- [ ] Display trong lesson detail

---

**Status:** Ready to implement

