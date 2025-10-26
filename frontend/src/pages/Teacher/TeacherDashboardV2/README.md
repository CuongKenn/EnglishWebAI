# Teacher Dashboard V2 - English AI Platform

## Tổng quan

Teacher Dashboard V2 là hệ thống quản lý dành cho giáo viên với giao diện hiện đại, dễ sử dụng và tích hợp đầy đủ với backend FastAPI.

## Cấu trúc

```
TeacherDashboardV2/
├── TeacherDashboardV2.jsx       # Main component
├── TeacherDashboardV2.css       # Main styles
├── components/                   # Các component con
│   ├── Sidebar.jsx              # Navigation sidebar
│   ├── DashboardOverview.jsx    # Tổng quan thống kê
│   ├── ClassManagement.jsx      # Quản lý lớp học (tích hợp API)
│   ├── LessonManagement.jsx     # Quản lý bài học (tích hợp API)
│   ├── QuestionBank.jsx         # Ngân hàng câu hỏi (tích hợp AI)
│   ├── ExercisesTests.jsx       # Bài tập & Kiểm tra
│   ├── GradingFeedback.jsx      # Chấm điểm & Phản hồi
│   ├── MaterialsManagement.jsx  # Quản lý học liệu
│   ├── StatisticsReports.jsx    # Thống kê & Báo cáo
│   ├── MessagesPage.jsx         # Tin nhắn
│   └── SettingsPage.jsx         # Cài đặt
└── README.md                     # Documentation
```

## Tính năng chính

### 1. Dashboard Overview
- Hiển thị thống kê tổng quan: Số lớp, học sinh, bài kiểm tra, câu hỏi
- Hoạt động gần đây
- Bài kiểm tra sắp tới
- **API**: `/api/v1/classes/teaching`

### 2. Class Management (Quản lý lớp học)
- ✅ **Tích hợp đầy đủ với backend**
- Hiển thị danh sách lớp học giáo viên phụ trách
- Xem danh sách học sinh trong lớp
- Thêm học sinh vào lớp (username/email/id)
- Thống kê sĩ số, tiến độ hoàn thành
- **API endpoints**:
  - `GET /api/v1/classes/teaching` - Lấy danh sách lớp
  - `GET /api/v1/classes/{class_id}/students` - Lấy danh sách học sinh
  - `POST /api/v1/classes/{class_id}/students` - Thêm học sinh

### 3. Lesson Management (Quản lý bài học)
- ✅ **Tích hợp đầy đủ với backend**
- Tạo, sửa, xóa bài học cho từng lớp
- Quản lý nội dung bài học
- Sắp xếp thứ tự bài học
- **API endpoints**:
  - `GET /api/v1/classes/{class_id}/lessons` - Lấy danh sách bài học
  - `POST /api/v1/classes/{class_id}/lessons` - Tạo bài học
  - `PUT /api/v1/classes/{class_id}/lessons/{lesson_id}` - Cập nhật
  - `DELETE /api/v1/classes/{class_id}/lessons/{lesson_id}` - Xóa

### 4. Question Bank (Ngân hàng câu hỏi)
- ✅ **Tích hợp với AI Practice**
- Quản lý câu hỏi theo 6 kỹ năng:
  - Listening (Nghe)
  - Speaking (Nói)
  - Reading (Đọc)
  - Writing (Viết)
  - Grammar (Ngữ pháp)
  - Vocabulary (Từ vựng)
- Lọc theo độ khó: Easy, Medium, Hard
- Tích hợp AI để tự động tạo câu hỏi
- **Kết nối AI Practice**: Câu hỏi từ ngân hàng sẽ được sử dụng trong module AI Practice

### 5. Exercises & Tests (Bài tập & Kiểm tra)
- Quản lý bài tập về nhà, kiểm tra 15 phút, giữa kỳ, cuối kỳ
- Tạo đề tự động bằng AI
- Theo dõi tiến độ hoàn thành
- Xuất bản/Lưu nháp

### 6. Grading & Feedback (Chấm điểm & Phản hồi)
- Danh sách bài nộp chờ chấm
- Chấm điểm thủ công
- Gợi ý chấm tự động bằng AI
- Gửi phản hồi cho học sinh

### 7. Materials Management (Quản lý học liệu)
- Upload tài liệu (PDF, DOC, PPT)
- Upload video bài giảng
- Upload audio files
- Quản lý file theo lớp học

### 8. Statistics & Reports (Thống kê & Báo cáo)
- Thống kê điểm số, tiến độ học tập
- Biểu đồ phân tích
- Xuất báo cáo

## Tích hợp Backend

### API Client Setup
```javascript
import apiClient from '../../../../services/api';
```

### Example API Calls

**Load Classes:**
```javascript
const res = await apiClient.get('/api/v1/classes/teaching');
```

**Load Students:**
```javascript
const res = await apiClient.get(`/api/v1/classes/${classId}/students`);
```

**Add Students:**
```javascript
await apiClient.post(`/api/v1/classes/${classId}/students`, {
  identifiers: ['student1', 'student2'],
  idType: 'username',
  role: 'student',
  status: 'active'
});
```

**Manage Lessons:**
```javascript
// Create
await apiClient.post(`/api/v1/classes/${classId}/lessons`, {
  title: 'Unit 1',
  content: 'Lesson content...'
});

// Update
await apiClient.put(`/api/v1/classes/${classId}/lessons/${lessonId}`, {
  title: 'Updated title',
  content: 'Updated content'
});

// Delete
await apiClient.delete(`/api/v1/classes/${classId}/lessons/${lessonId}`);
```

## Liên kết giữa các Role

### Student (Học sinh)
- Xem danh sách lớp đã tham gia
- Học bài qua Lessons
- Làm bài tập từ Exercises
- Luyện tập qua Question Bank → **AI Practice**
- Xem điểm và phản hồi từ giáo viên

### Parent (Phụ huynh)
- Xem tiến độ học tập của con
- Xem điểm số và báo cáo
- Nhắn tin với giáo viên

### Teacher (Giáo viên)
- Quản lý lớp học và học sinh
- Tạo bài học (Lessons) → **Students học**
- Tạo câu hỏi (Question Bank) → **AI Practice sử dụng**
- Tạo bài tập (Exercises) → **Students làm**
- Chấm điểm và phản hồi

### Admin
- Quản lý tất cả giáo viên, học sinh
- Tạo lớp học và phân công giáo viên
- Xem báo cáo toàn hệ thống

## Data Flow

### Khóa học → Lessons → AI Practice
```
Teacher tạo Lessons
    ↓
Lessons được lưu vào database
    ↓
Students xem và học Lessons
    ↓
AI Practice sử dụng nội dung từ Lessons để tạo bài tập
```

### Question Bank → AI Practice
```
Teacher tạo Questions (hoặc AI tự động tạo)
    ↓
Questions được phân loại theo skill (Listening, Speaking, Reading, Writing, Grammar, Vocabulary)
    ↓
AI Practice module sử dụng Questions để:
  - Luyện Reading
  - Luyện Listening
  - Luyện Writing
  - Luyện Speaking
  - Luyện Grammar
  - Luyện Vocabulary
```

## UI Components

Sử dụng components từ `frontend/src/components/ui/`:
- `Card` - Container cho nội dung
- `Button` - Nút bấm
- `Input` - Input field
- `Badge` - Nhãn trạng thái
- `Progress` - Thanh tiến độ
- `Dialog` - Modal popup
- `Tabs` - Tab navigation
- `Table` - Bảng dữ liệu
- `Label` - Label cho form
- `Switch` - Toggle switch

## Styling

- Sử dụng CSS modules cho từng component
- Màu chủ đạo: Purple (#8b5cf6)
- Typography: Font system mặc định
- Responsive: Mobile-first approach

## TODO - Mở rộng

### Short-term
- [ ] Tích hợp API cho Exercises & Tests
- [ ] Tích hợp API cho Grading & Feedback
- [ ] Tích hợp API cho Materials Management
- [ ] Thêm biểu đồ thống kê (Recharts/Chart.js)
- [ ] Tích hợp WebSocket cho Messages

### Long-term
- [ ] Triển khai đầy đủ AI Question Generation
- [ ] Kết nối Question Bank với AI Practice modules
- [ ] Auto-grading system với AI
- [ ] Real-time notifications
- [ ] Export/Import Excel cho danh sách học sinh
- [ ] Bulk operations (thêm nhiều học sinh cùng lúc)

## Installation & Usage

### 1. Install dependencies (nếu chưa có)
```bash
cd frontend
npm install @radix-ui/react-dialog
npm install @radix-ui/react-tabs
npm install @radix-ui/react-label
npm install @radix-ui/react-switch
```

### 2. Import vào routing
```javascript
import TeacherDashboardV2 from './pages/Teacher/TeacherDashboardV2';

// In your routes
<Route path="/teacher/dashboard-v2" element={<TeacherDashboardV2 />} />
```

### 3. Sử dụng
Navigate to `/teacher/dashboard-v2` để sử dụng dashboard mới.

## Best Practices

1. **Error Handling**: Luôn wrap API calls trong try-catch
2. **Loading States**: Hiển thị loading khi fetch data
3. **Empty States**: Hiển thị thông báo khi không có data
4. **Validation**: Validate form input trước khi submit
5. **Confirmation**: Xác nhận trước khi xóa
6. **Feedback**: Hiển thị thông báo sau khi thực hiện action

## Support

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team phát triển.

