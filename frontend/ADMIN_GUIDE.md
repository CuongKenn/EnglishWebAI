# Hướng dẫn sử dụng Hệ thống Quản lý

## Tổng quan

Hệ thống có 2 dashboard chính:
1. **Admin Dashboard** (Super Admin) - Phoenix style với sidebar
2. **Teacher Dashboard** (Giáo viên) - Dasher style

### Admin Dashboard
Cung cấp 3 chức năng chính:
1. **Quản lý tài khoản** - Quản lý giáo viên và học sinh
2. **Quản lý lớp học** - Quản lý lớp học và phân công giảng dạy
3. **Thống kê tổng quan** - Xem báo cáo và phân tích hệ thống

### Teacher Dashboard
Cung cấp:
1. **Quản lý lớp học** - Dashboard theo dõi lớp học đang dạy
2. **Theo dõi tiến độ** - Xem tiến độ công việc và nhiệm vụ
3. **Thống kê** - Số liệu về học sinh và năng suất

## Bảo mật

### Quyền truy cập
- ✅ Chỉ người dùng có role `admin` mới có thể truy cập các trang quản lý
- ✅ Menu quản lý chỉ hiển thị trên navbar khi role là `admin`
- ✅ Các role khác (student, teacher, parent) sẽ không thấy menu và không thể truy cập
- ✅ Nếu cố gắng truy cập trực tiếp URL, sẽ hiển thị trang "Truy cập bị từ chối"

### Protected Routes
Tất cả routes admin đều được bảo vệ bởi component `ProtectedRoute`:
- `/manage-accounts` - Quản lý tài khoản
- `/manage-classes-admin` - Quản lý lớp học
- `/overview-stats` - Thống kê tổng quan

## Cách test

> **Xem chi tiết**: Đọc file `TEST_ROLES.md` để biết cách test đầy đủ

### 1. Đăng nhập với role Admin
**Phương pháp 1: Qua API (Production)**
1. Mở trang đăng nhập: http://localhost:5173/login
2. Nhập username và password
3. Backend sẽ trả về role trong response
4. Frontend tự động chuyển đến trang phù hợp với role

**Phương pháp 2: Test nhanh (Development)**
Mở `src/App.jsx` và sửa:
```javascript
const [isLoggedIn, setIsLoggedIn] = useState(true);  // ← true để bypass login
const [userRole, setUserRole] = useState('admin');    // ← 'admin' để test admin
```

### 2. Test Teacher Dashboard
```javascript
// src/App.jsx
const [isLoggedIn, setIsLoggedIn] = useState(true);
const [userRole, setUserRole] = useState('teacher');  // ← 'teacher'
```
Sau đó vào: http://localhost:5173/teacher-dashboard

### 3. Truy cập Admin Dashboard

#### Trang chính
- URL: `/admin-dashboard`
- Có sidebar navigation theo phong cách Phoenix
- Màu tím gradient (#667eea → #764ba2)

#### Quản lý tài khoản
- URL: `/admin-dashboard/manage-accounts`
- Tính năng:
  - Xem danh sách tất cả người dùng (giáo viên, học sinh)
  - Thêm tài khoản mới
  - Chỉnh sửa thông tin tài khoản
  - Xóa tài khoản
  - Tìm kiếm theo tên/email
  - Lọc theo vai trò (giáo viên/học sinh)
  - Thống kê: Tổng người dùng, giáo viên, học sinh, đang hoạt động

#### Quản lý lớp học
- URL: `/admin-dashboard/manage-classes`
- Tính năng:
  - Xem danh sách lớp học (dạng card)
  - Tạo lớp học mới
  - Chỉnh sửa thông tin lớp học
  - Xóa lớp học
  - Phân công giáo viên cho lớp
  - Xem sĩ số và lịch học
  - Thống kê: Tổng lớp, lớp đang mở, tổng học sinh, trung bình/lớp

#### Thống kê tổng quan
- URL: `/admin-dashboard/overview-stats`
- Tính năng:
  - Dashboard với các chỉ số chính
  - Biểu đồ tiến độ khóa học
  - Biểu đồ mức độ tương tác (pie chart)
  - Danh sách hoạt động gần đây
  - Bảng xếp hạng giáo viên xuất sắc
  - Thống kê đơn hàng, học sinh mới, doanh thu

### 4. Teacher Dashboard

- URL: `/teacher-dashboard`
- Giao diện theo phong cách Dasher
- Màu xanh lá (#10b981)
- Layout full width, không có sidebar
- Hiển thị:
  - Stats cards: Tổng dự án, Nhiệm vụ, Học sinh, Năng suất
  - Bảng lớp học đang hoạt động với progress bars
  - Biểu đồ circular progress
  - Breakdown tasks: Completed, In-Progress, Upcoming

## Giao diện

### Admin Dashboard (Phoenix Style)
Giao diện được thiết kế theo phong cách Phoenix Admin với:
- 🎨 Gradient màu tím đẹp mắt (#667eea → #764ba2)
- 📊 Card thống kê với hiệu ứng hover
- 📈 Biểu đồ tiến độ và pie chart
- 🎯 Layout responsive, hoạt động tốt trên mobile
- ✨ Animation mượt mà
- 🔍 Tìm kiếm và lọc dữ liệu real-time
- 📱 Modal dialog cho thêm/sửa
- 🗂️ Sidebar navigation với icons

### Teacher Dashboard (Dasher Style)
Giao diện được thiết kế theo phong cách Dasher với:
- 💚 Màu xanh lá chủ đạo (#10b981)
- 📊 Stats cards với icon màu sắc
- 📋 Bảng project với progress bars
- 🎯 Circular progress chart
- 📈 Breakdown cards cho task status
- 🎨 Clean và modern UI
- 📱 Responsive design

## Cấu trúc Code

```
frontend/src/
├── components/
│   ├── Navbar/
│   │   ├── Navbar.jsx              # Navbar với menu động theo role
│   │   └── Navbar.css              # Styles cho special-link
│   └── ProtectedRoute/
│       └── ProtectedRoute.jsx      # Component bảo vệ routes
├── pages/
│   ├── Admin/
│   │   ├── AdminDashboard/
│   │   │   ├── AdminDashboard.jsx  # Main dashboard với sidebar
│   │   │   └── AdminDashboard.css  # Phoenix style
│   │   ├── ManageAccounts/
│   │   │   ├── ManageAccounts.jsx  # Quản lý tài khoản
│   │   │   └── ManageAccounts.css
│   │   ├── ManageClasses/
│   │   │   ├── ManageClasses.jsx   # Quản lý lớp học
│   │   │   └── ManageClasses.css
│   │   └── OverviewStats/
│   │       ├── OverviewStats.jsx   # Thống kê tổng quan
│   │       └── OverviewStats.css
│   └── Teacher/
│       └── TeacherDashboard/
│           ├── TeacherDashboard.jsx # Dashboard giáo viên
│           └── TeacherDashboard.css # Dasher style
└── App.jsx                          # Routes với ProtectedRoute
```

## Tích hợp API (Sắp tới)

Hiện tại đang sử dụng dữ liệu mẫu (mock data). Khi backend sẵn sàng:

### 1. Quản lý tài khoản
```javascript
// GET /api/admin/users - Lấy danh sách users
// POST /api/admin/users - Tạo user mới
// PUT /api/admin/users/:id - Cập nhật user
// DELETE /api/admin/users/:id - Xóa user
```

### 2. Quản lý lớp học
```javascript
// GET /api/admin/classes - Lấy danh sách lớp
// POST /api/admin/classes - Tạo lớp mới
// PUT /api/admin/classes/:id - Cập nhật lớp
// DELETE /api/admin/classes/:id - Xóa lớp
```

### 3. Thống kê
```javascript
// GET /api/admin/stats - Lấy thống kê tổng quan
// GET /api/admin/activities - Hoạt động gần đây
// GET /api/admin/leaderboard - Bảng xếp hạng
```

## Lưu ý

1. **Testing**: 
   - Trong development, có thể set role trực tiếp trong App.jsx
   - Trong production, role được lấy từ API response: `response.data.role`

2. **Dữ liệu mẫu**: Tất cả dữ liệu hiện tại là mock data. Cần thay thế bằng API calls khi backend sẵn sàng.

3. **Phân quyền**: Đảm bảo backend cũng kiểm tra quyền admin trước khi cho phép thao tác.

4. **State Management**: Có thể cân nhắc sử dụng Redux/Context API khi ứng dụng phức tạp hơn.

5. **Biểu đồ**: Placeholder chart có thể được thay thế bằng Chart.js, Recharts, hoặc D3.js.

## Tính năng sắp tới

- [ ] Tích hợp API thật
- [ ] Export dữ liệu ra Excel/PDF
- [ ] Upload ảnh đại diện cho users
- [ ] Gửi email thông báo
- [ ] Log lịch sử thay đổi
- [ ] Phân quyền chi tiết hơn (admin levels)
- [ ] Dark mode
- [ ] Đa ngôn ngữ

