# Tài liệu triển khai trang Giới thiệu (About Us)

## Tổng quan

Trang **Giới thiệu** (About Us) được thiết kế hiện đại với nhiều hiệu ứng động, phù hợp với dự án EnglishWebAI - nền tảng học tiếng Anh thông minh.

## Các tính năng chính

### 1. Thiết kế & Hiệu ứng

#### 🎨 Visual Design
- **Background gradient tối**: Màu nền chủ đạo #0a0e27 tạo không gian chuyên nghiệp
- **Glassmorphism effects**: Hiệu ứng kính mờ hiện đại
- **Smooth animations**: Chuyển động mượt mà, tự nhiên
- **Parallax scrolling**: Hiệu ứng cuộn trang độc đáo

#### 📚 Biểu tượng đặc trưng
- **Quyển sách phát sáng**: Thay thế con sứa, phù hợp với giáo dục
- **Ánh sáng xanh dương**: Tượng trưng cho tri thức và công nghệ
- **Animation floating**: Quyển sách lơ lửng, xoay nhẹ

#### ✨ Hiệu ứng đặc biệt
- **Floating particles**: Hạt sáng bay lên trên
- **Fade-in sections**: Các phần xuất hiện khi cuộn
- **Hover effects**: Hiệu ứng khi di chuột
- **Scroll indicators**: Chỉ báo vị trí cuộn trang

### 2. Cấu trúc nội dung

#### Section 1: Hero Section
- Tiêu đề "Về chúng tôi"
- Slogan: "Kiến tạo tương lai giáo dục tiếng Anh với công nghệ AI thông minh"
- Nút "Khám phá thêm" với animation

#### Section 2: Sứ mệnh
- Icon đặc trưng với animation xoay
- Mô tả chi tiết sứ mệnh của EnglishWebAI
- Background gradient động

#### Section 3: Ba trụ cột
- **Học tập thông minh với AI**: GPT-4, Azure Speech, cá nhân hóa
- **Nâng cao hệ thống giảng dạy**: Quản lý lớp học, tài liệu, bài tập
- **Cải thiện trải nghiệm**: Gamification, cộng đồng, dashboard

#### Section 4: Công nghệ
- Giới thiệu các công nghệ sử dụng:
  - OpenAI GPT-4
  - Azure Speech SDK
  - React + FastAPI
  - Analytics Dashboard
  - JWT Authentication
  - Real-time Communication

#### Section 5: Tầm nhìn
- Thống kê nổi bật: 100% tự động, 24/7 hỗ trợ, ∞ bài tập
- Floating cards với các tính năng
- Call-to-action buttons: "Đăng ký ngay" và "Liên hệ"

### 3. Tích hợp Navigation

#### Navbar Updates
Đã thêm link "Giới thiệu" vào navbar của tất cả các role:

**Student/Teacher/Admin:**
- Học bài
- Tin tức
- Lớp học của tôi
- Thực hành AI
- Làm bài tập
- Hỏi đáp
- **Giới thiệu** ⭐ (mới)
- Dashboard (cuối cùng)

**Parent:**
- Theo dõi tiến độ
- Thông báo
- Trao đổi
- **Giới thiệu** ⭐ (mới)
- Thông tin chung

### 4. Responsive Design

#### Desktop (> 1024px)
- Layout rộng với max-width 1400px
- Grid 3 cột cho các card
- Full effects và animations

#### Tablet (768px - 1024px)
- Layout thu gọn
- Grid 2 cột
- Animation được tối ưu

#### Mobile (< 768px)
- Layout 1 cột
- Text size nhỏ hơn
- Menu hamburger
- Touch-friendly buttons

### 5. Hiệu ứng JavaScript

#### Scroll Detection
```javascript
- Theo dõi vị trí cuộn trang
- Active section indicators
- Parallax effects cho book icon
```

#### Intersection Observer
```javascript
- Fade-in animations khi element vào viewport
- Threshold 0.1 với root margin
- Auto-trigger animations
```

#### Smooth Scroll
```javascript
- Click indicators để nhảy đến section
- Behavior: smooth
- Block: start
```

## Files đã tạo/chỉnh sửa

### Tạo mới
1. `frontend/src/pages/AboutUs/AboutUs.jsx` - Component chính
2. `frontend/src/pages/AboutUs/AboutUs.css` - Styles và animations

### Chỉnh sửa
1. `frontend/src/App.jsx` - Thêm routing
2. `frontend/src/components/Navbar/Navbar.jsx` - Thêm link Giới thiệu
3. `frontend/src/components/Navbar/Navbar.css` - Cải thiện styling
4. `frontend/src/components/Home/Header/Header.jsx` - Thêm link cho header cũ

## Cách sử dụng

### Truy cập trang
```
http://localhost:5173/about
```

### Navigation
- Click "Giới thiệu" trong navbar
- Hoặc truy cập trực tiếp URL `/about`

### Scroll Navigation
- Sử dụng scroll indicators bên phải
- Click để nhảy đến section tương ứng
- Hoặc cuộn trang thủ công

## Tùy chỉnh

### Thay đổi màu sắc
File: `AboutUs.css`
```css
/* Primary gradient */
background: linear-gradient(135deg, #4f8aff 0%, #7b3ff2 100%);

/* Background color */
background: #0a0e27;
```

### Thay đổi nội dung
File: `AboutUs.jsx`
```jsx
// Sửa text trong các section
<h2 className="section-title">Tiêu đề mới</h2>
<p className="mission-description">Nội dung mới</p>
```

### Thêm section mới
```jsx
<section id="section-X" className="new-section about-section fade-in-section">
  {/* Content */}
</section>
```

## Animation Classes

### Fade In
`.fade-in-section` - Tự động fade in khi vào viewport

### Floating
`.floating-card` - Hiệu ứng lơ lửng nhẹ nhàng

### Hover Effects
- `.pillar-card:hover` - Scale up + shadow
- `.tech-item:hover` - Lift up effect
- `.cta-btn:hover` - Transform + glow

## Performance

### Optimization
- CSS animations sử dụng `transform` và `opacity`
- Intersection Observer thay vì scroll events
- Lazy animation loading
- Debounced scroll handlers

### Loading
- No external dependencies
- Pure CSS animations
- Minimal JavaScript
- Fast initial render

## Browser Support

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant
- Touch-friendly buttons (44px minimum)

## Future Enhancements

### Potential additions:
1. Video background option
2. Team member cards
3. Timeline/milestones
4. Testimonials section
5. Contact form integration
6. Multi-language support
7. Dark/light mode toggle
8. Print-friendly version

## Notes

- Page không yêu cầu authentication
- Accessible cho tất cả users (logged in hoặc không)
- SEO-friendly structure
- Mobile-first approach
- Performance optimized

---

**Created**: November 1, 2025
**Project**: EnglishWebAI
**Version**: 1.0.0

