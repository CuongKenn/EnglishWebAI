# Teacher Dashboard - Hướng dẫn sử dụng

## Tổng quan

Teacher Dashboard mới được xây dựng với giao diện hiện đại, tối ưu và đầy đủ tính năng cho giáo viên quản lý lớp học và hoạt động giảng dạy.

## Cấu trúc thư mục

```
frontend/src/pages/Teacher/
├── TeacherDashboard/
│   ├── TeacherDashboardNew.jsx      # Layout chính với sidebar
│   └── TeacherDashboardNew.css
├── TeacherOverview/
│   ├── TeacherOverview.jsx          # Trang tổng quan
│   └── TeacherOverview.css
├── ClassManagement/
│   ├── ClassManagement.jsx          # Quản lý lớp học
│   └── ClassManagement.css
├── MaterialsManagement/
│   ├── MaterialsManagement.jsx      # Quản lý học liệu
│   └── MaterialsManagement.css
├── QuestionBank/
│   ├── QuestionBank.jsx             # Ngân hàng câu hỏi
│   └── QuestionBank.css
├── AssignmentsTests/
│   ├── AssignmentsTests.jsx         # Bài tập & Kiểm tra
│   └── AssignmentsTests.css
├── GradingFeedback/
│   ├── GradingFeedback.jsx          # Chấm điểm & Phản hồi
│   └── GradingFeedback.css
├── StatisticsReports/
│   ├── StatisticsReports.jsx        # Thống kê & Báo cáo
│   └── StatisticsReports.css
└── OnlineTeaching/
    ├── OnlineTeaching.jsx           # Dạy học trực tuyến
    └── OnlineTeaching.css
```

## 7 Tính năng chính

### 1. 📊 Dashboard (Tổng quan)
- Thống kê tổng quan: Số lớp, học sinh, bài chờ chấm, bài kiểm tra sắp tới
- Lịch học sắp tới
- Hoạt động gần đây
- Thao tác nhanh
- Biểu đồ hiệu suất giảng dạy

### 2. 🏫 Quản lý lớp học
- Hiển thị danh sách lớp học dạng grid card
- Xem danh sách học sinh
- Điểm danh trực tuyến
- Quản lý lịch học
- Tìm kiếm và lọc theo môn học

### 3. 📚 Quản lý học liệu
- Tạo và quản lý tài liệu học tập
- Hỗ trợ nhiều loại: File, Link, Video, Text
- Upload file
- Phân loại theo lớp học
- Tìm kiếm và lọc

### 4. 💭 Ngân hàng câu hỏi
- Quản lý kho câu hỏi cá nhân
- Nhiều loại câu hỏi: Trắc nghiệm, Tự luận, Trả lời ngắn, Đúng/Sai
- Phân loại theo độ khó (Dễ, TB, Khó)
- Gắn tags cho dễ tìm kiếm
- Import/Export câu hỏi

### 5. 📝 Giao bài tập & Kiểm tra
- Tạo bài tập và bài kiểm tra
- Thiết lập thời gian, điểm số
- Theo dõi tỷ lệ nộp bài
- Cho phép/không cho phép nộp muộn
- Hướng dẫn chi tiết cho học sinh

### 6. ✅ Chấm điểm & Phản hồi
- Xem danh sách bài nộp
- Chấm điểm nhanh
- Viết phản hồi chi tiết
- Mẫu phản hồi nhanh
- Theo dõi tiến độ chấm bài
- Thống kê điểm trung bình

### 7. 📈 Thống kê & Báo cáo
- Biểu đồ điểm trung bình
- Tỷ lệ điểm danh theo lớp
- Phân bố điểm số
- Top học sinh xuất sắc
- Danh sách học sinh cần quan tâm
- Xuất báo cáo

### 8. 💻 Dạy học trực tuyến (Bonus)
- Lên lịch buổi học online
- Tích hợp Zoom, Google Meet, Teams
- Bắt đầu buổi học ngay lập tức
- Quản lý bản ghi video
- Gửi thông báo tự động

## Thiết kế giao diện

### Màu sắc chủ đạo
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple gradient)
- **Background**: Dark theme với gradient
- **Cards**: Glass morphism effect với backdrop blur
- **Accent Colors**:
  - Blue: `#3498db` (Thông tin)
  - Green: `#2ecc71` (Thành công)
  - Orange: `#f39c12` (Cảnh báo)
  - Red: `#e74c3c` (Nguy hiểm)
  - Purple: `#9b59b6` (Phụ)

### Đặc điểm UI/UX
- **Responsive**: Tối ưu cho desktop, tablet và mobile
- **Modern**: Glass morphism, gradient, shadows
- **Smooth animations**: Hover effects, transitions
- **Accessibility**: High contrast, clear typography
- **Sidebar**: Collapsible, icon-only mode
- **Cards**: Hover effects, informative badges

## Tích hợp Backend

### API Endpoints cần thiết

```javascript
// Classes
GET    /api/v1/classes/teaching          // Lấy danh sách lớp dạy
GET    /api/v1/classes/:id/students      // Lấy danh sách học sinh
POST   /api/v1/classes/:id/students      // Thêm học sinh
GET    /api/v1/classes/:id/attendance    // Lấy điểm danh
POST   /api/v1/classes/:id/attendance    // Lưu điểm danh

// Materials
GET    /api/v1/materials                 // Lấy danh sách học liệu
POST   /api/v1/materials                 // Tạo học liệu mới
PUT    /api/v1/materials/:id             // Cập nhật học liệu
DELETE /api/v1/materials/:id             // Xóa học liệu

// Questions (Backend cần tạo mới)
GET    /api/v1/questions                 // Lấy ngân hàng câu hỏi
POST   /api/v1/questions                 // Tạo câu hỏi mới
PUT    /api/v1/questions/:id             // Cập nhật câu hỏi
DELETE /api/v1/questions/:id             // Xóa câu hỏi

// Assignments
GET    /api/v1/assignments               // Lấy danh sách bài tập
POST   /api/v1/assignments               // Tạo bài tập mới
PUT    /api/v1/assignments/:id           // Cập nhật bài tập
DELETE /api/v1/assignments/:id           // Xóa bài tập

// Submissions
GET    /api/v1/submissions               // Lấy danh sách bài nộp
GET    /api/v1/submissions/:id           // Chi tiết bài nộp
PUT    /api/v1/submissions/:id/grade     // Chấm điểm

// Statistics (Backend cần tạo mới)
GET    /api/v1/teachers/statistics       // Thống kê chung
GET    /api/v1/classes/:id/statistics    // Thống kê theo lớp

// Online Teaching (Backend cần tạo mới)
GET    /api/v1/meetings                  // Danh sách buổi học
POST   /api/v1/meetings                  // Tạo buổi học
PUT    /api/v1/meetings/:id              // Cập nhật buổi học
DELETE /api/v1/meetings/:id              // Xóa buổi học
```

### Models cần thêm

```python
# models/question.py
class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    question_text = Column(Text, nullable=False)
    question_type = Column(String)  # multiple_choice, short_answer, essay, true_false
    subject = Column(String)
    grade_level = Column(String)
    difficulty = Column(String)  # easy, medium, hard
    points = Column(Integer, default=1)
    options = Column(JSON)  # For multiple choice
    correct_answer = Column(String)
    explanation = Column(Text)
    tags = Column(String)
    created_at = Column(DateTime)

# models/meeting.py
class Meeting(Base):
    __tablename__ = "meetings"
    
    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    title = Column(String, nullable=False)
    platform = Column(String)  # zoom, meet, teams
    meeting_url = Column(String)
    date = Column(Date)
    time = Column(Time)
    duration = Column(Integer)  # minutes
    status = Column(String)  # scheduled, completed, cancelled
    recording_url = Column(String)
    created_at = Column(DateTime)
```

## Routes

### URL Structure
```
/teacher-dashboard/                      → TeacherOverview
/teacher-dashboard/overview              → TeacherOverview
/teacher-dashboard/classes               → ClassManagement
/teacher-dashboard/materials             → MaterialsManagement
/teacher-dashboard/question-bank         → QuestionBank
/teacher-dashboard/assignments           → AssignmentsTests
/teacher-dashboard/grading               → GradingFeedback
/teacher-dashboard/statistics            → StatisticsReports
/teacher-dashboard/online-teaching       → OnlineTeaching
```

### Navigation old → new
```
/teacher-dashboard-old     → Dashboard cũ (legacy)
/teacher-dashboard         → Dashboard mới (recommended)
```

## Cách sử dụng

### 1. Đăng nhập với tài khoản teacher
```javascript
// Hệ thống tự động redirect đến /teacher-dashboard
```

### 2. Điều hướng
- Sử dụng sidebar bên trái để di chuyển giữa các trang
- Click icon ← / → để thu gọn/mở rộng sidebar
- Tất cả tính năng đều accessible từ sidebar

### 3. Mock data
- Hiện tại hầu hết các trang đang sử dụng mock data
- Cần integrate với backend API để có data thật
- Mock data được define ngay trong component để dễ test

## Tối ưu hóa

### Performance
- Lazy loading cho các trang
- Debounce cho search inputs
- Pagination cho danh sách dài
- Caching với React Query (recommended)

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- High contrast colors

### SEO
- Page titles
- Meta descriptions
- Structured data

## Deployment

### Build
```bash
cd EnglishWebAI/frontend
npm install
npm run build
```

### Environment Variables
```env
VITE_API_URL=http://localhost:8000
VITE_ZOOM_API_KEY=your_zoom_api_key
VITE_GOOGLE_MEET_CLIENT_ID=your_meet_client_id
```

## Troubleshooting

### Sidebar không hiển thị đúng
- Check CSS import
- Verify responsive breakpoints
- Clear browser cache

### API calls failing
- Check CORS settings
- Verify authentication token
- Check API endpoint URLs

### Styles not loading
- Verify CSS file imports
- Check build output
- Clear cache

## Future Enhancements

1. **Real-time updates** với WebSocket
2. **Notification system** cho events
3. **Advanced analytics** với charts library
4. **Export reports** (PDF, Excel)
5. **Mobile app** với React Native
6. **AI-powered** grading suggestions
7. **Gamification** cho học sinh
8. **Video conferencing** tích hợp trực tiếp

## Credits

Developed by: AI Assistant
Design: Modern Glass Morphism + Purple Gradient
Framework: React + React Router
Styling: Pure CSS with CSS Variables

---

**Note**: Dashboard này được thiết kế để dễ dàng mở rộng. Backend team có thể tham khảo file này để implement các API endpoints cần thiết.

