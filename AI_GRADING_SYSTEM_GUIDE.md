# Hướng dẫn Hệ thống AI Grading & Class Management

## Tổng quan
Hệ thống đã được cập nhật với các tính năng AI grading, quản lý lớp học nâng cao, và phân tích tiến độ học sinh.

## Các tính năng mới

### 1. LỚP HỌC CỦA TÔI (My Classes)

#### Dành cho Học sinh (`/my-classes`)
- **Xem danh sách lớp học**: Hiển thị các lớp mà giáo viên đã thêm học sinh vào
- **Bài giảng theo buổi**: Xem lại PowerPoint và tài liệu các buổi học
- **Bài tập về nhà**: Truy cập và làm bài tập được giao
- **Danh sách lớp**: Xem thông tin giáo viên và các bạn cùng lớp

**Giao diện**: 
- Sidebar hiển thị danh sách lớp
- Tabs: Tổng quan, Bài giảng, Bài tập
- Design tham khảo từ AI Practice (gradient, modern UI)

#### Dành cho Giáo viên (Teacher Dashboard > Lớp học của tôi)
- **Quản lý lớp**: Xem danh sách lớp mình phụ trách
- **Upload tài liệu**: Upload PowerPoint, PDF, Video cho từng buổi học
- **Tạo bài kiểm tra**: Tạo bài tập/kiểm tra từ dashboard
- **Quản lý học sinh**: Xem danh sách, theo dõi tiến độ

### 2. TRUNG TÂM BÀI TẬP (Exercise Hub) - Học sinh (`/exercise-hub`)

**3 Tab chính**:

#### Tab 1: Bài tập
- Danh sách tất cả bài tập chưa làm
- Trạng thái: Chưa làm, Quá hạn, Đã nộp
- Thông tin: Hạn nộp, điểm tối đa, lớp học

#### Tab 2: Bài kiểm tra
- Danh sách bài kiểm tra (quiz/test)
- Tương tự bài tập nhưng riêng biệt để dễ theo dõi

#### Tab 3: Xem điểm & Tiến độ
- **Thống kê tổng quan**: Tổng bài tập, đã hoàn thành, điểm trung bình
- **Bảng điểm chi tiết**: Danh sách điểm từng bài
- **Nhận xét giáo viên**: Feedback cho từng bài
- **Biểu đồ tiến độ**: 
  - Progress bar tỷ lệ hoàn thành
  - Điểm trung bình theo thời gian

### 3. TEACHER DASHBOARD - Tính năng AI

#### a) AI Chấm điểm (AI Grading)
**Luồng xử lý**:
1. Học sinh nộp bài → Trạng thái "Chờ AI chấm"
2. Giáo viên chọn "Chấm bằng AI" → AI phân tích và cho điểm
3. Giáo viên xem kết quả AI:
   - Điểm AI đề xuất
   - Nhận xét chi tiết
   - Phân tích lỗi (grammar, spelling, structure)
   - Rubrics scores (Reading, Writing, Listening, Speaking)
4. Giáo viên chỉnh sửa feedback và điểm (nếu cần)
5. Phê duyệt và gửi cho học sinh

**Thống kê**:
- Số bài chờ AI chấm
- Số bài AI đã chấm
- Số bài đã phê duyệt
- Tổng bài nộp

#### b) Trợ lý soạn phiếu học tập (Worksheet Generator)
**Input**:
- Tuần học (1-36)
- Kỹ năng (Reading, Writing, Listening, Speaking)
- Lớp (6-12)
- Chủ đề (Unit)
- Độ khó
- Số câu hỏi

**Output**:
- Phiếu học tập với rubrics chấm điểm
- Câu hỏi tự động sinh theo chương trình
- Hướng dẫn chi tiết cho từng kỹ năng

#### c) Phân tích tiến độ (Student Analytics)
**Hiển thị cho mỗi học sinh**:
- Điểm trung bình tổng
- Tổng bài nộp / Đã chấm
- Xu hướng: Tiến bộ / Ổn định / Cần cải thiện (icon trending)
- Điểm từng kỹ năng (Reading, Writing, Listening, Speaking)
- Biểu đồ progress theo thời gian

#### d) Nhóm cần hỗ trợ (Support Groups)
**Tự động xác định**:
- Học sinh có điểm TB < ngưỡng (mặc định 60)
- Ưu tiên: Cao (< 40 điểm) / Trung bình (40-60 điểm)
- Kỹ năng yếu cụ thể
- Đề xuất hỗ trợ

**Thống kê**:
- Tổng học sinh
- Số học sinh cần hỗ trợ
- Tỷ lệ %

**Hành động**:
- Xem chi tiết tiến độ
- Lên kế hoạch hỗ trợ
- Liên hệ phụ huynh

#### e) Xuất báo cáo (Export Reports)
**Định dạng**:
- **JSON**: Dữ liệu raw để xử lý tự động
- **PDF**: Báo cáo đẹp để in ấn, họp phụ huynh
- **Excel**: Bảng tính để phân tích, nhập vào phần mềm khác

**Nội dung**:
- Tổng quan lớp học
- Điểm trung bình từng học sinh
- Điểm theo kỹ năng
- Xu hướng tiến độ
- Danh sách học sinh cần hỗ trợ
- Thời gian tạo báo cáo

### 4. CẤU TRÚC DATABASE MỚI

#### Bảng `exercises` (đã mở rộng)
```sql
- skill_type: reading | writing | listening | speaking | mixed
- enable_ai_grading: boolean
- rubrics: JSON (tiêu chí chấm điểm)
- content: JSON (nội dung bài tập)
- max_score: Float (thay vì Integer)
```

#### Bảng `exercise_submissions` (đã mở rộng)
```sql
- ai_feedback: Text (nhận xét của AI)
- ai_score: Float (điểm AI đề xuất)
- rubrics_scores: JSON (điểm chi tiết từng kỹ năng)
- error_analysis: JSON (phân tích lỗi)
- ai_graded_at: DateTime
- status: submitted | graded | late | pending_review
```

#### Bảng `lessons` (đã mở rộng)
```sql
- session_number: Integer (buổi học thứ mấy)
- lesson_date: Date (ngày học)
```

## API ENDPOINTS

### Teacher APIs (`/api/v1/teacher`)

#### Grading & Submissions
```
GET    /classes/{class_id}/submissions           - Lấy danh sách bài nộp
POST   /submissions/{id}/ai-grade                - Lưu kết quả AI grading
PUT    /submissions/{id}/feedback                - Cập nhật feedback
```

#### Analytics
```
GET    /classes/{class_id}/analytics/students              - Phân tích học sinh
GET    /classes/{class_id}/analytics/students-need-support - Nhóm cần hỗ trợ
GET    /classes/{class_id}/analytics/overview              - Tổng quan lớp
```

#### Worksheet & Reports
```
POST   /classes/{class_id}/generate-worksheet              - Tạo phiếu học tập
GET    /classes/{class_id}/export/progress-report          - Xuất báo cáo
```

### Student APIs (`/api/v1`)

#### My Classes
```
GET    /classes/my-classes                 - Lớp học của tôi
GET    /classes/{id}/lessons               - Bài giảng
GET    /classes/{id}/exercises             - Bài tập
GET    /classes/{id}/materials             - Tài liệu
```

#### Exercises
```
GET    /exercises                          - Danh sách bài tập
GET    /exercises/{id}                     - Chi tiết bài tập
POST   /exercises/{id}/submit              - Nộp bài
GET    /exercises/statistics/summary       - Thống kê
```

## HƯỚNG DẪN SỬ DỤNG

### Setup Backend

1. **Chạy migration**:
```bash
cd backend
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

alembic upgrade head
```

2. **Khởi động server**:
```bash
python main.py
```

### Setup Frontend

1. **Cài dependencies** (nếu chưa):
```bash
cd frontend
npm install
```

2. **Chạy dev server**:
```bash
npm run dev
```

### Truy cập các trang

**Học sinh**:
- Lớp học của tôi: `http://localhost:5173/my-classes`
- Trung tâm bài tập: `http://localhost:5173/exercise-hub`

**Giáo viên**:
- Dashboard: `http://localhost:5173/teacher-dashboard-v3`
- Lớp học của tôi: Dashboard > Lớp học của tôi
- AI Grading: Dashboard > AI Chấm điểm
- Phân tích: Dashboard > Phân tích tiến độ
- Nhóm hỗ trợ: Dashboard > Nhóm cần hỗ trợ

## TÍCH HỢP AI (Chuẩn bị sẵn)

Các API đã được chuẩn bị để tích hợp với AI service:

### 1. AI Grading Service
```javascript
// File: frontend/src/services/aiGradingService.js (tạo sau)
const gradeSubmission = async (submission) => {
  // Call your AI API here
  const aiResponse = await fetch('YOUR_AI_ENDPOINT', {
    method: 'POST',
    body: JSON.stringify({
      content: submission.content_text,
      type: submission.exercise_type
    })
  });
  
  return {
    ai_score: aiResponse.score,
    ai_feedback: aiResponse.feedback,
    rubrics_scores: aiResponse.rubrics,
    error_analysis: aiResponse.errors
  };
};
```

### 2. Worksheet Generator AI
```javascript
// Tương tự, tích hợp với AI để tạo phiếu học tập
```

## LƯU Ý

1. **Database Migration**: Nhớ chạy migration trước khi sử dụng
2. **AI Integration**: Các placeholder AI đã sẵn sàng, chỉ cần kết nối API thật
3. **File Upload**: Cần cấu hình storage cho upload PowerPoint/PDF
4. **Permissions**: Đã có phân quyền Teacher/Student/Admin

## TROUBLESHOOTING

### Lỗi khi chạy migration
```bash
# Nếu gặp lỗi, thử:
alembic downgrade -1
alembic upgrade head
```

### Frontend không kết nối được backend
- Kiểm tra `.env` file có `VITE_API_BASE_URL=http://localhost:8000`
- Kiểm tra backend đang chạy

### CORS Error
- Đã cấu hình CORS trong `backend/main.py`, cho phép localhost:5173

## ROADMAP

- [ ] Tích hợp AI thực tế cho grading
- [ ] Tích hợp AI cho worksheet generator
- [ ] Upload file PowerPoint/Video
- [ ] Export PDF/Excel (hiện tại chỉ có JSON)
- [ ] Real-time notifications khi có feedback mới
- [ ] Mobile responsive optimization

## HỖ TRỢ

Nếu có vấn đề, kiểm tra:
1. Console log (F12) trên browser
2. Backend logs
3. Network tab để xem API calls

---

**Phiên bản**: 2.0  
**Ngày cập nhật**: 26/10/2025  
**Tác giả**: EnglishWebAI Development Team

