# Hướng dẫn Import Đề Thi Từ File Word

## Tổng quan

Hệ thống đã được tích hợp chức năng **import đề thi giữa kỳ/cuối kỳ** từ file Word (.docx, .doc). AI sẽ tự động phân tích nội dung đề thi, trích xuất hình ảnh và tạo đề thi tương tác cho học sinh làm bài trực tiếp trên web.

## Các Tính Năng Đã Thêm

### Backend

#### 1. Models (Database)
- **ExamAssessment**: Lưu trữ thông tin đề thi
  - Thông tin cơ bản: title, description, exam_type (midterm/final/quiz/practice)
  - File gốc: original_filename, file_path
  - Nội dung: content (JSON), answer_key, rubrics
  - Cài đặt: total_points, duration, start_time, end_time
  - Trạng thái: is_published, ai_parsed, is_active

- **ExamSubmission**: Lưu trữ bài làm của học sinh
  - Câu trả lời: answers (JSON)
  - Điểm số: score, ai_score, rubrics_scores
  - Phản hồi: feedback, ai_feedback, error_analysis
  - Trạng thái: in_progress, submitted, graded

#### 2. Services

**DocxService** (`backend/app/services/docx_service.py`):
- Đọc file Word và trích xuất nội dung
- Tách text, hình ảnh, bảng
- Lưu hình ảnh vào `media/exam_images/`
- Tạo prompt cho OpenAI để phân tích đề thi

**OpenAI Integration**:
- Phân tích cấu trúc đề thi (Listening, Reading, Writing, Speaking)
- Nhận diện loại câu hỏi (multiple_choice, matching, fill_blank, essay, etc.)
- Tạo JSON có cấu trúc để hiển thị tương tác trên web

#### 3. API Endpoints

**Teacher Endpoints** (`/api/v1/exams/`):
- `POST /upload` - Upload file Word và tạo đề thi
- `GET /classes/{class_id}` - Lấy danh sách đề thi của lớp
- `GET /{exam_id}` - Xem chi tiết đề thi
- `PUT /{exam_id}` - Cập nhật đề thi
- `DELETE /{exam_id}` - Xóa đề thi
- `GET /submissions/exam/{exam_id}` - Xem tất cả bài nộp
- `POST /submissions/{submission_id}/grade` - Chấm bài

**Student Endpoints**:
- `POST /submissions/start` - Bắt đầu làm bài
- `PUT /submissions/{submission_id}` - Lưu câu trả lời (auto-save)
- `POST /submissions/{submission_id}/submit` - Nộp bài
- `GET /submissions/my/{exam_id}` - Xem bài làm của mình

### Frontend

#### 1. Components

**ExamImportModal** (`frontend/src/components/ExamImportModal.jsx`):
- Modal upload file Word
- Chọn lớp học, loại đề thi
- Cài đặt thời gian làm bài
- Drag & drop file
- Upload progress indicator

**ExamViewer** (`frontend/src/components/ExamViewer.jsx`):
- Hiển thị đề thi cho học sinh
- Hỗ trợ nhiều loại câu hỏi:
  - Multiple choice (radio buttons)
  - Checkboxes (chọn nhiều đáp án)
  - Fill in the blank
  - Short answer
  - Essay
  - Matching (với hình ảnh)
- Timer đếm ngược
- Auto-save câu trả lời
- Auto-submit khi hết giờ

#### 2. Tích hợp vào Teacher Dashboard

- Nút **"Import từ Word"** trong `ExerciseManagementV2`
- Tích hợp vào phần Quản lý Bài tập & Kiểm tra hiện có
- Liệt kê đề thi cùng với exercises

#### 3. Services

**examService.js** (`frontend/src/services/examService.js`):
- API calls cho exam management
- Upload, create, update, delete exams
- Start, update, submit exam submissions
- Grade submissions

## Cách Sử Dụng

### Giáo Viên - Import Đề Thi

1. **Truy cập Teacher Dashboard** → Quản lý Bài tập & Kiểm tra

2. **Click nút "Import từ Word"**

3. **Upload file Word**:
   - Kéo thả hoặc click để chọn file .docx hoặc .doc
   - File nên có cấu trúc rõ ràng như mẫu đề đã cung cấp

4. **Cài đặt**:
   - Chọn lớp học
   - Chọn loại đề thi (Giữa kỳ / Cuối kỳ / Kiểm tra 15 phút / Luyện tập)
   - Tùy chọn: Công bố ngay hoặc để nháp
   - Tùy chọn: Đặt thời gian bắt đầu và kết thúc

5. **Click "Import & Tạo Đề Thi"**:
   - Hệ thống sẽ phân tích file bằng AI
   - Tạo đề thi tương tác
   - Hiển thị thông báo thành công

6. **Xem và chỉnh sửa** (nếu cần):
   - Đề thi xuất hiện trong danh sách
   - Click vào để xem chi tiết
   - Có thể chỉnh sửa sau khi import

### Học Sinh - Làm Bài Thi

1. **Vào lớp học** → Xem đề thi được công bố

2. **Click "Bắt đầu làm bài"**

3. **Làm bài**:
   - Đọc đề và làm từng phần
   - Hệ thống tự động lưu câu trả lời
   - Xem đồng hồ đếm ngược (nếu có giới hạn thời gian)

4. **Nộp bài**:
   - Click "Nộp bài" khi hoàn thành
   - Xác nhận nộp bài
   - Hệ thống tự động nộp khi hết giờ

5. **Xem kết quả**:
   - Chờ giáo viên chấm bài
   - Xem điểm số và nhận xét

## Cấu Trúc File Word Đề Thi

File Word cần có cấu trúc như sau:

```
I. LISTENING (2.5 points)
Task 1. Listen and match. There is one example.
[Hình ảnh nếu có]
0. Example
1. Question 1
2. Question 2

Task 2. Listen and tick A, B or C. There is one example.
Example: ...
A. [ ]  B. [✓]  C. [ ]

II. READING (2.5 points)
Task 1. Look and write the correct words.
...

III. WRITING (2.5 points)
Task 1. Look at the pictures. Read and write one word for each gap.
...

IV. SPEAKING (2.5 points)
...
```

## Lưu ý Kỹ thuật

### Migration Database

Chạy migration để tạo bảng mới:

```bash
cd backend
alembic upgrade head
```

### Dependencies

Đã thêm vào `requirements.txt`:
- `python-docx==1.1.2` - Đọc file Word
- `Pillow` (tự động cài với python-docx) - Xử lý hình ảnh

### Media Files

Hình ảnh từ đề thi được lưu tại:
- `backend/media/exam_images/` - Hình ảnh trích xuất từ Word
- `backend/media/exam_uploads/` - File Word gốc

Đảm bảo folder `media/` có quyền ghi.

## API Testing

### Upload Exam

```bash
curl -X POST "http://localhost:8000/api/v1/exams/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@exam_midterm.docx" \
  -F "class_id=1" \
  -F "exam_type=midterm" \
  -F "is_published=true"
```

### Get Exams

```bash
curl -X GET "http://localhost:8000/api/v1/exams/classes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Lỗi "Chỉ chấp nhận file Word"
- Đảm bảo file có đuôi `.docx` hoặc `.doc`
- File phải là định dạng Word hợp lệ

### Lỗi "Lỗi phân tích nội dung từ AI"
- Kiểm tra OPENAI_API_KEY trong `.env`
- Đảm bảo file Word có cấu trúc rõ ràng
- Xem log backend để debug

### Hình ảnh không hiển thị
- Kiểm tra folder `media/exam_images/` tồn tại
- Kiểm tra path `/media/` được mount trong main.py
- Xem browser console để check URL hình ảnh

### Auto-save không hoạt động
- Kiểm tra network tab trong browser
- Đảm bảo submission đã được tạo (status: in_progress)

## Mở rộng Tương lai

- [ ] Auto-grade cho câu hỏi trắc nghiệm
- [ ] Export kết quả ra Excel
- [ ] Thống kê phân tích đề thi
- [ ] Import đề từ PDF
- [ ] Tạo đề thi tự động từ ngân hàng câu hỏi
- [ ] Listening: Upload audio cho phần Listening
- [ ] Speaking: Record audio cho phần Speaking

## Liên hệ & Hỗ trợ

Nếu có vấn đề, vui lòng:
1. Check logs backend: `backend/logs/`
2. Check browser console
3. Tạo issue với error message và screenshot

