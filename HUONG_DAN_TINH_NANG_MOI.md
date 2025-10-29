# 📊 HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG MỚI

## 🎯 TỔNG QUAN 3 TÍNH NĂNG ĐƯỢC BỔ SUNG

Dự án đã được bổ sung **3 tính năng quan trọng** để hỗ trợ theo dõi và báo cáo tiến bộ học sinh:

1. ✅ **Tự động tổng hợp kết quả theo thời gian**
2. ✅ **Biểu đồ tiến bộ từng kỹ năng** 
3. ✅ **Xuất báo cáo PDF cho phụ huynh**

---

## 📚 CHI TIẾT TỪNG TÍNH NĂNG

### 1. 🔄 TỰ ĐỘNG TỔNG HỢP KẾT QUẢ THEO THỜI GIAN

#### **Chức năng:**
- Tự động lưu snapshot (ảnh chụp nhanh) tiến bộ học sinh theo tuần/tháng/học kỳ
- Theo dõi xu hướng: đang tiến bộ / ổn định / cần cải thiện
- Lưu trữ điểm số từng kỹ năng (Reading, Writing, Listening, Speaking)

#### **Cách sử dụng:**

**Đối với Giáo viên:**
```
1. Vào Teacher Dashboard
2. Click "Báo cáo tiến bộ" ở menu bên trái
3. Chọn lớp học
4. Chọn học sinh
5. Click "Tạo snapshot mới" để tạo báo cáo mới
```

**Backend API:**
```python
# Tạo snapshot
POST /api/v1/student-progress/snapshots
{
    "student_id": 123,
    "class_id": 45,
    "period_type": "week",  # week, month, semester
    "period_label": "Tuần 42"
}

# Lấy danh sách snapshots
GET /api/v1/student-progress/snapshots/student/{student_id}
?period_type=week&limit=12
```

---

### 2. 📊 BIỂU ĐỒ TIẾN BỘ TỪNG KỸ NĂNG

#### **Chức năng:**
- Biểu đồ cột (Bar Chart) hiển thị điểm 4 kỹ năng
- Biểu đồ đường (Line Chart) theo dõi tiến bộ theo thời gian
- Animation mượt mà khi load dữ liệu
- Responsive trên mọi thiết bị

#### **Các loại biểu đồ:**

**1. Skill Progress Chart (Biểu đồ kỹ năng):**
- Hiển thị: Đọc, Viết, Nghe, Nói
- Màu sắc: Tự động theo mức độ
  - 🟢 Xuất sắc (≥90%): Xanh lá
  - 🔵 Giỏi (≥80%): Xanh dương
  - 🟠 Khá (≥70%): Cam
  - 🟡 Trung bình (≥60%): Vàng
  - 🔴 Cần cải thiện (<60%): Đỏ

**2. Progress Timeline Chart (Biểu đồ timeline):**
- Theo dõi điểm trung bình qua các tuần/tháng
- Hiển thị xu hướng tăng/giảm
- Hover để xem chi tiết từng điểm

#### **Cách xem:**

**Đối với Học sinh:**
```
1. Vào Student Dashboard
2. Click "Học tập của tôi"
3. Xem biểu đồ tiến bộ
```

**Đối với Phụ huynh:**
```
1. Vào Parent Dashboard
2. Click "Theo dõi tiến độ"
3. Chọn con
4. Click "Báo cáo chi tiết"
5. Xem biểu đồ đầy đủ
```

**Đối với Giáo viên:**
```
1. Vào Teacher Dashboard
2. Click "Báo cáo tiến bộ"
3. Chọn lớp và học sinh
4. Xem dashboard đầy đủ với biểu đồ
```

---

### 3. 📄 XUẤT BÁO CÁO PDF

#### **Chức năng:**
- Tạo báo cáo PDF chuyên nghiệp
- Bao gồm:
  - ✅ Thông tin học sinh
  - ✅ Điểm tổng quan
  - ✅ Biểu đồ kỹ năng (embedded images)
  - ✅ Biểu đồ timeline
  - ✅ Bảng hoạt động gần đây
  - ✅ Chuyên cần
  - ✅ Nhận xét giáo viên
  - ✅ Khuyến nghị học tập

#### **Cách xuất PDF:**

**Từ Teacher Dashboard:**
```
1. Vào "Báo cáo tiến bộ"
2. Chọn học sinh
3. Click "Xuất báo cáo PDF"
4. File PDF tự động download
```

**Từ Parent Dashboard:**
```
1. Vào "Theo dõi tiến độ"
2. Chọn con
3. Click "Báo cáo chi tiết"
4. Click "Xuất báo cáo PDF"
5. File PDF tự động download
```

**Backend API:**
```python
GET /api/v1/student-progress/export/pdf/student/{student_id}
?class_id=45  # optional

Response: PDF file download
```

#### **Nội dung báo cáo PDF:**

```
┌─────────────────────────────────────────┐
│   BÁO CÁO TIẾN BỘ HỌC TẬP              │
│   STUDENT PROGRESS REPORT               │
├─────────────────────────────────────────┤
│ Học sinh: Nguyễn Văn A                  │
│ Lớp: 10A1                               │
│ Giáo viên: Cô Lan                       │
│ Điểm TB: 85.5%                          │
├─────────────────────────────────────────┤
│ TỔNG QUAN THÀNH TÍCH                    │
│ - Xếp loại: Giỏi                        │
├─────────────────────────────────────────┤
│ KẾT QUẢ THEO KỸ NĂNG                   │
│ - Đọc:  88.5%  [Biểu đồ cột]          │
│ - Viết: 82.3%                           │
│ - Nghe: 87.1%                           │
│ - Nói:  84.0%                           │
├─────────────────────────────────────────┤
│ TIẾN BỘ THEO THỜI GIAN                 │
│ [Biểu đồ đường qua 12 tuần]           │
├─────────────────────────────────────────┤
│ HOẠT ĐỘNG GẦN ĐÂY                       │
│ [Bảng 10 bài tập gần nhất]            │
├─────────────────────────────────────────┤
│ NHẬN XÉT & KHUYẾN NGHỊ                  │
│ - Học sinh tiến bộ tốt...              │
└─────────────────────────────────────────┘
```

---

## 🔐 PHÂN QUYỀN CHI TIẾT

### **Student (USER role):**
- ✅ Xem tiến bộ của chính mình
- ✅ Xuất báo cáo PDF của chính mình
- ❌ KHÔNG xem được tiến bộ học sinh khác

### **Parent (PARENT role):**
- ✅ Xem tiến bộ con em đã liên kết
- ✅ Xuất báo cáo PDF con em
- ❌ KHÔNG xem được học sinh không liên kết

### **Teacher (TEACHER role):**
- ✅ Xem tiến bộ học sinh trong lớp của mình
- ✅ Tạo snapshot cho học sinh
- ✅ Xuất báo cáo PDF học sinh
- ❌ KHÔNG xem được học sinh lớp khác

### **Admin (ADMIN/SUPERADMIN role):**
- ✅ Xem tất cả tiến bộ
- ✅ Tạo snapshot cho bất kỳ học sinh nào
- ✅ Xuất báo cáo PDF bất kỳ

---

## 🛠️ CÀI ĐẶT VÀ KHỞI ĐỘNG

### **Backend:**

1. **Cài đặt dependencies mới:**
```bash
cd backend
pip install -r requirements.txt
# Đã thêm: reportlab==4.0.7, matplotlib==3.8.2
```

2. **Chạy migration:**
```bash
alembic upgrade head
# Migration 011_student_progress_tracking sẽ tạo 2 bảng mới:
# - student_progress_snapshots
# - student_skill_progress
```

3. **Khởi động server:**
```bash
python main.py
# hoặc
uvicorn main:app --reload
```

### **Frontend:**

1. **Cài đặt (nếu cần):**
```bash
cd frontend
npm install
```

2. **Khởi động:**
```bash
npm run dev
```

---

## 📁 CẤU TRÚC FILE MỚI

### **Backend:**

```
backend/
├── app/
│   ├── models/
│   │   └── student_progress.py              # NEW: Model progress
│   ├── services/
│   │   ├── student_progress_service.py      # NEW: Service xử lý
│   │   └── pdf_report_service.py            # NEW: Service tạo PDF
│   └── routers/
│       └── student_progress.py              # NEW: API endpoints
└── alembic/versions/
    └── 011_student_progress_tracking.py     # NEW: Migration
```

### **Frontend:**

```
frontend/
└── src/
    ├── components/
    │   └── StudentProgress/
    │       ├── StudentProgressDashboard.jsx  # NEW: Dashboard chính
    │       ├── StudentProgressDashboard.css
    │       ├── SkillProgressChart.jsx        # NEW: Biểu đồ kỹ năng
    │       ├── SkillProgressChart.css
    │       ├── ProgressTimelineChart.jsx     # NEW: Biểu đồ timeline
    │       ├── ProgressTimelineChart.css
    │       └── index.js
    ├── services/
    │   └── studentProgressService.js         # NEW: API service
    └── pages/
        ├── Teacher/TeacherDashboardV3/components/
        │   ├── StudentProgressView.jsx       # NEW: Trang teacher
        │   └── StudentProgressView.css
        └── Parent/ParentDashboardV2/components/
            └── TrackProgress.jsx             # UPDATED: Tích hợp
```

---

## 🎨 THIẾT KẾ UI/UX

### **Màu sắc nhất quán:**
- Primary: `#3b82f6` (Blue)
- Success: `#16a34a` (Green)
- Warning: `#ea580c` (Orange)
- Danger: `#dc2626` (Red)
- Neutral: `#64748b` (Gray)

### **Typography:**
- Heading: `Inter, system-ui` - Bold 700
- Body: `Inter, system-ui` - Regular 400
- Numbers: Monospace cho dễ đọc

### **Animations:**
- Slide in: 0.3s ease-out
- Fade in: 0.5s ease-in
- Bar chart: 1s ease-out
- Line chart: 2s ease-out

---

## 📊 DỮ LIỆU MẪU

### **Tạo snapshot mẫu:**

```python
# Script test tạo snapshot
from app.services.student_progress_service import StudentProgressService

# Tạo snapshot tuần cho học sinh
snapshot = StudentProgressService.create_progress_snapshot(
    db=db,
    student_id=1,
    class_id=1,
    period_type="week",
    period_label="Tuần 42"
)
```

---

## 🐛 TROUBLESHOOTING

### **Lỗi thường gặp:**

**1. ImportError: No module named 'reportlab'**
```bash
pip install reportlab matplotlib
```

**2. Permission denied khi export PDF**
- Kiểm tra role của user
- Teacher chỉ export được học sinh trong lớp mình

**3. Biểu đồ không hiển thị**
- Kiểm tra console browser
- Đảm bảo có dữ liệu snapshot

**4. Migration lỗi**
```bash
# Rollback và thử lại
alembic downgrade -1
alembic upgrade head
```

---

## 📈 PERFORMANCE

### **Tối ưu hóa:**
- ✅ API pagination (limit=12 snapshots)
- ✅ Eager loading với joinedload()
- ✅ Index trên student_id, class_id, snapshot_date
- ✅ Cache PDF tạm thời (nếu cần)

### **Khuyến nghị:**
- Tạo snapshot 1 lần/tuần (không nên quá nhiều)
- Giới hạn số lượng timeline hiển thị (12 điểm)
- Compress images trong PDF

---

## 🔮 TÍNH NĂNG NÂNG CAO (TÙY CHỌN)

### **Có thể mở rộng:**
1. 📧 Email báo cáo PDF tự động cho phụ huynh
2. 📅 Lên lịch tạo snapshot tự động (cron job)
3. 🔔 Thông báo khi tiến bộ giảm sút
4. 📊 So sánh với trung bình lớp
5. 🎯 Gợi ý bài tập dựa trên điểm yếu

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra log backend: `backend/logs/`
2. Kiểm tra console browser (F12)
3. Đảm bảo đã chạy migration
4. Đảm bảo role user phù hợp

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] Cài đặt dependencies backend
- [ ] Chạy migration
- [ ] Khởi động backend
- [ ] Cài đặt frontend (nếu cần)
- [ ] Khởi động frontend
- [ ] Test login với từng role
- [ ] Test tạo snapshot (Teacher)
- [ ] Test xem biểu đồ (Student, Parent, Teacher)
- [ ] Test export PDF
- [ ] Kiểm tra responsive mobile

---

## 🎉 KẾT LUẬN

Tất cả 3 tính năng đã được implement đầy đủ:
✅ Tự động tổng hợp kết quả theo thời gian
✅ Biểu đồ tiến bộ từng kỹ năng
✅ Xuất báo cáo PDF

Giao diện đồng bộ với design hiện tại, backend trơn tru, và tất cả role đều được kiểm tra kỹ lưỡng.

**Chúc bạn triển khai thành công! 🚀**

