# 🔧 Hướng dẫn Fix vấn đề không thấy cập nhật

## ⚠️ Vấn đề

Nếu bạn không thấy:
- ❌ Menu "Học bài" và "Tin tức" trên Navbar
- ❌ Logo không về Home khi click
- ❌ Hero vẫn còn 3 label text

## ✅ Giải pháp

### 1. **Hard Refresh Browser** (Quan trọng nhất!)

#### Windows/Linux:
```
Ctrl + Shift + R
hoặc
Ctrl + F5
```

#### Mac:
```
Cmd + Shift + R
```

### 2. **Clear Cache Browser**

#### Chrome/Edge:
1. Nhấn `Ctrl + Shift + Delete`
2. Chọn "Cached images and files"
3. Click "Clear data"

#### Firefox:
1. Nhấn `Ctrl + Shift + Delete`
2. Chọn "Cache"
3. Click "Clear Now"

### 3. **Restart Dev Server**

Trong terminal:
```bash
# Dừng server (Ctrl + C)
# Sau đó chạy lại:
npm run dev
```

### 4. **Kiểm tra lại Code**

Mở các file sau và kiểm tra:

#### `src/components/Navbar/Navbar.jsx` - Dòng 12-19:
```jsx
case 'student':
  return [
    { path: '/lessons', label: 'Học bài', icon: '📚' },
    { path: '/news', label: 'Tin tức', icon: '📰' },
    { path: '/join-class', label: 'Tham gia lớp học', icon: '👥' },
    { path: '/materials', label: 'Học liệu cơ bản', icon: '📖' },
    { path: '/exercises', label: 'Làm bài tập', icon: '✏️' },
    { path: '/discussion', label: 'Hỏi đáp', icon: '💬' }
  ];
```

#### `src/components/Navbar/Navbar.jsx` - Dòng 62-65 (Logo):
```jsx
<Link to="/" className="brand-link">
  <div className="brand-icon">🎓</div>
  <span className="brand-text">English AI</span>
</Link>
```

#### `src/components/Home/Hero/Hero.jsx` - Dòng 43-56:
```jsx
<div className="hero-visual">
  <div className="planet-container">
    <div className="planet planet-1">
      <div className="planet-ring"></div>
      <div className="planet-icon">🌍</div>
    </div>
    <div className="planet planet-2">
      <div className="planet-icon">🪐</div>
    </div>
    <div className="planet planet-3">
      <div className="planet-icon">🌟</div>
    </div>
  </div>
</div>
```

### 5. **Thử Incognito Mode**

Mở browser ở chế độ ẩn danh:
- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

Truy cập `http://localhost:5173` (hoặc port của bạn)

---

## 📋 Checklist sau khi làm theo các bước trên:

- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Clear cache
- [ ] Restart dev server
- [ ] Kiểm tra ở Incognito mode

## ✨ Kết quả mong đợi:

### Navbar sẽ có:
```
[🎓 English AI] [📚 Học bài] [📰 Tin tức] [👥 Tham gia lớp học] [📖 Học liệu cơ bản] [✏️ Làm bài tập] [💬 Hỏi đáp]
```

### Hero Section sẽ có:
- ✅ Background tối với sao lấp lánh
- ✅ 3 hành tinh đẹp **KHÔNG CÓ CHỮ**:
  - 🌍 Hành tinh xanh cyan (có vòng tròn)
  - 🪐 Hành tinh hồng-vàng
  - 🌟 Hành tinh tím-hồng

### Logo:
- ✅ Click vào "🎓 English AI" → Về trang chủ

---

## 🆘 Vẫn không được?

### Kiểm tra Console lỗi:
1. Mở DevTools: `F12`
2. Tab "Console"
3. Xem có lỗi gì không

### Kiểm tra Network:
1. DevTools → Tab "Network"
2. Refresh trang
3. Xem các file `.js`, `.css` có load không

### Kiểm tra Port:
Đảm bảo server đang chạy đúng port:
```bash
npm run dev

# Output:
  ➜  Local:   http://localhost:5173/
```

---

## 🎯 Các tính năng đã được cập nhật:

1. ✅ **Logo về Home**: Click logo → Về `/`
2. ✅ **Navbar Học bài**: `/lessons` - Giao diện như OLM
3. ✅ **Navbar Tin tức**: `/news` - Có sidebar filter
4. ✅ **Hero planets**: 3 hành tinh KHÔNG CÓ TEXT
5. ✅ **Links**: NewsEvents → News, QAForum → Discussion

---

**Lưu ý**: Nếu sau tất cả các bước trên vẫn không thấy thay đổi, có thể do:
- Browser extension đang cache
- Antivirus đang chặn
- File chưa được save đúng

Hãy thử:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
npm run dev
```

