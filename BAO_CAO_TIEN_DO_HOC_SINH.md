# Báo Cáo Tiến Độ Học Sinh - Hướng Dẫn & Tính Năng

## Tổng Quan
Hệ thống Báo cáo Tiến độ Học sinh là một tính năng toàn diện giúp giáo viên, phụ huynh và học sinh theo dõi tiến bộ học tập theo thời gian.

## Vị Trí Truy Cập

### Giáo Viên
- Đăng nhập với tài khoản giáo viên
- Vào **Teacher Dashboard V3**
- Chọn **"Báo cáo tiến bộ"** trong menu bên trái (mục **TRỢ LÝ AI**)
- Chọn lớp học và học sinh cần xem báo cáo

### Phụ Huynh
- Đăng nhập với tài khoản phụ huynh
- Vào **Parent Dashboard**
- Chọn **"Theo dõi tiến độ"** hoặc **"Track Progress"**
- Chọn con em để xem báo cáo chi tiết

### Học Sinh
- Đăng nhập với tài khoản học sinh
- Vào dashboard học sinh
- Xem báo cáo tiến bộ cá nhân

---

## ✅ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 1. ✅ Tự động tổng hợp kết quả từng học sinh theo thời gian

**Cách hoạt động:**
- Hệ thống sử dụng **Student Progress Snapshots** để tự động lưu trữ tiến độ học sinh
- Snapshots được tạo theo chu kỳ: **Tuần / Tháng / Học kỳ**
- Mỗi snapshot bao gồm:
  - Điểm trung bình tổng thể
  - Điểm theo từng kỹ năng (Reading, Writing, Listening, Speaking)
  - Số bài tập đã nộp / đã chấm
  - Tỷ lệ hoàn thành
  - Xu hướng tiến bộ (Đang tiến bộ / Ổn định / Cần cải thiện)

**API Endpoints:**
```
POST /api/v1/student-progress/snapshots
GET  /api/v1/student-progress/snapshots/student/{student_id}
GET  /api/v1/student-progress/summary/student/{student_id}
```

**Frontend Components:**
- `StudentProgressDashboard.jsx` - Component hiển thị báo cáo
- `studentProgressService.js` - Service xử lý API calls

**Cách sử dụng:**
1. Giáo viên có thể tạo snapshot thủ công bằng nút **"Tạo snapshot mới"**
2. Hệ thống tự động tính toán dựa trên:
   - Tất cả bài nộp (submissions) của học sinh
   - Điểm số từng bài tập
   - Kỹ năng của từng bài tập

---

### 2. ✅ Biểu đồ thể hiện tiến bộ từng kỹ năng

**Các loại biểu đồ:**

#### a) **Skill Progress Chart** (Biểu đồ thanh kỹ năng)
- Hiển thị điểm số của 4 kỹ năng: Reading, Writing, Listening, Speaking
- Màu sắc phân biệt từng kỹ năng
- Animation mượt mà khi load dữ liệu
- Đánh giá theo cấp độ:
  - 90-100%: Xuất sắc (màu xanh đậm)
  - 80-89%: Giỏi (màu xanh)
  - 70-79%: Khá (màu cam)
  - 60-69%: Trung bình (màu vàng)
  - <60%: Cần cải thiện (màu đỏ)

#### b) **Progress Timeline Chart** (Biểu đồ đường thời gian)
- Hiển thị sự tiến bộ của học sinh qua các chu kỳ
- Đường line chart với điểm dữ liệu
- Trục X: Thời gian (tuần/tháng/học kỳ)
- Trục Y: Điểm trung bình (0-100%)
- Hiệu ứng gradient dưới đường line

**Files:**
- `SkillProgressChart.jsx` - Component biểu đồ kỹ năng
- `ProgressTimelineChart.jsx` - Component biểu đồ timeline
- `SkillProgressChart.css` - Styles
- `ProgressTimelineChart.css` - Styles

**Dữ liệu hiển thị:**
```javascript
{
  skills: {
    reading: 85.2,
    writing: 78.8,
    listening: 84.1,
    speaking: 79.3
  },
  timeline: [
    { period_label: "Tuần 1", average_score: 75.0 },
    { period_label: "Tuần 2", average_score: 78.5 },
    { period_label: "Tuần 3", average_score: 82.0 }
  ]
}
```

---

### 3. ✅ Xuất báo cáo PDF & Excel

#### A. **Xuất PDF** ✅

**Tính năng:**
- Báo cáo PDF chuyên nghiệp, đầy đủ thông tin
- Bao gồm:
  - Thông tin học sinh (tên, email, lớp, giáo viên)
  - Tổng quan (điểm TB, xu hướng, số bài tập)
  - Kết quả theo kỹ năng với biểu đồ
  - Tiến bộ theo thời gian
  - Hoạt động gần đây
  - Nhận xét giáo viên
  - Khuyến nghị cải thiện

**API Endpoint:**
```
GET /api/v1/student-progress/export/pdf/student/{student_id}?class_id={class_id}
```

**Service Method:**
```javascript
studentProgressService.downloadPDF(studentId, studentName, classId)
```

**Backend Service:**
- Sử dụng `PDFReportService.generate_student_report()` để tạo PDF
- File: `app/services/pdf_report_service.py`

---

#### B. **Xuất Excel** ✅ (MỚI TRIỂN KHAI)

**Tính năng:**
- File Excel (.xlsx) với định dạng chuyên nghiệp
- Nhiều sheet/sections:
  - **Thông tin học sinh** - Tên, email, lớp, giáo viên, ngày xuất
  - **Tổng quan** - Điểm TB, xu hướng, số bài nộp, tỷ lệ hoàn thành
  - **Kết quả theo kỹ năng** - Bảng chi tiết 4 kỹ năng với đánh giá và khuyến nghị
  - **Tiến bộ theo thời gian** - Lịch sử 20 snapshots gần nhất
  - **Bài tập gần đây** - 20 bài tập mới nhất với điểm số

**API Endpoint:**
```
GET /api/v1/student-progress/export/excel/student/{student_id}?class_id={class_id}
```

**Service Method:**
```javascript
studentProgressService.downloadExcel(studentId, studentName, classId)
```

**Backend Implementation:**
- Sử dụng thư viện `openpyxl` để tạo Excel
- File: `app/routers/student_progress.py` (endpoint `/export/excel/student/{student_id}`)
- Styling: Headers màu tím gradient, borders, alignment
- Auto-adjust column width

**Cách sử dụng:**
1. Vào trang Báo cáo tiến bộ
2. Chọn học sinh cần xuất
3. Click nút **"Xuất PDF"** hoặc **"Xuất Excel"**
4. File sẽ tự động download về máy

---

## 🎨 GIAO DIỆN MỚI (HORIZONTAL LAYOUT)

### Thay đổi chính:

#### **Trước:** Layout dọc (vertical)
- Cards xếp dọc theo cột
- Khó nhìn tổng quan
- Không tận dụng hết màn hình rộng

#### **Sau:** Layout ngang (horizontal) ✅
- **Grid 4 cột responsive:**
  - Mobile: 1 cột
  - Tablet: 2 cột
  - Desktop: 4 cột
- **Stat cards hiện đại:**
  - Icon lớn, màu sắc phân biệt
  - Font size lớn, dễ đọc
  - Hover effects mượt mà
  - Border gradient khi hover
- **Màu sắc phân biệt:**
  - Điểm trung bình: Gradient tím (primary)
  - Xu hướng: Vàng
  - Bài tập đã nộp: Xanh dương
  - Tỷ lệ hoàn thành: Xanh lá

### CSS Classes mới:
```css
.summary-cards-grid       /* Grid container */
.stat-card                /* Card item */
.stat-card-primary        /* Primary card với gradient */
.stat-card-header         /* Header với icon + info */
.stat-icon                /* Icon container */
.stat-info                /* Text info */
.stat-label               /* Label text */
.stat-value               /* Value number */
.stat-unit                /* Unit (%, etc) */
```

### Export Buttons:
- **2 nút song song:** PDF (xanh dương) và Excel (xanh lá)
- Hover effects
- Loading states
- Responsive

---

## 📊 KIẾN TRÚC HỆ THỐNG

### Database Models

#### **StudentProgressSnapshot**
```python
class StudentProgressSnapshot(Base):
    id: int
    student_id: int
    class_id: int (optional)
    snapshot_date: datetime
    period_type: str  # week, month, semester
    period_label: str (optional)
    
    # Scores
    average_score: float
    reading_score: float
    writing_score: float
    listening_score: float
    speaking_score: float
    
    # Counts
    total_submissions: int
    graded_submissions: int
    reading_count: int
    writing_count: int
    listening_count: int
    speaking_count: int
    
    # Metrics
    completion_rate: float
    trend: str  # improving, stable, declining
    attendance_rate: float
```

#### **StudentSkillProgress**
```python
class StudentSkillProgress(Base):
    id: int
    student_id: int
    skill_type: str  # reading, writing, listening, speaking
    score: float
    max_score: float
    percentage: float
    assessment_date: datetime
    
    # Feedback
    strengths: List[str] (optional)
    weaknesses: List[str] (optional)
    teacher_notes: str (optional)
    ai_feedback: str (optional)
```

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/student-progress/snapshots` | Tạo snapshot mới |
| GET | `/api/v1/student-progress/snapshots/student/{id}` | Lấy snapshots của học sinh |
| GET | `/api/v1/student-progress/skills/student/{id}/{skill}` | Lấy timeline kỹ năng |
| GET | `/api/v1/student-progress/summary/student/{id}` | Lấy tổng hợp tiến bộ |
| GET | `/api/v1/student-progress/class/{id}/snapshots` | Lấy snapshots của lớp |
| GET | `/api/v1/student-progress/export/pdf/student/{id}` | Xuất PDF |
| GET | `/api/v1/student-progress/export/excel/student/{id}` | Xuất Excel ✅ |

### Frontend Components

```
components/StudentProgress/
├── StudentProgressDashboard.jsx       # Main dashboard
├── StudentProgressDashboard.css       # Styles (Updated ✅)
├── SkillProgressChart.jsx             # Bar chart
├── SkillProgressChart.css
├── ProgressTimelineChart.jsx          # Line chart
├── ProgressTimelineChart.css
└── index.js                           # Exports

pages/Teacher/TeacherDashboardV3/
└── components/
    └── StudentProgressView.jsx        # Teacher view

pages/Parent/ParentDashboardV2/
└── components/
    └── TrackProgress.jsx              # Parent view

services/
└── studentProgressService.js          # API service (Updated ✅)
```

---

## 🚀 SỬ DỤNG

### 1. Tạo Snapshot (Giáo viên)

```javascript
// Manual snapshot creation
await studentProgressService.createSnapshot(
  studentId,
  classId,
  'week',
  'Tuần 1 - Tháng 11'
);
```

### 2. Xem Báo Cáo

```javascript
// Get comprehensive summary
const summary = await studentProgressService.getStudentSummary(
  studentId,
  classId
);

// Get snapshots history
const snapshots = await studentProgressService.getSnapshots(
  studentId,
  { period_type: 'week', limit: 12 }
);

// Get skill timeline
const skillData = await studentProgressService.getSkillTimeline(
  studentId,
  'reading',
  20
);
```

### 3. Xuất Báo Cáo

```javascript
// Export PDF
await studentProgressService.downloadPDF(
  studentId,
  'nguyen_van_a',
  classId
);

// Export Excel ✅
await studentProgressService.downloadExcel(
  studentId,
  'nguyen_van_a',
  classId
);
```

---

## 🎯 PERMISSIONS (Phân Quyền)

| Role | View Own | View Children | View Students | Create Snapshot | Export |
|------|----------|---------------|---------------|-----------------|--------|
| **Student** | ✅ | ❌ | ❌ | ❌ | ✅ (own) |
| **Parent** | ❌ | ✅ | ❌ | ❌ | ✅ (children) |
| **Teacher** | ❌ | ❌ | ✅ (own classes) | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ (all) | ✅ | ✅ |

---

## 📋 USE CASES

### 1. **Họp phụ huynh**
- Giáo viên xuất báo cáo PDF/Excel cho từng học sinh
- Chia sẻ với phụ huynh để thảo luận về tiến bộ
- Đưa ra kế hoạch cải thiện

### 2. **Đánh giá định kỳ**
- Tạo snapshot cuối mỗi tuần/tháng
- So sánh tiến bộ qua các chu kỳ
- Phát hiện học sinh cần hỗ trợ

### 3. **Báo cáo học tập**
- Học sinh/phụ huynh xem tiến bộ theo thời gian
- Nhận biết điểm mạnh/yếu
- Theo dõi xu hướng phát triển

### 4. **Nhập liệu vào hệ thống khác**
- Xuất Excel để import vào phần mềm quản lý khác
- Phân tích dữ liệu với Excel/Google Sheets
- Tạo báo cáo tùy chỉnh

---

## ✨ TÍNH NĂNG NỔI BẬT

### 1. **Tự động hóa cao**
- Hệ thống tự động tính toán điểm từ submissions
- Tự động phân loại theo kỹ năng
- Tự động xác định xu hướng (improving/stable/declining)

### 2. **Trực quan hóa dữ liệu**
- Biểu đồ bar chart cho kỹ năng
- Line chart cho tiến bộ theo thời gian
- Color coding theo mức độ

### 3. **Responsive Design**
- Hoạt động tốt trên mobile, tablet, desktop
- Grid layout tự động điều chỉnh
- Touch-friendly

### 4. **Export linh hoạt**
- PDF: Báo cáo chuyên nghiệp, in được
- Excel: Dữ liệu có thể chỉnh sửa, import

### 5. **Phân quyền chặt chẽ**
- Bảo mật thông tin học sinh
- Chỉ người có quyền mới xem được
- Audit trail đầy đủ

---

## 🔧 YÊU CẦU KỸ THUẬT

### Backend
- Python 3.9+
- FastAPI
- SQLAlchemy
- ReportLab (cho PDF)
- openpyxl (cho Excel) ✅

### Frontend
- React 18+
- lucide-react (icons)
- CSS3 (animations, grid)

### Database
- PostgreSQL hoặc SQLite
- Tables: student_progress_snapshots, student_skill_progress

---

## 📝 NOTES

1. **Performance:**
   - Snapshot creation có thể mất vài giây với học sinh có nhiều bài nộp
   - Recommend tạo snapshot định kỳ thay vì real-time

2. **Data Retention:**
   - Snapshots được lưu vĩnh viễn
   - Có thể cấu hình limit số lượng snapshots hiển thị

3. **Caching:**
   - Frontend cache summary data để tăng tốc load
   - Backend có thể thêm Redis cache cho queries phức tạp

4. **Future Enhancements:**
   - Email tự động gửi báo cáo định kỳ
   - Notification khi xu hướng declining
   - AI recommendations dựa trên pattern
   - Comparison với class average
   - Goal setting và tracking

---

## 🐛 TROUBLESHOOTING

### 1. **Không có dữ liệu hiển thị**
- Kiểm tra học sinh đã nộp bài chưa
- Tạo snapshot thủ công nếu chưa có
- Check permissions

### 2. **Export PDF/Excel không hoạt động**
- Kiểm tra backend có cài đủ libraries (reportlab, openpyxl)
- Check logs backend
- Verify permissions

### 3. **Biểu đồ không hiển thị**
- Check console errors
- Verify data format
- Refresh page

### 4. **Layout bị lỗi**
- Clear browser cache
- Check CSS conflicts
- Verify responsive breakpoints

---

## 📞 SUPPORT

Nếu có vấn đề hoặc câu hỏi, vui lòng:
1. Check documentation này
2. Review code comments
3. Check console/backend logs
4. Contact development team

---

**Tài liệu này cập nhật:** 29/10/2024
**Phiên bản:** 2.0 (với Excel export & Horizontal layout)

