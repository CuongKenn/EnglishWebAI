# Register Component - Space Theme 🌌

## 🌟 Tổng quan

Giao diện đăng ký tài khoản với thiết kế không gian (Space Theme) tương tự Login nhưng có các trường input khác và text khác biệt.

## ✨ Các hiệu ứng JavaScript

Component Register có **TẤT CẢ các hiệu ứng giống Login**:

### 1. **Stars Background** - 100 ngôi sao nhấp nháy
### 2. **Shooting Stars** - Sao băng xuất hiện mỗi 3 giây
### 3. **Floating Planets** - 4 hành tinh bay lơ lửng
### 4. **Floating Particles** - 20 hạt ánh sáng bay
### 5. **Form Animations** - Input focus + transform
### 6. **Ripple Effect** - Click button tạo gợn sóng
### 7. **Button Glow** - Hiệu ứng ánh sáng qua button
### 8. **Social Buttons** - Hover effects
### 9. **Page Load** - Fade in + scale
### 10. **Password Toggle** - Hiển thị/ẩn mật khẩu

## 🆕 Điểm khác biệt so với Login

### Form Fields:

| Login | Register |
|-------|----------|
| Email | Full Name |
| - | Email |
| - | Password |
| - | Confirm Password |

### Text Content:

- Title: "SIGN UP" (thay vì "SIGN IN")
- Subtitle: "Create your account to get started"
- Adventure text: "START YOUR JOURNEY!" (thay vì "SIGN IN TO YOUR ADVENTURE!")
- Button: "Create Account" (thay vì "Sign up")
- Extra link: "Already have an account? Sign in"

### Planet Colors:

```css
/* Register sử dụng màu khác cho hành tinh lớn */
Large Planet: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) - Hồng
(Login sử dụng: #4facfe 0%, #00f2fe 100% - Xanh)
```

## 🎯 Form Validation

```jsx
// Kiểm tra password match
if (formData.password !== formData.confirmPassword) {
  alert('Passwords do not match!');
  return;
}
```

**Có thể mở rộng thêm:**
- Email format validation
- Password strength checker
- Name length validation
- Show error messages dưới input

## 🎨 Màu sắc chủ đạo

```css
Background: linear-gradient(135deg, #0a0e27 0%, #1a1147 50%, #2d1b69 100%)
Planet 1: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) - Hồng (khác Login)
Planet 2: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) - Xanh
Planet 3: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) - Pastel
Planet 4: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%) - Cam
Button: linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%) - Tím sang xanh
```

## 📦 Component Structure

```
Register/
├── Register.jsx    - Component chính
├── Register.css    - Styles và animations (clone từ Login)
├── index.js        - Export
└── README.md       - Documentation
```

## 🚀 Sử dụng

```jsx
import Register from './components/Register';

function App() {
  return <Register />;
}
```

## 🎯 Props (Có thể mở rộng)

```jsx
<Register 
  onSubmit={(formData) => handleRegister(formData)}
  onGoogleRegister={() => handleGoogleRegister()}
  onFacebookRegister={() => handleFacebookRegister()}
  onNavigateToLogin={() => navigateToLogin()}
/>
```

## 📱 Responsive Design

Giống y hệt Login:
- **Desktop**: Full 2 columns
- **Tablet** (< 968px): Vertical stack
- **Mobile** (< 576px): Compact, smaller planets

**Đặc biệt**: Form có scrollbar khi quá dài (do có 4 input fields)

```css
.form-wrapper {
  max-height: 100vh;
  overflow-y: auto;
}
```

## 🔧 Customization

### Password Strength Indicator

Thêm vào sau password input:

```jsx
<div className="password-strength">
  <div className={`strength-bar ${strength}`}></div>
  <span>{strengthText}</span>
</div>
```

### Email Validation

```jsx
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

### Password Strength Checker

```jsx
const checkPasswordStrength = (password) => {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
  return 'medium';
};
```

## 🌟 State Management

```jsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});
```

## 🎬 Form Submit Flow

1. User điền form
2. Click "Create Account"
3. Validation: Password match
4. Ripple effect trên button
5. Log form data (production: gọi API)
6. Navigate to home/login

## 💡 Tips

1. **UX**: Hiển thị lỗi validation realtime
2. **Security**: Hash password trước khi gửi server
3. **Confirmation**: Gửi email xác nhận sau khi đăng ký
4. **Auto-login**: Tự động đăng nhập sau khi tạo tài khoản thành công
5. **Terms**: Thêm checkbox "I agree to Terms" (required)

## 🔐 Security Best Practices

```jsx
// KHÔNG lưu password plaintext
// LUÔN sử dụng HTTPS
// Hash password với bcrypt hoặc tương đương
// Implement rate limiting
// Add CAPTCHA để chống spam registration
```

## 🐛 Troubleshooting

**Lỗi: "Passwords do not match"**
- Kiểm tra user đã nhập đúng confirm password chưa
- Có thể thêm "Show password" cho cả 2 fields

**Performance chậm:**
- Giảm số lượng stars từ 100 xuống 50
- Giảm particles từ 20 xuống 10
- Disable meteors trên mobile

**Scrollbar không smooth:**
- Thêm smooth scrolling:
```css
.form-wrapper {
  scroll-behavior: smooth;
}
```

