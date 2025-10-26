# 📚 INTEGRATE AddLessonContentModal INTO COURSES.JSX

## 🎯 CÁC BƯỚC

### 1. Import Component
Thêm vào đầu file `Courses.jsx`:
```javascript
import AddLessonContentModal from './Courses/AddLessonContentModal';
```

### 2. Add State
Thêm state trong component:
```javascript
const [showAddContentModal, setShowAddContentModal] = useState(false);
const [selectedLesson, setSelectedLesson] = useState(null);
const [lessonContents, setLessonContents] = useState([]);
```

### 3. Add Handler
```javascript
const handleAddContent = (content) => {
  // Add content to lesson
  setLessonContents([...lessonContents, content]);
  setShowAddContentModal(false);
  
  // TODO: Call backend API to save
  // await api.addLessonContent(content);
};
```

### 4. Add Button in Lesson Detail View
Tìm phần hiển thị lesson detail (có thể trong modal hoặc tab), thêm button:
```javascript
<button 
  className="btn-add-content"
  onClick={() => {
    setSelectedLesson(lesson);
    setShowAddContentModal(true);
  }}
>
  <Plus size={18} />
  Thêm nội dung bài học
</button>
```

### 5. Add Modal at End
Cuối component, trước `</div>` cuối:
```javascript
{showAddContentModal && selectedLesson && (
  <AddLessonContentModal
    lessonId={selectedLesson.id}
    courseId={selectedCourse?.id}
    onClose={() => setShowAddContentModal(false)}
    onAdd={handleAddContent}
  />
)}
```

---

## ✅ DONE

Bây giờ khi click "Thêm nội dung bài học":
- Modal mở ra
- Chọn skill (Listening, Speaking, Reading, Writing)
- Fill content tương ứng
- Add nhiều câu hỏi
- Lấy câu hỏi từ Question Bank
- Submit → Lưu vào lesson

---

## 📊 DATA STRUCTURE

Lesson với content:
```javascript
{
  id: 'lesson-1',
  title: 'Unit 1: Hello World',
  duration: 60,
  contents: [
    {
      id: 'content-1',
      skill_type: 'listening',
      content: {
        audio_url: '/uploads/audio.mp3',
        transcript: '...',
        questions: [...]
      }
    },
    {
      id: 'content-2',
      skill_type: 'reading',
      content: {
        passage: '...',
        questions: [...]
      }
    }
  ]
}
```

Backend sẽ lưu mảng `contents` cho mỗi lesson.

---

**Status:** Ready for integration!

