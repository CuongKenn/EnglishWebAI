# HƯỚNG DẪN TEST HỆ THỐNG BÁO CÁO TIẾN ĐỘ HỌC SINH

## 📋 MỤC ĐÍCH
Kiểm tra toàn bộ tính năng Báo cáo Tiến độ Học sinh để đảm bảo:
1. ✅ Tự động tổng hợp kết quả theo thời gian
2. ✅ Biểu đồ thể hiện tiến bộ từng kỹ năng
3. ✅ Xuất báo cáo PDF
4. ✅ Xuất báo cáo Excel (MỚI)
5. ✅ Giao diện horizontal layout đẹp và responsive

---

## 🚀 CHUẨN BỊ

### 1. Khởi động Backend
```bash
cd EnglishWebAI/backend
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
python main.py
```

Kiểm tra backend đã chạy: http://localhost:8000/docs

### 2. Khởi động Frontend
```bash
cd EnglishWebAI/frontend
npm install  # nếu chưa cài
npm run dev
```

Kiểm tra frontend đã chạy: http://localhost:3000

### 3. Đảm bảo có dữ liệu test
- Ít nhất 1 giáo viên
- Ít nhất 1 học sinh
- Học sinh đã nộp ít nhất 5-10 bài tập với các kỹ năng khác nhau
- Các bài tập đã được chấm điểm

---

## 🧪 TEST CASES

### TEST 1: Truy cập trang Báo cáo Tiến độ (Giáo viên)

**Bước thực hiện:**
1. Đăng nhập với tài khoản giáo viên
2. Vào Teacher Dashboard V3
3. Click menu **"Báo cáo tiến bộ"** trong mục **TRỢ LÝ AI**

**Kết quả mong đợi:**
- ✅ Hiển thị danh sách lớp học của giáo viên
- ✅ Có thể chọn lớp
- ✅ Hiển thị danh sách học sinh trong lớp đã chọn
- ✅ Mỗi học sinh có card với avatar, tên, email
- ✅ UI đẹp, responsive

**Screenshot checkpoint:** Chụp màn hình danh sách học sinh

---

### TEST 2: Xem Báo cáo Tiến độ Chi tiết

**Bước thực hiện:**
1. Từ danh sách học sinh, click vào 1 học sinh
2. Chờ hệ thống load dữ liệu

**Kết quả mong đợi:**
- ✅ Hiển thị **Header** với tiêu đề "Báo cáo tiến bộ học tập"
- ✅ Có 2 nút export: **"Xuất PDF"** (xanh dương) và **"Xuất Excel"** (xanh lá)
- ✅ Hiển thị dropdown **"Chu kỳ"** với 3 options: Theo tuần / Theo tháng / Theo học kỳ
- ✅ Hiển thị **4 stat cards** theo layout NGANG:
  - Card 1 (gradient tím): Điểm trung bình (%)
  - Card 2 (vàng): Xu hướng (Đang tiến bộ/Ổn định/Cần cải thiện)
  - Card 3 (xanh dương): Bài tập đã nộp
  - Card 4 (xanh lá): Tỷ lệ hoàn thành (%)
- ✅ Cards có icon lớn, font số to, dễ đọc
- ✅ Hover vào card có hiệu ứng (translateY, shadow, border)

**Screenshot checkpoint:** Chụp màn hình stat cards horizontal

---

### TEST 3: Kiểm tra Biểu đồ Kỹ năng

**Bước thực hiện:**
1. Scroll xuống phần **"Kết quả theo kỹ năng"**

**Kết quả mong đợi:**
- ✅ Hiển thị **SkillProgressChart** với 4 thanh bar:
  - Đọc (Reading) - màu xanh dương (#4472C4)
  - Viết (Writing) - màu cam (#ED7D31)
  - Nghe (Listening) - màu xám (#A5A5A5)
  - Nói (Speaking) - màu vàng (#FFC000)
- ✅ Mỗi thanh có animation từ 0% đến điểm thực tế
- ✅ Hiển thị % bên trong thanh
- ✅ Màu sắc thay đổi theo mức độ (xanh đậm nếu cao, đỏ nếu thấp)

**Screenshot checkpoint:** Chụp màn hình skill progress chart

---

### TEST 4: Kiểm tra Biểu đồ Timeline

**Bước thực hiện:**
1. Scroll xuống phần **"Tiến bộ theo thời gian"**

**Kết quả mong đợi:**
- ✅ Hiển thị **ProgressTimelineChart** dạng line chart
- ✅ Trục X: Các mốc thời gian (tuần/tháng)
- ✅ Trục Y: Điểm số từ 0-100%
- ✅ Đường line màu xanh dương (#4472C4)
- ✅ Area gradient phía dưới đường line
- ✅ Các điểm dữ liệu là circles có thể hover
- ✅ Hover vào điểm hiển thị tooltip với thông tin chi tiết
- ✅ Grid lines ngang để dễ đọc

**Screenshot checkpoint:** Chụp màn hình timeline chart

---

### TEST 5: Kiểm tra Bảng Chi tiết Kỹ năng

**Bước thực hiện:**
1. Scroll xuống phần **"Chi tiết từng kỹ năng"**

**Kết quả mong đợi:**
- ✅ Hiển thị bảng với 4 cột:
  - Kỹ năng
  - Điểm
  - Đánh giá (Xuất sắc/Giỏi/Khá/Trung bình/Cần cải thiện)
  - Khuyến nghị
- ✅ Mỗi kỹ năng có 1 row
- ✅ Badge đánh giá có màu sắc phù hợp:
  - Xuất sắc: xanh lá đậm
  - Giỏi: xanh dương
  - Khá: cam
  - Trung bình: vàng
  - Cần cải thiện: đỏ
- ✅ Hover row có highlight

**Screenshot checkpoint:** Chụp màn hình skills table

---

### TEST 6: Tạo Snapshot Mới (Tự động tổng hợp)

**Bước thực hiện:**
1. Click nút **"Tạo snapshot mới"** ở header
2. Chờ xử lý (có thể mất 2-5 giây)
3. Refresh page hoặc đợi auto-reload

**Kết quả mong đợi:**
- ✅ Hiển thị loading state "Đang tạo..."
- ✅ Sau khi hoàn thành, hiển thị alert "Đã tạo snapshot thành công!"
- ✅ Dữ liệu được cập nhật với snapshot mới nhất
- ✅ Tất cả bài nộp của học sinh được tính toán tự động:
  - Điểm trung bình
  - Điểm từng kỹ năng
  - Số lượng bài tập
  - Tỷ lệ hoàn thành
  - Xu hướng (so sánh với snapshot trước)

**Kiểm tra backend:**
```bash
# Check console log backend
# Phải thấy log "Creating progress snapshot for student..."
# Phải thấy queries SELECT submissions, exercises
```

**Screenshot checkpoint:** Chụp màn hình alert thành công

---

### TEST 7: Thay đổi Chu kỳ (Period Type)

**Bước thực hiện:**
1. Thay đổi dropdown **"Chu kỳ"** từ "Theo tuần" sang "Theo tháng"
2. Chờ load dữ liệu

**Kết quả mong đợi:**
- ✅ Hiển thị loading spinner
- ✅ Data được reload
- ✅ Timeline chart cập nhật với snapshots theo tháng
- ✅ X-axis labels thay đổi (Tháng 1, Tháng 2... thay vì Tuần 1, Tuần 2...)
- ✅ Stat cards cập nhật với snapshot mới nhất của period type đã chọn

---

### TEST 8: Xuất Báo cáo PDF ✅

**Bước thực hiện:**
1. Click nút **"Xuất PDF"** (màu xanh dương)
2. Chờ xử lý

**Kết quả mong đợi:**
- ✅ Nút hiển thị loading: "Đang xuất..." với spinner icon
- ✅ Sau 2-5 giây, file PDF tự động download
- ✅ Tên file: `bao_cao_{username}_{YYYYMMDD}.pdf`
- ✅ Mở PDF và kiểm tra nội dung:
  - Header với tiêu đề "BÁO CÁO TIẾN BỘ HỌC TẬP"
  - Thông tin học sinh (tên, email, lớp, giáo viên)
  - Điểm trung bình, xu hướng
  - Bảng kỹ năng
  - Biểu đồ (nếu có)
  - Hoạt động gần đây
  - Nhận xét giáo viên
  - Khuyến nghị
- ✅ PDF có format đẹp, in được

**Screenshot checkpoint:** Chụp màn hình PDF đã mở

---

### TEST 9: Xuất Báo cáo Excel ✅ (MỚI)

**Bước thực hiện:**
1. Click nút **"Xuất Excel"** (màu xanh lá)
2. Chờ xử lý

**Kết quả mong đợi:**
- ✅ Nút hiển thị loading: "Đang xuất..." với spinner icon
- ✅ Sau 2-5 giây, file Excel tự động download
- ✅ Tên file: `bao_cao_{username}_{YYYYMMDD}.xlsx`
- ✅ Mở Excel và kiểm tra nội dung:

**Sheet "Báo cáo tiến bộ":**

**1. Tiêu đề (Row 1):**
- ✅ Merged cells A1:F1
- ✅ Text: "BÁO CÁO TIẾN BỘ HỌC TẬP"
- ✅ Font bold, size 16, center aligned

**2. Thông tin học sinh (Row 3-7):**
- ✅ Row 3: Học sinh: [Tên]
- ✅ Row 4: Email: [Email]
- ✅ Row 5: Lớp: [Tên lớp]
- ✅ Row 6: Giáo viên: [Tên GV]
- ✅ Row 7: Ngày xuất: [DD/MM/YYYY HH:MM]

**3. Section "TỔNG QUAN":**
- ✅ Header row màu tím gradient (#667eea)
- ✅ Font trắng, bold
- ✅ 5 cột: Điểm TB | Xu hướng | Bài nộp | Bài chấm | Tỷ lệ HT
- ✅ Borders đầy đủ
- ✅ Data row với giá trị tương ứng

**4. Section "KẾT QUẢ THEO KỸ NĂNG":**
- ✅ Header row màu tím gradient
- ✅ 5 cột: Kỹ năng | Điểm | Số bài | Đánh giá | Khuyến nghị
- ✅ 4 rows cho 4 kỹ năng (Reading, Writing, Listening, Speaking)
- ✅ Đánh giá chính xác theo điểm:
  - ≥90: Xuất sắc - Tiếp tục duy trì
  - 80-89: Giỏi - Phát huy thêm
  - 70-79: Khá - Cố gắng hơn nữa
  - 60-69: Trung bình - Cần luyện tập thêm
  - <60: Cần cải thiện - Tăng cường luyện tập

**5. Section "TIẾN BỘ THEO THỜI GIAN":**
- ✅ Header row màu tím
- ✅ 6 cột: Thời gian | Điểm TB | Đọc | Viết | Nghe | Nói
- ✅ Tối đa 20 rows với lịch sử snapshots
- ✅ Thời gian format DD/MM/YYYY hoặc period label

**6. Section "BÀI TẬP GẦN ĐÂY":**
- ✅ Header row màu tím
- ✅ 5 cột: Tên bài tập | Kỹ năng | Điểm | Ngày nộp | Ngày chấm
- ✅ Tối đa 20 rows với bài tập gần nhất
- ✅ Điểm hiển thị dạng % hoặc "Chưa chấm"
- ✅ Ngày format DD/MM/YYYY

**7. Formatting:**
- ✅ Tất cả columns auto-adjusted width
- ✅ Center alignment cho headers và data numbers
- ✅ Left alignment cho text
- ✅ Borders cho tất cả cells có data

**Screenshot checkpoint:** Chụp màn hình Excel đã mở

---

### TEST 10: Responsive - Mobile View

**Bước thực hiện:**
1. Mở DevTools (F12)
2. Chuyển sang Mobile view (Toggle device toolbar)
3. Chọn iPhone 12 Pro hoặc tương tự
4. Reload page

**Kết quả mong đợi:**
- ✅ Stat cards xếp thành **1 cột** (không phải 4 cột)
- ✅ Export buttons xếp dọc hoặc responsive
- ✅ Charts scale đúng, không bị tràn
- ✅ Table có horizontal scroll
- ✅ Text không bị cắt
- ✅ Buttons đủ lớn để touch dễ dàng

**Screenshot checkpoint:** Chụp màn hình mobile view

---

### TEST 11: Responsive - Tablet View

**Bước thực hiện:**
1. Trong DevTools, chọn iPad hoặc tablet
2. Reload page

**Kết quả mong đợi:**
- ✅ Stat cards xếp thành **2 cột**
- ✅ Charts hiển thị tốt
- ✅ Spacing hợp lý

**Screenshot checkpoint:** Chụp màn hình tablet view

---

### TEST 12: Kiểm tra Permissions (Phụ huynh)

**Bước thực hiện:**
1. Đăng xuất tài khoản giáo viên
2. Đăng nhập với tài khoản **phụ huynh**
3. Vào Parent Dashboard
4. Click **"Theo dõi tiến độ"** hoặc **"Track Progress"**
5. Chọn con em

**Kết quả mong đợi:**
- ✅ Hiển thị báo cáo tiến độ của con
- ✅ UI giống với teacher view
- ✅ Có nút export PDF và Excel
- ✅ Chỉ thấy con của mình, không thấy học sinh khác
- ✅ Không thấy nút "Tạo snapshot mới" (chỉ teacher mới có)

---

### TEST 13: Kiểm tra Permissions (Học sinh)

**Bước thực hiện:**
1. Đăng xuất
2. Đăng nhập với tài khoản **học sinh**
3. Vào Student Dashboard
4. Tìm mục báo cáo tiến độ hoặc progress

**Kết quả mong đợi:**
- ✅ Học sinh chỉ thấy báo cáo của chính mình
- ✅ Có thể export PDF/Excel cho chính mình
- ✅ Không thể tạo snapshot
- ✅ Không thể xem báo cáo của học sinh khác

---

### TEST 14: Error Handling - Không có dữ liệu

**Bước thực hiện:**
1. Chọn 1 học sinh **chưa nộp bài tập nào**
2. Hoặc chọn học sinh chưa có snapshot

**Kết quả mong đợi:**
- ✅ Không crash
- ✅ Hiển thị empty state với icon và message:
  - Icon: FileText
  - Title: "Chưa có dữ liệu"
  - Message: "Chưa có đủ dữ liệu để hiển thị báo cáo tiến bộ. Hãy hoàn thành thêm các bài tập để xem tiến bộ của bạn."
- ✅ Nút export bị disable hoặc ẩn

---

### TEST 15: Error Handling - Network Error

**Bước thực hiện:**
1. Mở page báo cáo tiến độ
2. Stop backend server
3. Reload page hoặc thử export

**Kết quả mong đợi:**
- ✅ Hiển thị error message: "Không thể tải dữ liệu tiến bộ. Vui lòng thử lại sau."
- ✅ Có nút "Thử lại"
- ✅ Không crash
- ✅ Export hiển thị alert lỗi thay vì crash

---

### TEST 16: Performance - Large Data

**Bước thực hiện:**
1. Chọn học sinh có **nhiều bài nộp** (>50 bài)
2. Tạo snapshot
3. Xem báo cáo

**Kết quả mong đợi:**
- ✅ Snapshot creation hoàn thành trong <10 giây
- ✅ Page load trong <3 giây
- ✅ Charts render smooth, không lag
- ✅ Export PDF/Excel hoàn thành trong <10 giây

---

### TEST 17: Data Accuracy - Tính toán chính xác

**Bước thực hiện:**
1. Chọn 1 học sinh
2. Ghi lại điểm từng bài tập và kỹ năng (từ database hoặc UI)
3. Tính toán thủ công:
   - Điểm TB = Tổng điểm / Tổng bài
   - Điểm từng kỹ năng = Tổng điểm kỹ năng đó / Số bài kỹ năng đó
4. So sánh với snapshot

**Kết quả mong đợi:**
- ✅ Điểm trung bình khớp với tính toán thủ công (sai số <0.1%)
- ✅ Điểm từng kỹ năng chính xác
- ✅ Số lượng bài nộp/chấm đúng
- ✅ Tỷ lệ hoàn thành = (Bài chấm / Bài nộp) * 100

---

### TEST 18: Trend Calculation

**Bước thực hiện:**
1. Tạo 2 snapshots với khoảng cách thời gian
2. Snapshot 2 có điểm cao hơn Snapshot 1: Trend = "improving"
3. Snapshot 2 có điểm thấp hơn: Trend = "declining"
4. Snapshot 2 có điểm tương đương: Trend = "stable"

**Kết quả mong đợi:**
- ✅ Xu hướng hiển thị đúng
- ✅ Icon phù hợp:
  - Improving: TrendingUp (xanh lá)
  - Declining: TrendingDown (đỏ)
  - Stable: Minus (xám)
- ✅ Text phù hợp:
  - Improving: "Đang tiến bộ"
  - Declining: "Cần cải thiện"
  - Stable: "Ổn định"

---

## 📊 CHECKLIST TỔNG HỢP

### ✅ Tính năng 1: Tự động tổng hợp kết quả theo thời gian
- [x] Snapshot được tạo thành công
- [x] Tự động tính điểm trung bình
- [x] Tự động tính điểm từng kỹ năng
- [x] Tự động đếm số bài nộp/chấm
- [x] Tự động tính tỷ lệ hoàn thành
- [x] Tự động xác định xu hướng
- [x] Lưu trữ theo chu kỳ (tuần/tháng/học kỳ)
- [x] API permissions đúng
- [x] Data chính xác

### ✅ Tính năng 2: Biểu đồ thể hiện tiến bộ từng kỹ năng
- [x] SkillProgressChart hiển thị 4 kỹ năng
- [x] Màu sắc phân biệt rõ ràng
- [x] Animation mượt mà
- [x] Hiển thị % chính xác
- [x] ProgressTimelineChart hiển thị đường line
- [x] Grid lines và labels rõ ràng
- [x] Tooltip khi hover
- [x] Responsive trên mobile/tablet

### ✅ Tính năng 3: Xuất báo cáo PDF
- [x] Nút export hoạt động
- [x] Loading state hiển thị
- [x] File download thành công
- [x] Tên file đúng format
- [x] Nội dung PDF đầy đủ
- [x] Format đẹp, in được
- [x] Permissions đúng (chỉ user có quyền)

### ✅ Tính năng 4: Xuất báo cáo Excel (MỚI)
- [x] Nút export hoạt động
- [x] Loading state hiển thị
- [x] File download thành công (.xlsx)
- [x] Tên file đúng format
- [x] Sheet "Báo cáo tiến bộ" có đủ sections
- [x] Headers màu tím, font trắng
- [x] Borders đầy đủ
- [x] Data chính xác
- [x] Auto-adjusted column width
- [x] Có thể mở và chỉnh sửa trong Excel
- [x] Permissions đúng

### ✅ Tính năng 5: Giao diện horizontal layout
- [x] 4 stat cards xếp ngang (desktop)
- [x] 2 cột (tablet)
- [x] 1 cột (mobile)
- [x] Icons lớn, màu sắc đẹp
- [x] Font size lớn, dễ đọc
- [x] Hover effects mượt mà
- [x] Gradient backgrounds
- [x] Responsive breakpoints đúng
- [x] 2 export buttons song song

---

## 🐛 BUG REPORT TEMPLATE

Nếu phát hiện bug, báo cáo theo format:

```
**Bug Title:** [Mô tả ngắn gọn]

**Test Case:** TEST [Số]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
[Kết quả mong đợi]

**Actual Result:**
[Kết quả thực tế]

**Screenshots:**
[Attach screenshots]

**Browser/Device:**
[Chrome 120 / Safari / Mobile / etc]

**Console Errors:**
[Paste console errors if any]

**Priority:**
[High / Medium / Low]
```

---

## ✅ SIGN-OFF

Test được thực hiện bởi: ___________________
Ngày test: ___________________
Kết quả: [ ] PASS  [ ] FAIL  [ ] PASS WITH ISSUES

**Issues found:** ___________________

**Notes:** ___________________

---

**Tài liệu test này cập nhật:** 29/10/2024
**Phiên bản:** 1.0

