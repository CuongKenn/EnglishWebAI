# Hướng dẫn Test các Role

## Tổng quan
Hệ thống có 4 role chính: Student, Teacher, Parent, và Admin (Super Admin).

## Cách Test Nhanh

### Phương pháp 1: Qua trang Login
1. Mở http://localhost:5173/login
2. Nhập bất kỳ username/password
3. Click "Sign in"
4. Backend sẽ trả về role từ API (response.data.role)

### Phương pháp 2: Test trực tiếp trong code (Development)
Mở file `src/App.jsx` và thay đổi:

```javascript
// FOR TESTING: Set to true and change role to test different views
const [isLoggedIn, setIsLoggedIn] = useState(true);  // <- Đổi thành true
const [userRole, setUserRole] = useState('admin');   // <- Đổi role ở đây
```

Role có thể là: `'student'`, `'teacher'`, `'parent'`, `'admin'`

## Chi tiết từng Role

### 1. STUDENT (Học sinh)
**Navbar menu:**
- Học bài
- Tin tức
- Tham gia lớp học
- Học liệu cơ bản
- Làm bài tập
- Hỏi đáp

**Quyền truy cập:**
- ✅ Các trang công khai
- ✅ Trang student features
- ❌ Trang giáo viên
- ❌ Trang quản lý admin

---

### 2. TEACHER (Giáo viên)
**Navbar menu:**
- Tất cả menu của Student +
- **👨‍🏫 Trang giáo viên** (special button)

**Click vào "Trang giáo viên" → Dashboard như ảnh Dasher:**
- Thống kê: Tổng dự án, Nhiệm vụ, Học sinh, Năng suất
- Bảng lớp học đang hoạt động
- Biểu đồ tiến độ công việc
- Giao diện giống template Dasher (xanh lá)

**Quyền truy cập:**
- ✅ Tất cả tính năng của Student
- ✅ Trang giáo viên (/teacher-dashboard)
- ❌ Trang quản lý admin

**Test:**
```javascript
// src/App.jsx
const [isLoggedIn, setIsLoggedIn] = useState(true);
const [userRole, setUserRole] = useState('teacher');
```
Sau đó vào http://localhost:5173/teacher-dashboard

---

### 3. ADMIN (Super Admin)
**Navbar menu:**
- Tất cả menu của Student +
- **⚙️ Quản lý** (special button)

**Click vào "Quản lý" → Dashboard với Sidebar như ảnh Phoenix:**

**Sidebar menu gồm:**
- **Quản lý tài khoản**
  - 👥 Tài khoản người dùng
  
- **Quản lý lớp học và khóa học**
  - 📚 Lớp học & Phân công
  
- **Thống kê và báo cáo**
  - 📊 Thống kê tổng quan
  
- **Cài đặt**
  - ⚙️ Cấu hình hệ thống
  - 💾 Sao lưu dữ liệu
  - 📋 Nhật ký hệ thống

**Các trang admin:**
1. **Tài khoản người dùng** (/admin-dashboard/manage-accounts)
   - CRUD người dùng
   - Tìm kiếm, lọc theo role
   - Thống kê users

2. **Lớp học & Phân công** (/admin-dashboard/manage-classes)
   - CRUD lớp học
   - Phân công giáo viên
   - Xem sĩ số, lịch học

3. **Thống kê tổng quan** (/admin-dashboard/overview-stats)
   - Dashboard với charts
   - Biểu đồ tiến độ
   - Leaderboard giáo viên
   - Hoạt động gần đây

**Quyền truy cập:**
- ✅ Tất cả tính năng của Student
- ✅ Tất cả trang admin (/admin-dashboard/*)
- ❌ Trang giáo viên (có thể điều chỉnh nếu cần)

**Test:**
```javascript
// src/App.jsx
const [isLoggedIn, setIsLoggedIn] = useState(true);
const [userRole, setUserRole] = useState('admin');
```
Sau đó vào http://localhost:5173/admin-dashboard

---

### 4. PARENT (Phụ huynh)
**Navbar menu:**
- Theo dõi kết quả học tập
- Nhận thông báo
- Trao đổi với giáo viên

**Quyền truy cập:**
- ✅ Các trang phụ huynh
- ❌ Trang student/teacher/admin

---

## Bảo mật Routes

### Protected Routes
Các route sau được bảo vệ bởi `ProtectedRoute` component:

**Admin only:**
- `/admin-dashboard/*` - Tất cả trang admin

**Teacher only:**
- `/teacher-dashboard` - Dashboard giáo viên

**Cơ chế:**
1. Kiểm tra `isLoggedIn` - nếu false → redirect /login
2. Kiểm tra `userRole` - nếu không đúng → hiển thị "⛔ Truy cập bị từ chối"

---

## Test Flow đầy đủ

### Test Admin Flow
1. Set role = 'admin' trong App.jsx hoặc login qua API
2. Kiểm tra navbar có button "⚙️ Quản lý"
3. Click "Quản lý" → Vào /admin-dashboard
4. Kiểm tra sidebar hiển thị đầy đủ menu
5. Click từng menu item kiểm tra routing
6. Test CRUD trên từng trang
7. Thử truy cập /teacher-dashboard → Bị chặn

### Test Teacher Flow
1. Set role = 'teacher' trong App.jsx
2. Kiểm tra navbar có button "👨‍🏫 Trang giáo viên"
3. Click vào → Vào /teacher-dashboard
4. Kiểm tra dashboard hiển thị đúng (Dasher style)
5. Thử truy cập /admin-dashboard → Bị chặn

### Test Student Flow
1. Set role = 'student'
2. Kiểm tra navbar chỉ có menu student
3. Không có button đặc biệt
4. Thử truy cập /admin-dashboard → Bị chặn
5. Thử truy cập /teacher-dashboard → Bị chặn

---

## Giao diện

### Admin Dashboard (Phoenix Style)
- **Màu chủ đạo**: Tím (#667eea → #764ba2)
- **Layout**: Sidebar trái + Main content
- **Sidebar**: Menu phân cấp với icons
- **Content**: Cards, tables, charts

### Teacher Dashboard (Dasher Style)
- **Màu chủ đạo**: Xanh lá (#10b981)
- **Layout**: Full width, no sidebar
- **Stats Cards**: 4 cards với icons màu
- **Table**: Project list với progress bars
- **Charts**: Circular progress, breakdown cards

---

## Notes cho Backend

Backend cần trả về trong login response:
```json
{
  "access_token": "...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin"  // ← Phải có field này
  },
  "role": "admin"  // Hoặc trực tiếp ở root level
}
```

Frontend sẽ lấy `response.data.role` để set userRole.

---

## Troubleshooting

**Q: Navbar không hiển thị menu admin/teacher?**
- A: Kiểm tra userRole state trong App.jsx
- Kiểm tra isLoggedIn = true

**Q: Vào trang admin bị "Truy cập bị từ chối"?**
- A: Kiểm tra userRole === 'admin'
- Kiểm tra route path đúng chưa

**Q: Sidebar không hiển thị?**
- A: Đảm bảo đang ở route /admin-dashboard/*
- Kiểm tra CSS đã load chưa

**Q: Login không hoạt động?**
- A: Kiểm tra backend API endpoint
- Xem console log có error không
- Tạm thời có thể set trực tiếp trong App.jsx để test

