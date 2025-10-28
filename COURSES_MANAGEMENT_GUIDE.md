# 📚 Hướng dẫn Hệ thống Quản lý Khóa học

## 🎯 Tổng quan

Hệ thống quản lý khóa học đầy đủ cho Teacher Dashboard với giao diện hiện đại, chuyên nghiệp và dễ sử dụng.

## ✨ Tính năng đã hoàn thành

### 1. Tạo Khóa học Mới
- ✅ Chọn kỹ năng: Listening, Speaking, Reading, Writing
- ✅ Chọn cấp độ: Beginner → Advanced (5 levels)
- ✅ Chọn khối lớp: Lớp 1 → Lớp 12
- ✅ Nhập mô tả chi tiết
- ✅ Thiết lập số bài học dự kiến
- ✅ Thiết lập thời lượng (giờ)
- ✅ Upload thumbnail/hình ảnh đại diện
- ✅ Preview ảnh trước khi upload

### 2. Xem & Lọc Khóa học
- ✅ Grid view đẹp mắt với cards
- ✅ Thống kê tổng hợp (4 stat cards)
- ✅ Tìm kiếm theo tên
- ✅ Lọc theo kỹ năng
- ✅ Lọc theo lớp
- ✅ Color coding theo skill
- ✅ Hiển thị emoji và icon sinh động

### 3. Chi tiết Khóa học
- ✅ Xem thông tin đầy đủ
- ✅ Danh sách bài học (units)
- ✅ Thống kê: kỹ năng, cấp độ, lớp, số bài học
- ✅ Nút action nhanh

### 4. Chỉnh sửa Khóa học
- ✅ Form đầy đủ với validation
- ✅ Cập nhật thông tin cơ bản
- ✅ Thay đổi thumbnail
- ✅ Modal UX mượt mà

### 5. Xóa Khóa học
- ✅ Confirmation modal
- ✅ Cảnh báo rõ ràng về hậu quả
- ✅ Hiển thị tên khóa học cần xóa

### 6. Quản lý Bài học (Units)
- ✅ Thêm unit/lesson mới
- ✅ Thiết lập tuần học
- ✅ Thiết lập số cúp tối đa
- ✅ Xem số câu hỏi trong mỗi unit
- ✅ Inline form add unit

### 7. Quản lý Câu hỏi
- ✅ Thêm câu hỏi theo kỹ năng
- ✅ Nhiều loại câu hỏi: MCQ, Fill-blank, Short, Essay, Prompt, Audio...
- ✅ Thiết lập điểm, thứ tự
- ✅ Upload media (audio/video) cho listening

## 🎨 Giao diện

### Design Highlights
- **Modern & Clean**: Thiết kế hiện đại, tối giản
- **Responsive**: Hoạt động mượt trên mọi màn hình
- **Animations**: Smooth transitions và hover effects
- **Color System**: Mã màu nhất quán theo kỹ năng
- **Icons**: Lucide React icons chuyên nghiệp

### Color Palette
- 🎧 **Listening**: Green (#10b981)
- 🗣️ **Speaking**: Purple (#8b5cf6)
- 📖 **Reading**: Blue (#3b82f6)
- ✍️ **Writing**: Orange (#f97316)

## 📁 Cấu trúc File

```
frontend/src/
├── pages/Teacher/CoursesManagement/
│   ├── CoursesManagement.jsx      # Component chính (800+ lines)
│   ├── CoursesManagement.css      # Styling đầy đủ (700+ lines)
│   ├── README.md                  # Hướng dẫn chi tiết
│   └── index.js                   # Export
│
├── services/
│   ├── api.js                     # API chung (đã có)
│   └── coursesAPI.js              # API riêng cho courses (NEW)
│
└── pages/Teacher/TeacherDashboardV3/
    └── TeacherDashboardV3.jsx     # Đã tích hợp CoursesManagement
```

## 🔌 API Integration

### Endpoints đã sẵn sàng (Frontend prepared)

```javascript
// Course CRUD
GET    /api/v1/courses                     // List with filters
GET    /api/v1/courses/:id                 // Get detail
POST   /api/v1/courses                     // Create
PUT    /api/v1/courses/:id                 // Update
DELETE /api/v1/courses/:id                 // Delete (TODO backend)

// Units Management
GET    /api/v1/courses/:id/units           // List units
POST   /api/v1/courses/:id/units           // Create unit
PUT    /api/v1/courses/:id/units/:unitId   // Update (TODO backend)
DELETE /api/v1/courses/:id/units/:unitId   // Delete (TODO backend)

// Questions Management
GET    /api/v1/courses/units/:unitId/questions      // List
POST   /api/v1/courses/units/:unitId/questions      // Create
DELETE /api/v1/courses/units/:unitId/questions/:id  // Delete (TODO backend)

// File Upload
POST   /api/v1/courses/upload-thumbnail    // Upload (TODO backend)
```

### Data Flow
```
User Input → Frontend Validation → API Call → Backend Processing
↓
Success/Error Response → Update UI → Show Message
```

## 🚀 Hướng dẫn Sử dụng

### Bước 1: Truy cập
1. Đăng nhập với tài khoản **Teacher**
2. Vào **Teacher Dashboard** (`/teacher-dashboard`)
3. Click "**Khóa học**" trong sidebar

### Bước 2: Tạo khóa học
1. Click nút "**Tạo khóa học mới**"
2. Điền thông tin:
   - Tên khóa học (bắt buộc)
   - Kỹ năng (bắt buộc)
   - Cấp độ (bắt buộc)
   - Khối lớp (bắt buộc)
   - Mô tả (tùy chọn)
   - Số bài học dự kiến
   - Thời lượng
3. Upload thumbnail (tùy chọn)
4. Click "**Tạo khóa học**"

### Bước 3: Quản lý khóa học
- **Xem chi tiết**: Click icon 👁️
- **Chỉnh sửa**: Click icon ✏️
- **Xóa**: Click icon 🗑️

### Bước 4: Thêm bài học
1. Vào chi tiết khóa học
2. Click "**Thêm bài học**"
3. Nhập:
   - Tên bài học
   - Tuần học
   - Số cúp tối đa
4. Click "**Thêm**"

### Bước 5: Thêm câu hỏi
1. Click vào unit cần thêm câu hỏi
2. Chọn loại câu hỏi phù hợp với skill
3. Nhập nội dung câu hỏi
4. Thiết lập đáp án
5. Click "**Lưu câu hỏi**"

## 🔧 Backend TODO List

### Priority 1 (Critical)
- [ ] Thêm DELETE endpoint cho courses
- [ ] Thêm UPDATE/DELETE endpoints cho units
- [ ] Thêm DELETE endpoint cho questions

### Priority 2 (Important)
- [ ] Upload thumbnail endpoint
- [ ] Add `thumbnail_url` column to courses table
- [ ] Add `duration_hours` column to courses table
- [ ] File storage setup (local hoặc S3)

### Priority 3 (Nice to have)
- [ ] Pagination cho courses list
- [ ] Soft delete (thay vì hard delete)
- [ ] Course duplication
- [ ] Bulk operations
- [ ] Analytics endpoints

## 📊 Database Schema Updates (Suggested)

```sql
-- Courses table updates
ALTER TABLE courses 
ADD COLUMN thumbnail_url VARCHAR(500),
ADD COLUMN duration_hours INTEGER;

-- Indexes for performance
CREATE INDEX idx_courses_skill ON courses(skill);
CREATE INDEX idx_courses_grade ON courses(grade);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_units_course_id ON course_units(course_id);
CREATE INDEX idx_questions_unit_id ON course_questions(unit_id);
```

## 🎯 Question Types Reference

### Listening (🎧)
- `mcq-audio`: Multiple choice với file audio
- `dictation`: Nghe và viết lại

### Speaking (🗣️)
- `prompt`: Câu gợi ý để luyện nói (AI đánh giá)

### Reading (📖)
- `mcq`: Multiple choice text
- `fill-blank`: Điền từ vào chỗ trống
- `short`: Câu trả lời ngắn

### Writing (✍️)
- `essay`: Viết đoạn văn/bài luận (AI chấm)

## 💡 Best Practices

### Khi tạo khóa học
1. Đặt tên rõ ràng, dễ hiểu
2. Mô tả chi tiết nội dung và mục tiêu
3. Chọn đúng cấp độ phù hợp với lớp
4. Upload thumbnail chất lượng cao (recommended: 800x600px)

### Khi thêm bài học
1. Sắp xếp theo tuần học logic
2. Thiết lập số cúp hợp lý (2-5 cúp/bài)
3. Đặt tên unit có cấu trúc: "Unit 1 - Topic Name"

### Khi thêm câu hỏi
1. Chọn đúng loại câu hỏi cho skill
2. Viết câu hỏi rõ ràng, không gây nhầm lẫn
3. Thiết lập điểm dựa trên độ khó
4. Test audio/media trước khi thêm

## 🐛 Troubleshooting

### Không tải được danh sách khóa học
- Kiểm tra backend có running không
- Check console log cho error details
- Verify token authentication

### Upload thumbnail thất bại
- Kiểm tra file size < 2MB
- Chỉ chấp nhận: PNG, JPG, JPEG
- Backend upload endpoint cần được implement

### Không thể xóa khóa học
- Backend DELETE endpoint chưa ready
- Temporary: Có thể set `is_active = false` thay vì xóa

## 📝 Notes

- Frontend **đã hoàn thiện 100%** và sẵn sàng
- Tất cả API calls đã chuẩn bị sẵn
- Chỉ cần backend implement các endpoints còn thiếu
- UI/UX đã tối ưu cho mobile và desktop
- Code đã clean, có comments rõ ràng

## 🎓 Demo Data

Để test, bạn có thể tạo các khóa học mẫu:

1. **Speaking Cơ Bản Lớp 10**
   - Skill: Speaking
   - Level: Intermediate
   - Grade: 10

2. **Reading Nâng Cao Lớp 12**
   - Skill: Reading
   - Level: Upper-Intermediate
   - Grade: 12

3. **Listening Cơ Bản Lớp 8**
   - Skill: Listening
   - Level: Elementary
   - Grade: 8

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
1. Check README.md trong folder CoursesManagement
2. Review console logs
3. Verify API endpoints
4. Check network tab trong DevTools

## 🌟 Features Comparison

| Feature | Frontend | Backend |
|---------|----------|---------|
| List Courses | ✅ Done | ✅ Done |
| Create Course | ✅ Done | ✅ Done |
| Update Course | ✅ Done | ✅ Done |
| Delete Course | ✅ Done | ⏳ TODO |
| Upload Thumbnail | ✅ Done | ⏳ TODO |
| List Units | ✅ Done | ✅ Done |
| Create Unit | ✅ Done | ✅ Done |
| Update Unit | ✅ Done | ⏳ TODO |
| Delete Unit | ✅ Done | ⏳ TODO |
| List Questions | ✅ Done | ✅ Done |
| Create Question | ✅ Done | ✅ Done |
| Delete Question | ✅ Done | ⏳ TODO |

---

**Tóm lại**: Frontend đã 100% sẵn sàng. Backend chỉ cần implement thêm một số endpoints DELETE và upload file là có thể hoạt động đầy đủ! 🚀

