# Hướng dẫn sử dụng Teacher Dashboard V2

## Giới thiệu

Teacher Dashboard V2 là phiên bản cải tiến của hệ thống quản lý dành cho giáo viên, được thiết kế với giao diện hiện đại, logic rõ ràng và tích hợp đầy đủ với backend.

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd frontend
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-label @radix-ui/react-switch
```

### 2. Cập nhật routing (nếu cần)

Thêm route mới vào file routing của bạn:

```javascript
import TeacherDashboardV2 from './pages/Teacher/TeacherDashboardV2';

<Route path="/teacher/dashboard-v2" element={<TeacherDashboardV2 />} />
```

## Cấu trúc và chức năng

### 1. Dashboard Overview (Tổng quan)
**Mục đích**: Cung cấp cái nhìn tổng quan về hoạt động giảng dạy

**Tính năng**:
- Thống kê số lượng lớp, học sinh, bài kiểm tra
- Hoạt động gần đây
- Bài kiểm tra sắp tới

### 2. Class Management (Quản lý lớp học) ✅ 
**Mục đích**: Quản lý lớp học và học sinh

**Tính năng**:
- Hiển thị danh sách lớp giáo viên phụ trách
- Xem danh sách học sinh trong lớp
- Thêm học sinh (username/email/id)
- Thống kê sĩ số và tiến độ

**API đã tích hợp**:
- `GET /api/v1/classes/teaching`
- `GET /api/v1/classes/{class_id}/students`
- `POST /api/v1/classes/{class_id}/students`

### 3. Lesson Management (Quản lý bài học) ✅
**Mục đích**: Tạo và quản lý nội dung bài học

**Tính năng**:
- Tạo bài học mới cho lớp
- Sửa/xóa bài học
- Quản lý nội dung chi tiết

**Kết nối với Students**: 
- Bài học tạo ra sẽ hiển thị trong phần "Học bài" của học sinh
- Students có thể xem và học từng lesson

**API đã tích hợp**:
- `GET /api/v1/classes/{class_id}/lessons`
- `POST /api/v1/classes/{class_id}/lessons`
- `PUT /api/v1/classes/{class_id}/lessons/{lesson_id}`
- `DELETE /api/v1/classes/{class_id}/lessons/{lesson_id}`

### 4. Question Bank (Ngân hàng câu hỏi) ✅
**Mục đích**: Quản lý câu hỏi và tích hợp với AI Practice

**Tính năng**:
- Quản lý câu hỏi theo 6 kỹ năng:
  - 🎧 Listening (Nghe)
  - 🎤 Speaking (Nói)
  - 📖 Reading (Đọc)
  - ✍️ Writing (Viết)
  - 📝 Grammar (Ngữ pháp)
  - 🧠 Vocabulary (Từ vựng)
- Lọc theo độ khó: Dễ, Trung bình, Khó
- Tạo câu hỏi bằng AI

**Kết nối với AI Practice**:
```
Question Bank (Teacher tạo)
    ↓
Câu hỏi được lưu theo skill
    ↓
AI Practice module sử dụng câu hỏi để:
  - Luyện Reading AI
  - Luyện Listening AI
  - Luyện Writing AI
  - Luyện Speaking AI
  - Luyện Grammar
  - Luyện Vocabulary
```

### 5. Exercises & Tests (Bài tập & Kiểm tra)
**Mục đích**: Tạo và quản lý bài kiểm tra

**Tính năng**:
- Tạo bài tập về nhà
- Tạo kiểm tra 15 phút, giữa kỳ, cuối kỳ
- Tạo đề tự động bằng AI
- Theo dõi tiến độ hoàn thành

### 6. Grading & Feedback (Chấm điểm & Phản hồi)
**Mục đích**: Chấm bài và gửi phản hồi

**Tính năng**:
- Xem bài nộp chờ chấm
- Chấm điểm thủ công
- Chấm tự động bằng AI (gợi ý)
- Gửi phản hồi cho học sinh

### 7. Materials Management (Quản lý học liệu)
**Mục đích**: Quản lý tài liệu giảng dạy

**Tính năng**:
- Upload tài liệu (PDF, DOC, PPT)
- Upload video, audio
- Phân loại theo lớp học

### 8. Statistics & Reports (Thống kê & Báo cáo)
**Mục đích**: Phân tích kết quả học tập

**Tính năng**:
- Thống kê điểm số
- Biểu đồ tiến độ
- Xuất báo cáo

## Luồng dữ liệu giữa các Role

### Teacher → Student (Giáo viên → Học sinh)

#### 1. Lessons (Bài học)
```
Teacher: Tạo lesson "Unit 1 - Greetings"
    ↓
Backend: Lưu vào database
    ↓
Student: Xem lesson trong "Học bài"
    ↓
Student: Học và hoàn thành lesson
    ↓
Teacher: Xem thống kê tiến độ
```

#### 2. Question Bank → AI Practice
```
Teacher: Tạo 20 câu hỏi Reading (medium)
    ↓
Backend: Lưu vào question_bank
    ↓
AI Practice: Lấy câu hỏi từ question_bank
    ↓
Student: Luyện tập Reading AI
    ↓
AI: Đánh giá và cho điểm tự động
    ↓
Teacher: Xem kết quả thống kê
```

#### 3. Exercises (Bài tập)
```
Teacher: Tạo bài tập "Unit 1 Test"
    ↓
Backend: Gán cho lớp 10A1
    ↓
Student: Nhận thông báo bài tập mới
    ↓
Student: Làm và nộp bài
    ↓
Teacher: Chấm điểm & feedback
    ↓
Student: Xem điểm và nhận xét
```

### Teacher → Parent (Giáo viên → Phụ huynh)

```
Teacher: Cập nhật điểm, attendance
    ↓
System: Gửi thông báo cho Parent
    ↓
Parent: Xem tiến độ học tập của con
    ↓
Parent: Nhắn tin với giáo viên (nếu có thắc mắc)
```

## Hướng dẫn sử dụng từng chức năng

### Quản lý lớp học

1. **Xem danh sách lớp**:
   - Vào "Quản lý lớp học"
   - Hệ thống tự động load các lớp giáo viên phụ trách
   - Xem thống kê sĩ số, tiến độ

2. **Xem học sinh**:
   - Click nút "Học sinh" trên card lớp
   - Xem danh sách học sinh trong modal

3. **Thêm học sinh**:
   - Click nút "Thêm HS"
   - Chọn kiểu định danh (username/email/id)
   - Nhập danh sách (phân tách bằng dấu phẩy hoặc xuống dòng)
   - Click "Thêm học sinh"

### Quản lý bài học

1. **Tạo bài học**:
   - Vào "Quản lý bài học"
   - Chọn lớp
   - Click "Tạo bài học mới"
   - Điền tiêu đề và nội dung
   - Click "Tạo bài học"

2. **Sửa bài học**:
   - Click nút "Sửa" trên card bài học
   - Chỉnh sửa thông tin
   - Click "Lưu thay đổi"

3. **Xóa bài học**:
   - Click nút "Xóa"
   - Xác nhận xóa

### Ngân hàng câu hỏi

1. **Lọc câu hỏi**:
   - Click vào tab kỹ năng (Nghe, Nói, Đọc, Viết, etc.)
   - Chọn độ khó từ dropdown
   - Dùng search box để tìm kiếm

2. **Thêm câu hỏi**:
   - Click "Thêm câu hỏi"
   - Chọn kỹ năng, loại câu hỏi, độ khó
   - Nhập nội dung và đáp án
   - Click "Lưu câu hỏi"

3. **Tạo câu hỏi bằng AI**:
   - Click "AI Generate"
   - Xem hướng dẫn về tích hợp AI
   - Click "Bắt đầu tạo"

## Mở rộng và Tùy chỉnh

### Thêm API endpoint mới

```javascript
// Trong component
const loadData = async () => {
  try {
    const res = await apiClient.get('/api/v1/your-endpoint');
    setData(res.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Thêm chức năng mới

1. Tạo component mới trong `components/`
2. Import vào `TeacherDashboardV2.jsx`
3. Thêm vào menu sidebar
4. Thêm case trong `renderPage()`

### Tùy chỉnh giao diện

- Màu sắc: Sửa trong CSS files
- Typography: Sửa trong `index.css`
- Layout: Điều chỉnh grid columns trong CSS

## Troubleshooting

### Lỗi không load được dữ liệu
```
Kiểm tra:
1. Backend có đang chạy không? (http://localhost:8000)
2. API endpoint có đúng không?
3. Token authentication có hợp lệ không?
4. CORS có được cấu hình đúng không?
```

### Lỗi UI components không hiển thị
```
Kiểm tra:
1. Đã cài đặt @radix-ui packages chưa?
2. Import path có đúng không?
3. CSS có được load không?
```

## Best Practices

1. **Luôn validate input**: Kiểm tra dữ liệu trước khi gửi API
2. **Handle errors**: Hiển thị thông báo lỗi thân thiện
3. **Loading states**: Cho người dùng biết đang xử lý
4. **Confirm actions**: Xác nhận trước khi xóa
5. **Responsive**: Test trên nhiều kích thước màn hình

## Kết luận

Teacher Dashboard V2 cung cấp một hệ thống quản lý hoàn chỉnh với:
- ✅ Tích hợp backend đầy đủ
- ✅ Logic rõ ràng giữa các role
- ✅ Kết nối với AI Practice
- ✅ Giao diện hiện đại, dễ sử dụng
- ✅ Dễ dàng mở rộng

Hệ thống đã sẵn sàng để sử dụng và có thể được mở rộng thêm các tính năng trong tương lai.

