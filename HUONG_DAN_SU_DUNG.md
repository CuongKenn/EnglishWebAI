# 📖 HƯỚNG DẪN SỬ DỤNG CÁC TÍNH NĂNG MỚI

## 🎯 VỊ TRÍ CÁC TÍNH NĂNG

### ✅ **ĐÃ TÍCH HỢP VÀO TEACHER DASHBOARD**

Sau khi đăng nhập với vai trò **Teacher**, bạn sẽ thấy các tính năng mới trong menu bên trái:

---

## 📍 1. PHIẾU ĐÁNH GIÁ HÀNG TUẦN (Weekly Assessments)

### 📌 Vị trí trong Menu:
```
Teacher Dashboard 
  └─ BÀI TẬP & ĐÁNH GIÁ
      └─ 📋 Phiếu đánh giá tuần  ← ĐÂY!
```

### 🔗 URL trực tiếp:
```
http://localhost:5173/teacher-dashboard/weekly-assessments
```

### ✨ Tính năng:
- ✅ Tạo phiếu đánh giá tự động bằng AI cho 4 kỹ năng
- ✅ Quản lý theo tuần học (Week 1, Week 2, ...)
- ✅ Hiển thị ma trận: Reading, Writing, Listening, Speaking
- ✅ Xem tổng quan phiếu đã tạo
- ✅ Xóa phiếu đánh giá

### 📸 Giao diện:
```
┌─────────────────────────────────────────┐
│ 📋 Phiếu Đánh Giá Hàng Tuần            │
│ ┌──────────────┐ ┌──────────────┐      │
│ │ 📊 Tổng: 12  │ │ 📅 Tuần: 5   │      │
│ └──────────────┘ └──────────────┘      │
│                                         │
│ 📚 Tuần 5                               │
│ ┌────────┬────────┬────────┬────────┐  │
│ │ 📖 Đọc │ ✍️ Viết│ 🎧 Nghe│ 🗣️ Nói│  │
│ │   ✓    │   ✓    │   -    │   ✓    │  │
│ └────────┴────────┴────────┴────────┘  │
│                                         │
│ [✨ Tạo Phiếu Đánh Giá]                │
└─────────────────────────────────────────┘
```

---

## 📍 2. XUẤT BÁO CÁO PHÂN TÍCH LỖI (Error Analysis Export)

### 📌 Vị trí trong Menu:
```
Teacher Dashboard 
  └─ BÀI TẬP & ĐÁNH GIÁ
      └─ 📊 Xuất phân tích lỗi  ← ĐÂY!
```

### 🔗 URL trực tiếp:
```
http://localhost:5173/teacher-dashboard/error-analysis
```

### ✨ Tính năng:
- ✅ Xuất báo cáo CSV/JSON
- ✅ Phân tích lỗi chi tiết từ AI
- ✅ Gợi ý cách sửa cho từng học sinh
- ✅ Bộ lọc: Lớp, Học sinh, Kỹ năng
- ✅ Xem trước dữ liệu

### 📊 Dữ liệu xuất ra gồm:
- Tên học sinh
- Bài tập
- Kỹ năng
- Điểm số (AI + Teacher)
- **Chi tiết lỗi**
- **Gợi ý cách sửa**
- Phản hồi AI
- Phản hồi giáo viên

### 📸 Giao diện:
```
┌─────────────────────────────────────────┐
│ 📊 Xuất Báo Cáo Phân Tích Lỗi          │
│                                         │
│ ⚙️ Bộ lọc dữ liệu                      │
│ Lớp học: [Lớp 10A1     ▼]             │
│ Học sinh: [Tất cả      ▼]             │
│ Kỹ năng: [Tất cả       ▼]             │
│ Format: [CSV (Excel)   ▼]             │
│                                         │
│ [👁️ Xem trước] [📥 Xuất báo cáo]     │
│                                         │
│ 👁️ Xem trước dữ liệu                  │
│ ┌───────┬──────┬────────┬──────────┐   │
│ │HS     │Bài tập│Kỹ năng │Lỗi      │   │
│ ├───────┼──────┼────────┼──────────┤   │
│ │Nguyễn │Essay │Writing │Grammar:..│   │
│ │Văn A  │      │        │Vocab:... │   │
│ └───────┴──────┴────────┴──────────┘   │
└─────────────────────────────────────────┘
```

---

## 📍 3. TẢI LÊN FILE POWERPOINT (PowerPoint Upload)

### 📌 Vị trí:
```
Teacher Dashboard 
  └─ QUẢN LÝ DẠY HỌC
      └─ 🏫 Quản lý lớp học
          └─ [Chọn lớp]
              └─ 📁 Học liệu  ← ĐÂY!
```

### 🔗 Cách truy cập:
1. Vào `Teacher Dashboard`
2. Click `🏫 Quản lý lớp học`
3. Tìm thẻ lớp học bạn muốn
4. Click nút **`📁 Học liệu`** trên thẻ lớp
5. Modal sẽ hiển thị form upload

### ✨ Tính năng:
- ✅ Upload PowerPoint (.ppt, .pptx)
- ✅ Upload PDF, Word, Excel
- ✅ Upload ảnh, audio, video
- ✅ Xem danh sách học liệu đã tải
- ✅ Tải về trực tiếp
- ✅ Icon phân biệt loại file

### 📸 Giao diện:
```
┌─────────────────────────────────────────┐
│ 📁 Học liệu & Tài liệu - Lớp 10A1     │ [×]
│                                         │
│ 📤 Tải lên học liệu mới                │
│ ┌─────────────────────────────────────┐ │
│ │ Tiêu đề: [Bài giảng Unit 5      ]  │ │
│ │ Mô tả:   [PowerPoint công nghệ  ]  │ │
│ │ File:    [📎 lesson_5.pptx       ]  │ │
│ │          (2.5 MB)                   │ │
│ │ [📤 Tải lên học liệu]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📚 Danh sách học liệu (5)              │
│ ┌─────────────────────────────────────┐ │
│ │ 📊 Bài giảng Unit 5                 │ │
│ │ PowerPoint về công nghệ             │ │
│ │ presentation · 29/10/2024           │ │
│ │                        [⬇️ Tải về]  │ │
│ ├─────────────────────────────────────┤ │
│ │ 📕 Đề cương môn học                 │ │
│ │ File PDF đề cương                   │ │
│ │ pdf · 28/10/2024      [⬇️ Tải về]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🚀 CÁCH SỬ DỤNG CHI TIẾT

### 📋 1. Tạo Phiếu Đánh Giá Hàng Tuần

#### Bước 1: Truy cập trang
```
Teacher Dashboard → Bài tập & Đánh giá → 📋 Phiếu đánh giá tuần
```

#### Bước 2: Chọn lớp học
```
Dropdown: [Lớp 10A1 ▼]
```

#### Bước 3: Click "Tạo Phiếu Đánh Giá"
```
[✨ Tạo Phiếu Đánh Giá]
```

#### Bước 4: Điền thông tin
```
┌─────────────────────────────────┐
│ ✨ Tạo Phiếu Đánh Giá Mới     │
│                                 │
│ Tuần học:    [5        ]        │
│ Kỹ năng:     [Reading  ▼]      │
│ Khối lớp:    [10       ]        │
│ Độ khó:      [Medium   ▼]      │
│ Unit/Chủ đề: [Unit 5   ]        │
│                                 │
│ [Hủy] [✨ Tạo phiếu đánh giá] │
└─────────────────────────────────┘
```

#### Bước 5: AI tự động tạo
- AI ChatGPT sẽ sinh phiếu đánh giá phù hợp
- Có câu hỏi, đáp án, rubrics đầy đủ
- Lưu tự động vào database

---

### 📊 2. Xuất Báo Cáo Phân Tích Lỗi

#### Bước 1: Truy cập trang
```
Teacher Dashboard → Bài tập & Đánh giá → 📊 Xuất phân tích lỗi
```

#### Bước 2: Chọn bộ lọc
```
Lớp học:   [Lớp 10A1        ▼] (BẮT BUỘC)
Học sinh:  [Tất cả học sinh ▼] (Tùy chọn)
Kỹ năng:   [Writing         ▼] (Tùy chọn)
Format:    [CSV (Excel)     ▼]
```

#### Bước 3: Xem trước
```
[👁️ Xem trước]
```
- Hiển thị bảng 10 dòng đầu
- Kiểm tra dữ liệu trước khi xuất

#### Bước 4: Xuất file
```
[📥 Xuất báo cáo]
```
- File CSV sẽ tự động download
- Mở bằng Excel để xem

---

### 📁 3. Upload PowerPoint

#### Bước 1: Vào Quản lý lớp học
```
Teacher Dashboard → Quản lý dạy học → 🏫 Quản lý lớp học
```

#### Bước 2: Chọn lớp
- Tìm thẻ lớp học (VD: Lớp 10A1)
- Click nút **`📁 Học liệu`**

#### Bước 3: Upload file
```
┌─────────────────────────────┐
│ Tiêu đề: Bài giảng Unit 5  │
│ Mô tả:   PowerPoint công nghệ │
│ File:    [Choose File...]   │
│          Chọn file .pptx    │
│ [📤 Tải lên học liệu]      │
└─────────────────────────────┘
```

#### Bước 4: File được lưu
- Hiển thị trong danh sách học liệu
- Học sinh có thể download ngay
- Icon 📊 cho PowerPoint

---

## 🔧 KHẮC PHỤC SỰ CỐ

### ❓ Không thấy menu mới?
**Giải pháp:**
1. Đảm bảo đã đăng nhập với vai trò **Teacher**
2. Refresh lại trang (Ctrl+R hoặc F5)
3. Xóa cache browser (Ctrl+Shift+Delete)
4. Kiểm tra console (F12) xem có lỗi không

### ❓ Import bị lỗi?
**Giải pháp:**
```bash
# Kiểm tra files tồn tại
EnglishWebAI/frontend/src/pages/Teacher/
  ├── WeeklyAssessments/
  │   ├── WeeklyAssessments.jsx    ✓
  │   └── WeeklyAssessments.css    ✓
  └── ErrorAnalysis/
      ├── ErrorAnalysisExport.jsx  ✓
      └── ErrorAnalysisExport.css  ✓
```

### ❓ API không hoạt động?
**Giải pháp:**
1. Chạy migration:
```bash
cd EnglishWebAI/backend
alembic upgrade head
```

2. Khởi động backend:
```bash
python main.py
```

3. Kiểm tra log backend xem có lỗi không

---

## 📸 SCREENSHOTS VỊ TRÍ

### 🎯 Sidebar Menu
```
┌────────────────────────────┐
│ 👨‍🏫 Teacher Dashboard      │
│                            │
│ 📊 Tổng quan              │
│   • Dashboard              │
│                            │
│ 📚 Quản lý dạy học        │
│   • Quản lý lớp học        │
│   • Khoá học công khai     │
│   • Học liệu               │
│   • Ngân hàng câu hỏi      │
│   • Tin tức & Bài viết     │
│                            │
│ ✅ Bài tập & Đánh giá     │
│   • Bài tập & Kiểm tra     │
│   • Chấm điểm & Phản hồi   │
│   • 📋 Phiếu đánh giá tuần│ ← MỚI!
│   • 📊 Xuất phân tích lỗi │ ← MỚI!
│                            │
│ 📈 Báo cáo & Công cụ      │
│   • Thống kê & Báo cáo     │
│   • Dạy học trực tuyến     │
└────────────────────────────┘
```

---

## 🎓 VIDEO HƯỚNG DẪN (Tóm tắt)

### 1️⃣ Phiếu đánh giá tuần
```
1. Đăng nhập Teacher
2. Sidebar → Bài tập & Đánh giá → Phiếu đánh giá tuần
3. Chọn lớp
4. Click "Tạo Phiếu Đánh Giá"
5. Điền form → Submit
6. Xong! AI tự động tạo
```

### 2️⃣ Xuất phân tích lỗi
```
1. Sidebar → Bài tập & Đánh giá → Xuất phân tích lỗi
2. Chọn lớp (bắt buộc)
3. Chọn bộ lọc (tùy chọn)
4. Click "Xem trước"
5. Click "Xuất báo cáo"
6. File CSV tự động download
```

### 3️⃣ Upload PowerPoint
```
1. Sidebar → Quản lý lớp học
2. Tìm thẻ lớp
3. Click "📁 Học liệu"
4. Điền tiêu đề, mô tả
5. Chọn file .pptx
6. Click "Tải lên học liệu"
7. Xong! File hiển thị ngay
```

---

## ✅ CHECKLIST HOẠT ĐỘNG

- [ ] Backend đang chạy (port 8000)
- [ ] Frontend đang chạy (port 5173)
- [ ] Database migration đã chạy
- [ ] Đăng nhập với role Teacher
- [ ] Thấy 2 menu mới trong sidebar
- [ ] Click vào được không lỗi

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra console browser (F12)
2. Kiểm tra log backend
3. Đọc file `IMPLEMENTATION_SUMMARY.md` để biết chi tiết kỹ thuật
4. Kiểm tra network tab xem API có được gọi không

---

## 🎉 KẾT LUẬN

**3 tính năng đã sẵn sàng sử dụng:**

1. ✅ **Phiếu đánh giá tuần** - `/teacher-dashboard/weekly-assessments`
2. ✅ **Xuất phân tích lỗi** - `/teacher-dashboard/error-analysis`
3. ✅ **Upload PowerPoint** - Trong "Quản lý lớp học" → "📁 Học liệu"

**Vị trí:** Teacher Dashboard → Sidebar bên trái → Mục "Bài tập & Đánh giá"

Chúc bạn sử dụng tốt! 🚀

