# 📊 HƯỚNG DẪN UPLOAD POWERPOINT & TÀI LIỆU

## 🎯 **VỊ TRÍ CHỨC NĂNG**

Chức năng upload PowerPoint/tài liệu **KHÔNG nằm trong sidebar**, mà **nằm trong trang Quản lý lớp học**.

---

## 📍 **CÁCH TÌM KIẾM (4 BƯỚC ĐƠN GIẢN)**

### **Bước 1: Vào Teacher Dashboard**
```
🌐 URL: http://localhost:3000/teacher-dashboard
```

### **Bước 2: Click vào "Quản lý lớp học" trong sidebar bên trái**
```
📚 QUẢN LÝ DẠY HỌC
  └─ 🎓 Quản lý lớp học  ← CLICK VÀO ĐÂY!
```

### **Bước 3: Chọn lớp từ danh sách bên trái**
```
┌────────────────────────────┐
│ 📋 Lớp học của tôi        │
├────────────────────────────┤
│ 🎓 Lớp 10A1               │  ← CLICK CHỌN LỚP
│    15 học sinh             │
├────────────────────────────┤
│ 🎓 Lớp 11B2               │
│    18 học sinh             │
└────────────────────────────┘
```

### **Bước 4: Click nút "📁 Tài liệu lớp học" ở góc phải trên**
```
┌──────────────────────────────────────────────────┐
│ Lớp 10A1                    15 học sinh         │
│                                                   │
│ [+ Thêm học sinh]  [↑ Import Excel]  [📁 Tài liệu lớp học] ← CLICK VÀO ĐÂY!
└──────────────────────────────────────────────────┘
```

---

## 🖼️ **HÌNH ẢNH MINH HỌA**

### **Màn hình Quản lý lớp học:**
```
┌─────────────┬──────────────────────────────────────────┐
│             │  Lớp 10A1                    15 học sinh │
│ 📋 Lớp học  │                                           │
│ của tôi     │  Quản lý học sinh trong lớp              │
│             │                                           │
│ 🎓 Lớp 10A1 │  [+ Thêm học sinh]  [↑ Import Excel]     │
│   15 HS     │                                           │
│ ✅ ĐANG MỞ  │  [📁 Tài liệu lớp học]  ← NÚT NÀY!      │
│             │                                           │
│ 🎓 Lớp 11B2 │  ┌─────────────────────────────────────┐ │
│   18 HS     │  │ Tìm kiếm học sinh...                 │ │
│             │  └─────────────────────────────────────┘ │
│             │                                           │
│             │  📝 Danh sách học sinh                    │
└─────────────┴──────────────────────────────────────────┘
```

---

## 📤 **SAU KHI CLICK NÚT "TÀI LIỆU LỚP HỌC"**

Modal (cửa sổ popup) sẽ hiện ra với **2 phần**:

### **Phần 1: Form Upload (phía trên)**
```
┌─────────────────────────────────────────────────┐
│ 📁 Tài liệu lớp học - Lớp 10A1          ✕      │
├─────────────────────────────────────────────────┤
│                                                  │
│ 📤 Tải lên tài liệu mới                         │
│                                                  │
│ Tiêu đề:                                        │
│ [_____________________________________]         │
│                                                  │
│ Mô tả (tùy chọn):                               │
│ [_____________________________________]         │
│                                                  │
│ Chọn file (PDF, Word, PowerPoint,...):          │
│ [📎 Chọn file...]                                │
│                                                  │
│ [📤 Tải lên tài liệu]                           │
└─────────────────────────────────────────────────┘
```

### **Phần 2: Danh sách tài liệu đã tải (phía dưới)**
```
┌─────────────────────────────────────────────────┐
│ 📚 Danh sách tài liệu (3)                       │
├─────────────────────────────────────────────────┤
│ 📊 Bài giảng Tuần 1.pptx                        │
│    PowerPoint về ngữ pháp                       │
│    📁 presentation | 📅 28/10/2025              │
│    [⬇️ Tải về]                                  │
├─────────────────────────────────────────────────┤
│ 📄 Đề kiểm tra giữa kỳ.pdf                      │
│    Đề thi trắc nghiệm                           │
│    📁 pdf | 📅 27/10/2025                       │
│    [⬇️ Tải về]                                  │
└─────────────────────────────────────────────────┘
```

---

## 📁 **ĐỊNH DẠNG FILE HỖ TRỢ**

| Loại | Định dạng | Icon |
|------|-----------|------|
| **PowerPoint** | `.ppt`, `.pptx` | 📊 |
| **PDF** | `.pdf` | 📄 |
| **Word** | `.doc`, `.docx` | 📝 |
| **Excel** | `.xls`, `.xlsx` | 📑 |
| **Image** | `.jpg`, `.png`, `.gif`, `.svg`, `.webp` | 🖼️ |
| **Audio** | `.mp3`, `.wav`, `.ogg`, `.m4a` | 🎵 |
| **Video** | `.mp4`, `.avi`, `.mov`, `.webm` | 🎬 |
| **Text** | `.txt`, `.md`, `.csv` | 📝 |

---

## ✅ **CÁCH SỬ DỤNG**

### **Upload file mới:**
1. Click nút **"📁 Tài liệu lớp học"**
2. Nhập **tiêu đề** (ví dụ: "Bài giảng Tuần 1")
3. Nhập **mô tả** (tùy chọn)
4. Click **"📎 Chọn file..."** và chọn file PowerPoint từ máy tính
5. Click **"📤 Tải lên tài liệu"**
6. Đợi 2-3 giây → Thấy thông báo "✅ Tải lên thành công!"

### **Xem tài liệu đã tải:**
- Cuộn xuống phần **"📚 Danh sách tài liệu"**
- Tất cả file đã upload sẽ hiển thị ở đây

### **Tải về tài liệu:**
- Click nút **"⬇️ Tải về"** bên cạnh tên file

---

## 🚨 **NẾU KHÔNG TÌM THẤY NÚT**

### **Kiểm tra các điểm sau:**

1. **Đã chọn lớp chưa?**
   - Phải click vào **tên lớp** ở sidebar bên trái trước
   - Nút chỉ hiện ra khi đã chọn lớp

2. **Đã đăng nhập với tài khoản Teacher?**
   - Chức năng chỉ dành cho Giáo viên
   - Học sinh không thấy nút này

3. **Làm mới trang:**
   - Nhấn `Ctrl + Shift + R` (Windows)
   - Nhấn `Cmd + Shift + R` (Mac)

4. **Xóa cache trình duyệt:**
   - F12 → Application → Clear storage → Clear site data

---

## 📸 **VIDEO HƯỚNG DẪN (GIF)**

```
Bước 1: Dashboard → "Quản lý lớp học"
         ↓
Bước 2: Click chọn lớp (bên trái)
         ↓
Bước 3: Nút "📁 Tài liệu lớp học" hiện ra (bên phải)
         ↓
Bước 4: Click nút → Modal mở ra
         ↓
Bước 5: Chọn file PowerPoint → Upload
         ↓
Bước 6: ✅ Hoàn tất!
```

---

## 💡 **MẸO NHANH**

- **Phím tắt:** Không có (phải dùng chuột)
- **Vị trí cố định:** Luôn ở góc phải trên, cùng hàng với "Thêm học sinh" và "Import Excel"
- **Màu nút:** Xám/Trắng với icon 📁
- **Kích thước:** Nút vừa phải, dễ nhìn thấy

---

## 🎉 **KẾT QUẢ MONG ĐỢI**

Sau khi upload thành công:
- ✅ File được lưu trên server
- ✅ Xuất hiện trong danh sách tài liệu
- ✅ Học sinh có thể tải về từ trang lớp học của họ
- ✅ Giáo viên có thể quản lý (xem, tải về)

---

## 📞 **HỖ TRỢ**

Nếu vẫn không tìm thấy:
1. Kiểm tra URL: `http://localhost:3000/teacher-dashboard`
2. Kiểm tra role: Phải là **Teacher**
3. Kiểm tra đã chọn lớp: Click vào tên lớp bên trái
4. Chụp màn hình và báo lỗi

**Happy Teaching! 📊**

