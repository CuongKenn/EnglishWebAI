# 📰 Hệ Thống Quản Lý Tin Tức - Hướng Dẫn Đầy Đủ

## 🎯 Tổng Quan

Hệ thống quản lý tin tức mới được thiết kế với giao diện đẹp mắt, hiện đại như các nền tảng blog chuyên nghiệp (Medium, Dev.to). Chỉ **Admin** và **Giáo viên** có quyền tạo và quản lý tin tức, trong khi **Học sinh** và **Phụ huynh** chỉ có thể xem.

## ✨ Tính Năng Chính

### 1. **Giao Diện Người Dùng** (`/news`)
- ✅ Bài viết nổi bật (Featured Post) với hình ảnh lớn
- ✅ Grid layout hiện đại cho bài viết thường
- ✅ Sidebar với:
  - 🔥 Trending posts (bài viết xem nhiều nhất)
  - 📬 Newsletter signup
  - 📊 Thống kê
- ✅ Filter theo danh mục
- ✅ Hiển thị đầy đủ metadata:
  - Tác giả & vai trò
  - Lượt xem, lượt thích
  - Thời gian đọc
  - Ngày đăng
- ✅ Responsive design

### 2. **Admin Dashboard** (`/admin-dashboard/manage-news`)
- ✅ Quản lý tất cả tin tức trong hệ thống
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Bảng hiển thị với thông tin đầy đủ
- ✅ Form tạo/sửa tin tức với:
  - Tiêu đề, mô tả, nội dung
  - Danh mục & loại tin
  - Icon selector
  - URL hình ảnh với preview
  - Trạng thái (Published/Draft/Archived)

### 3. **Teacher Dashboard** (`/teacher-dashboard/news`)
- ✅ Quản lý tin tức của giáo viên
- ✅ Giáo viên chỉ thấy và quản lý bài viết của chính mình
- ✅ Giao diện tương tự Admin Dashboard

## 🚀 Cài Đặt & Chạy

### Backend

1. **Cập nhật database schema:**
```bash
cd backend
alembic upgrade head
```

2. **Seed dữ liệu mẫu (tùy chọn):**
```bash
python seed_news_data.py
```

3. **Khởi động backend:**
```bash
python main.py
# hoặc
uvicorn main:app --reload
```

### Frontend

1. **Cài đặt dependencies (nếu cần):**
```bash
cd frontend
npm install
```

2. **Chạy development server:**
```bash
npm run dev
```

3. **Truy cập ứng dụng:**
- Trang tin tức: `http://localhost:5173/news`
- Admin dashboard: `http://localhost:5173/admin-dashboard/manage-news`
- Teacher dashboard: `http://localhost:5173/teacher-dashboard/news`

## 📋 Cấu Trúc File

### Backend
```
backend/
├── alembic/versions/
│   └── 007_update_news_table.py       # Migration file
├── app/
│   ├── models/
│   │   └── news.py                     # Updated model with new fields
│   ├── routers/
│   │   └── news.py                     # Updated API routes
│   └── schemas/
│       └── student.py                  # Updated schemas
└── seed_news_data.py                   # Seed script
```

### Frontend
```
frontend/src/
├── pages/
│   ├── News/
│   │   ├── News.jsx                    # Public news page
│   │   └── News.css                    # Modern styling
│   ├── Admin/
│   │   ├── ManageNews/
│   │   │   ├── ManageNews.jsx          # Admin news management
│   │   │   └── ManageNews.css
│   │   └── AdminDashboard/
│   │       └── AdminDashboard.jsx      # Updated with news route
│   └── Teacher/
│       ├── ManageNews/
│       │   ├── ManageNews.jsx          # Teacher news management
│       │   └── ManageNews.css
│       └── TeacherDashboard/
│           └── TeacherDashboardNew.jsx # Updated with news route
├── services/
│   └── api.js                          # Updated with news API methods
└── hooks/
    └── useNews.js                      # Existing hook
```

## 🎨 Design Features

### Colors & Categories
Mỗi danh mục có màu riêng:
- **Khuyến mãi**: #FF6B6B (Đỏ cam)
- **Học tập**: #4ECDC4 (Xanh ngọc)
- **Hướng dẫn**: #45B7D1 (Xanh dương nhạt)
- **Sự kiện**: #FFA07A (Cam nhạt)
- **Tính năng mới**: #98D8C8 (Xanh mint)
- **Thông báo**: #6C5CE7 (Tím)

### Icons
12 icon emoji để lựa chọn:
📰 📢 🎁 💡 📖 🎉 ✨ 🚀 🔥 ⭐ 🎯 📚

### Status Badges
- **Published** (Đã xuất bản): Xanh lá #10b981
- **Draft** (Nháp): Vàng #f59e0b
- **Archived** (Lưu trữ): Xám #6b7280

## 📊 Database Schema

### NewsPost Model
```python
class NewsPost:
    id: Integer                    # Primary key
    title: String                  # Tiêu đề
    description: Text              # Mô tả ngắn
    content: Text                  # Nội dung đầy đủ
    author_id: Integer             # Foreign key to User
    
    # Metadata
    category: String               # Danh mục
    icon: String                   # Icon emoji
    type: String                   # Loại tin (announcement, promotion, etc.)
    image: String                  # URL hình ảnh
    
    # Engagement
    views: Integer                 # Lượt xem (default: 0)
    likes: Integer                 # Lượt thích (default: 0)
    reading_time: Integer          # Thời gian đọc (phút, default: 5)
    
    # Status & Dates
    status: String                 # published/draft/archived
    published_at: DateTime         # Ngày xuất bản
    created_at: DateTime           # Ngày tạo
    updated_at: DateTime           # Ngày cập nhật
```

## 🔐 Phân Quyền

| Role | Xem tin tức | Tạo tin tức | Sửa tin tức | Xóa tin tức |
|------|-------------|-------------|-------------|-------------|
| **Student** | ✅ | ❌ | ❌ | ❌ |
| **Parent** | ✅ | ❌ | ❌ | ❌ |
| **Teacher** | ✅ | ✅ | ✅ (của mình) | ✅ (của mình) |
| **Admin** | ✅ | ✅ | ✅ (tất cả) | ✅ (tất cả) |

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/v1/news/` - Lấy danh sách tin tức đã publish
- `GET /api/v1/news/{id}` - Lấy chi tiết tin tức

### Protected Endpoints (Teacher/Admin only)
- `GET /api/v1/news/manage/all` - Lấy tất cả tin tức để quản lý
- `POST /api/v1/news/` - Tạo tin tức mới
- `PUT /api/v1/news/{id}` - Cập nhật tin tức
- `DELETE /api/v1/news/{id}` - Xóa tin tức

## 💡 Sử Dụng

### Tạo Tin Tức Mới

1. Đăng nhập với tài khoản **Admin** hoặc **Teacher**
2. Vào Dashboard tương ứng:
   - Admin: `/admin-dashboard/manage-news`
   - Teacher: `/teacher-dashboard/news`
3. Click nút **"➕ Tạo tin tức mới"**
4. Điền thông tin:
   - **Tiêu đề**: Ngắn gọn, hấp dẫn
   - **Mô tả**: 1-2 câu tóm tắt
   - **Nội dung**: Nội dung chi tiết
   - **Danh mục**: Chọn danh mục phù hợp
   - **Icon**: Chọn icon đại diện
   - **Hình ảnh**: Paste URL hình ảnh (khuyến nghị: 1200x600px)
   - **Trạng thái**: 
     - **Published**: Hiển thị ngay
     - **Draft**: Lưu nháp
     - **Archived**: Ẩn khỏi danh sách
5. Click **"Tạo mới"**

### Chỉnh Sửa Tin Tức

1. Trong bảng quản lý, click nút **✏️ (Edit)**
2. Cập nhật thông tin
3. Click **"Cập nhật"**

### Xóa Tin Tức

1. Click nút **🗑️ (Delete)**
2. Xác nhận xóa trong dialog

## 📱 Responsive Design

Giao diện tự động điều chỉnh cho:
- 🖥️ Desktop (>1200px)
- 💻 Laptop (768px - 1200px)
- 📱 Mobile (<768px)

## 🎯 Best Practices

### Hình Ảnh
- **Kích thước khuyến nghị**: 1200x600px (tỉ lệ 2:1)
- **Định dạng**: JPG, PNG, WebP
- **Nguồn**: Unsplash, Pexels (free images)
- **URL**: Sử dụng HTTPS

### Nội Dung
- **Tiêu đề**: 50-70 ký tự
- **Mô tả**: 120-160 ký tự
- **Nội dung**: Ít nhất 200 từ
- **Reading time**: Tự động tính (200 từ/phút)

### SEO-Friendly
- Sử dụng tiêu đề có keyword
- Mô tả hấp dẫn, rõ ràng
- Danh mục chính xác

## 🐛 Troubleshooting

### Database Error
```bash
# Reset database (development only!)
alembic downgrade -1
alembic upgrade head
```

### Frontend Not Showing News
1. Kiểm tra backend đang chạy: `http://localhost:8000/docs`
2. Kiểm tra API response: `http://localhost:8000/api/v1/news/`
3. Xóa cache browser (Ctrl + Shift + R)

### Permission Denied
- Đảm bảo đăng nhập với role Teacher hoặc Admin
- Kiểm tra token trong localStorage
- Logout và login lại nếu cần

## 🎉 Demo Data

Chạy script để thêm 6 bài viết mẫu:
```bash
cd backend
python seed_news_data.py
```

## 📝 TODO (Future Enhancements)

- [ ] Rich text editor (Quill/TinyMCE)
- [ ] Image upload (không chỉ URL)
- [ ] Comment system
- [ ] Like/Unlike functionality
- [ ] Share to social media
- [ ] Tag system
- [ ] Search functionality
- [ ] Pagination
- [ ] Draft autosave

## 🤝 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs backend
2. Kiểm tra console browser
3. Xem lại hướng dẫn này
4. Liên hệ team development

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025  
**Author**: EnglishAI Development Team

