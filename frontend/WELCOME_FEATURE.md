# Tính năng Thông báo Chào mừng

## Mô tả
Sau khi đăng nhập thành công, người dùng sẽ:
1. ✅ Được chuyển về trang Home
2. ✅ Thấy thông báo chào mừng đẹp mắt ở giữa màn hình
3. ✅ Thông báo tự động đóng sau 3 giây
4. ✅ Hiển thị thông tin theo role (Student, Teacher, Admin, Parent)

## Giao diện Thông báo

### Các thành phần:
- **Icon role** - Biểu tượng động theo role
- **Tiêu đề** - "Chào mừng [Role]!"
- **Thông điệp** - Lời chào phù hợp với role
- **Badge role** - Hiển thị vai trò
- **Feature cards** - 3 tính năng chính của role
- **Progress bar** - Đếm ngược thời gian đóng
- **Countdown** - "Đóng tự động sau X giây..."

### Theo từng Role:

#### 🎓 Student (Học sinh)
```
Icon: 🎓
Title: Chào mừng Học sinh!
Message: Chúc bạn học tập hiệu quả
Badge: Học sinh
Features:
  - 📚 Học bài
  - ✏️ Bài tập
  - 💬 Hỏi đáp
```

#### 👨‍🏫 Teacher (Giáo viên)
```
Icon: 👨‍🏫
Title: Chào mừng Giáo viên!
Message: Sẵn sàng để chia sẻ kiến thức
Badge: Giáo viên
Features:
  - 📖 Lớp học
  - ✍️ Bài tập
  - 📈 Tiến độ
```

#### 👑 Admin (Super Admin)
```
Icon: 👑
Title: Chào mừng Super Admin!
Message: Bạn có toàn quyền quản lý hệ thống
Badge: Quản trị viên
Features:
  - 👥 Quản lý Users
  - 📚 Quản lý Lớp
  - 📊 Thống kê
```

#### 👨‍👩‍👧 Parent (Phụ huynh)
```
Icon: 👨‍👩‍👧
Title: Chào mừng Phụ huynh!
Message: Theo dõi con em học tập
Badge: Phụ huynh
Features:
  - 📊 Kết quả
  - 🔔 Thông báo
  - 💬 Trao đổi
```

## Hiệu ứng Animation

### 1. Fade in background
- Overlay mờ với blur effect
- Duration: 0.3s

### 2. Slide up notification
- Popup từ dưới lên với scale effect
- Duration: 0.5s
- Easing: cubic-bezier với bounce effect

### 3. Bounce icon
- Icon nhảy nhẹ liên tục
- Tạo cảm giác sinh động

### 4. Gradient animation
- Thanh màu ở top chạy gradient
- Tạo cảm giác premium

### 5. Progress bar animation
- Fill từ 0% đến 100% trong 3s
- Linear animation

## Cách Test

### Phương pháp 1: Login thật qua API
```bash
1. Chạy backend: python manage.py runserver
2. Chạy frontend: npm run dev
3. Vào http://localhost:5173/login
4. Nhập username/password
5. Backend trả về role
6. Sau khi login → Chuyển về home → Thấy thông báo
```

### Phương pháp 2: Test nhanh (Development)
Mở `src/App.jsx`:

```javascript
// Test với Student
const [isLoggedIn, setIsLoggedIn] = useState(true);
const [userRole, setUserRole] = useState('student');
const [showWelcome, setShowWelcome] = useState(true); // ← true để xem ngay

// Test với Teacher
const [userRole, setUserRole] = useState('teacher');
const [showWelcome, setShowWelcome] = useState(true);

// Test với Admin
const [userRole, setUserRole] = useState('admin');
const [showWelcome, setShowWelcome] = useState(true);

// Test với Parent
const [userRole, setUserRole] = useState('parent');
const [showWelcome, setShowWelcome] = useState(true);
```

Refresh trang để thấy thông báo ngay lập tức.

## Tùy chỉnh

### Thay đổi thời gian hiển thị
Mở `WelcomeNotification.jsx`:
```javascript
const [countdown, setCountdown] = useState(3); // ← Đổi số giây ở đây

// Auto close timer
const closeTimer = setTimeout(() => {
  onClose();
}, 3000); // ← Đổi milliseconds ở đây (3000 = 3s)
```

### Thay đổi icon/text
Mở `WelcomeNotification.jsx` → function `getRoleInfo()`:
```javascript
case 'student':
  return {
    icon: '🎓', // ← Đổi icon
    title: 'Chào mừng Học sinh!', // ← Đổi tiêu đề
    message: 'Chúc bạn học tập hiệu quả', // ← Đổi message
    // ...
  };
```

### Thay đổi màu sắc
Mở `WelcomeNotification.css`:
```css
/* Gradient chính */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Badge role */
.welcome-role {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Progress bar */
.welcome-progress-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}
```

## Tắt thông báo

### Click vào overlay
User có thể click vào vùng tối xung quanh để đóng ngay.

### Đếm ngược tự động
Sau 3 giây sẽ tự động đóng.

## Cấu trúc Code

```
src/
├── components/
│   └── WelcomeNotification/
│       ├── WelcomeNotification.jsx   # Component chính
│       ├── WelcomeNotification.css   # Styles + animations
│       └── index.js                   # Export
└── App.jsx                            # Logic hiển thị
```

## Flow Logic

```
1. User login → handleLogin(role)
2. Set isLoggedIn = true
3. Set userRole = role từ API
4. Navigate('/') về home
5. Sau 300ms → setShowWelcome(true)
6. WelcomeNotification hiển thị
7. Countdown 3s
8. Auto close → setShowWelcome(false)
```

## Responsive Design

- **Desktop**: Full size, centered
- **Tablet**: Padding giảm
- **Mobile**: 
  - Margin 20px
  - Font size nhỏ hơn
  - Feature grid 1 cột

## Browser Support

- ✅ Chrome/Edge (Modern)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Notes

- Component chỉ render khi `isVisible = true`
- Sử dụng overlay để user có thể click đóng
- Animation mượt mà với CSS transitions
- Không block UI, có thể đóng bất kỳ lúc nào
- Auto cleanup timers khi component unmount

