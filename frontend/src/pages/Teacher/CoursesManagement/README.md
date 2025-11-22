# Quản lý Khóa học - Teacher Dashboard

Hệ thống quản lý khóa học đầy đủ cho giáo viên với giao diện đẹp và chuyên nghiệp.

## Tính năng

### ✅ Đã hoàn thành (Frontend)

1. **Tạo khóa học**
   - Chọn kỹ năng (Listening, Speaking, Reading, Writing)
   - Chọn cấp độ (Beginner → Advanced)
   - Chọn khối lớp (1-12)
   - Nhập mô tả khóa học
   - Thiết lập số bài học dự kiến
   - Thiết lập thời lượng (giờ)
   - Upload thumbnail (hình ảnh đại diện)

2. **Xem danh sách khóa học**
   - Grid view với card đẹp mắt
   - Hiển thị thumbnail, emoji theo kỹ năng
   - Badge cấp độ với màu sắc theo skill
   - Thống kê: số bài học, số cúp
   - Lọc theo kỹ năng và lớp
   - Tìm kiếm theo tên

3. **Chỉnh sửa khóa học**
   - Cập nhật thông tin cơ bản
   - Thay đổi thumbnail (nếu cần)
   - Modal form đẹp với validation

4. **Xóa khóa học**
   - Confirmation modal với cảnh báo rõ ràng
   - Hiển thị tên khóa học cần xóa

5. **Xem chi tiết khóa học**
   - Thông tin tổng quan
   - Danh sách bài học (units)
   - Thêm bài học mới
   - Quản lý câu hỏi cho từng bài

6. **Quản lý bài học (Units)**
   - Tạo unit/lesson trong khóa học
   - Thiết lập tuần học
   - Thiết lập số cúp tối đa
   - Thêm câu hỏi theo kỹ năng của khóa học

7. **Giao diện**
   - Modern, responsive design
   - Animations mượt mà
   - Color coding theo kỹ năng
   - Icons và emoji sinh động
   - Stats cards với số liệu

## Cấu trúc File

```
CoursesManagement/
├── CoursesManagement.jsx     # Component chính
├── CoursesManagement.css     # Styling đầy đủ
└── README.md                 # File này
```

## API Endpoints cần Backend xử lý

### 1. Course Management

```javascript
// GET /api/v1/courses
// Query params: ?skill=listening&grade=10&search=...
// Response: Array<CourseListItem>

// GET /api/v1/courses/:courseId
// Response: CourseResponse

// POST /api/v1/courses
// Body: CourseCreate
{
  "title": "Speaking Cơ Bản Lớp 10",
  "skill": "speaking",
  "level": "Intermediate",
  "grade": 10,
  "description": "Khóa học speaking...",
  "is_active": true,
  // Sau này thêm:
  // "thumbnail_url": "url_from_upload",
  // "duration_hours": 40
}

// PUT /api/v1/courses/:courseId
// Body: CourseUpdate (partial)

// DELETE /api/v1/courses/:courseId
// Response: success message
```

### 2. Units (Lessons) Management

```javascript
// GET /api/v1/courses/:courseId/units
// Response: Array<UnitResponse>

// POST /api/v1/courses/:courseId/units
// Body: UnitCreate
{
  "title": "Unit 1 - Introduction",
  "description": "...",
  "week_index": 1,
  "max_cups": 2
}

// PUT /api/v1/courses/:courseId/units/:unitId
// Body: UnitUpdate (partial)

// DELETE /api/v1/courses/:courseId/units/:unitId
```

### 3. Questions Management

```javascript
// GET /api/v1/courses/units/:unitId/questions
// Response: Array<QuestionResponse>

// POST /api/v1/courses/units/:unitId/questions
// Body: QuestionCreate
{
  "type": "mcq",  // mcq|fill-blank|short|mcq-audio|dictation|prompt|essay
  "prompt": "Choose the correct answer",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": { "correct": 0 },
  "media_url": "audio_url_for_listening",
  "points": 1,
  "order_index": 1
}

// DELETE /api/v1/courses/units/:unitId/questions/:questionId
```

### 4. File Upload (TODO - Backend)

```javascript
// POST /api/v1/courses/upload-thumbnail
// FormData with file
// Response: { url: "uploaded_file_url" }
```

## Data Models

### Course
```typescript
{
  id: number;
  title: string;
  description?: string;
  grade: number;           // 1-12
  skill: string;           // listening|speaking|reading|writing
  level: string;           // Beginner|Intermediate|Advanced...
  is_active: boolean;
  thumbnail_url?: string;  // TODO: Add to backend
  duration_hours?: number; // TODO: Add to backend
  created_by: number;
  created_at: datetime;
  updated_at?: datetime;
}
```

### Unit (Lesson)
```typescript
{
  id: number;
  course_id: number;
  title: string;
  description?: string;
  week_index?: number;
  order_index?: number;
  unit_type: string;       // lesson|quiz|practice
  max_cups: number;
  created_at: datetime;
  questions?: number;      // Count of questions
}
```

### Question
```typescript
{
  id: number;
  unit_id: number;
  type: string;            // mcq|fill-blank|short|mcq-audio|dictation|prompt|essay
  prompt: string;
  options?: string[];      // For MCQ types
  answer?: object;         // { correct: 0 } or { text: "answer" }
  media_url?: string;      // For audio/video
  points?: number;
  order_index?: number;
  created_at: datetime;
}
```

## Question Types theo Skill

### Listening
- `mcq-audio`: Multiple choice với audio
- `dictation`: Nghe và điền/viết

### Speaking
- `prompt`: Câu gợi ý để nói (AI sẽ đánh giá)

### Reading
- `mcq`: Multiple choice
- `fill-blank`: Điền vào chỗ trống
- `short`: Câu trả lời ngắn

### Writing
- `essay`: Viết đoạn văn/essay (AI sẽ chấm)

## Cách sử dụng

1. **Truy cập**: Teacher Dashboard → Khóa học (trong sidebar)

2. **Tạo khóa học mới**:
   - Click "Tạo khóa học mới"
   - Điền đầy đủ thông tin
   - Upload thumbnail (optional)
   - Click "Tạo khóa học"

3. **Quản lý khóa học**:
   - Xem chi tiết: Click icon mắt
   - Chỉnh sửa: Click icon bút
   - Xóa: Click icon thùng rác

4. **Thêm bài học**:
   - Vào chi tiết khóa học
   - Click "Thêm bài học"
   - Nhập thông tin unit
   - Click "Thêm"

5. **Thêm câu hỏi**:
   - Trong danh sách units
   - Click vào unit
   - Thêm câu hỏi phù hợp với skill của khóa học

## Notes cho Backend Developer

### Priority 1 - Cần ngay
- ✅ Các endpoint cơ bản đã có (GET, POST, PUT courses)
- ✅ Unit management endpoints đã có
- ✅ Question management endpoints đã có

### Priority 2 - Nên có
- ⏳ DELETE /api/v1/courses/:courseId
- ⏳ Upload thumbnail endpoint
- ⏳ Thêm columns: thumbnail_url, duration_hours vào Course model

### Priority 3 - Nice to have
- Pagination cho danh sách courses
- Bulk operations
- Course templates
- Import/Export courses

## Color Scheme

- **Listening**: `#10b981` (Green)
- **Speaking**: `#8b5cf6` (Purple)
- **Reading**: `#3b82f6` (Blue)
- **Writing**: `#f97316` (Orange)

## Design Principles

1. **Consistency**: Đồng bộ với MyCourses page
2. **Clarity**: Thông tin rõ ràng, dễ hiểu
3. **Efficiency**: Ít click, nhiều thông tin
4. **Feedback**: Luôn có thông báo kết quả
5. **Responsive**: Hoạt động tốt trên mọi màn hình

## Testing

Để test component này:

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload

# Start frontend
cd frontend
npm run dev

# Login as teacher
# Navigate to /teacher-dashboard
# Click "Khóa học" in sidebar
```

## Future Enhancements

- [ ] Drag & drop để sắp xếp units
- [ ] Preview khóa học (student view)
- [ ] Duplicate course
- [ ] Course templates
- [ ] Bulk import units from file
- [ ] AI-generated course content
- [ ] Student enrollment stats
- [ ] Course completion analytics

