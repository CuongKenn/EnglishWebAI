# 🔧 FIX LỖI 502 BAD GATEWAY - HƯỚNG DẪN CHI TIẾT

## 🎯 Nguyên nhân

Lỗi **502 Bad Gateway** xảy ra vì **backend chưa chạy** hoặc frontend đang gọi sai địa chỉ API.

## ✅ GIẢI PHÁP (Chọn 1 trong 2)

### Phương án 1: Chạy bằng Docker Compose (Khuyến nghị) 🐳

```powershell
# Dừng tất cả container cũ
docker-compose down

# Rebuild và start lại
docker-compose up -d --build

# Xem logs để check
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Sau khi chạy:**
- Backend: http://localhost:8000
- Frontend: http://localhost:80 (hoặc localhost)
- PostgreSQL: localhost:5432

### Phương án 2: Chạy manual (Development) 💻

#### Bước 1: Start Backend

```powershell
# Terminal 1 - Backend
cd backend
python main.py
```

Backend sẽ chạy ở **http://localhost:8000**

Chờ thấy dòng:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Bước 2: Start Frontend

```powershell
# Terminal 2 - Frontend (mở terminal mới)
cd frontend
npm install  # Chỉ lần đầu tiên
npm run dev
```

Frontend sẽ chạy ở **http://localhost:5173**

---

## 🐛 LỖI THƯỜNG GẶP & CÁCH FIX

### 1. Backend không start được

**Lỗi:** `ModuleNotFoundError` hoặc `ImportError`

**Fix:**
```powershell
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend gọi sai URL

**Kiểm tra file:** `frontend/.env` hoặc `frontend/.env.local`

```env
VITE_API_BASE_URL=http://localhost:8000
```

Nếu không có file `.env`, tạo mới với nội dung trên.

### 3. Port đang bị chiếm

**Backend (port 8000):**
```powershell
# Check process đang dùng port 8000
netstat -ano | findstr :8000

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

**Frontend (port 5173):**
```powershell
# Check và kill port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### 4. Database connection error

**Nếu dùng PostgreSQL:**

Kiểm tra `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/englishweb
```

**Tạo database:**
```powershell
# Dùng psql
psql -U postgres
CREATE DATABASE englishweb;
\q
```

**Nếu dùng SQLite (testing):**

Sửa `backend/app/core/config.py`:
```python
DATABASE_URL: str = "sqlite:///./test.db"
```

### 5. CORS Error

Nếu gặp lỗi CORS trong console:

**Kiểm tra `backend/main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Thêm *
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎨 GIAO DIỆN MỚI ĐÃ CẢI THIỆN

### Những gì đã thay đổi:

✅ **Màu sắc đẹp hơn:**
- Gradient xanh-tím (#667eea → #764ba2) xuyên suốt
- Hover effects với shadows động
- Animation mượt mà

✅ **Cards đẹp hơn:**
- Border-radius lớn hơn (24px)
- Shadows nhiều tầng
- Gradient borders chạy
- Hover transform 3D

✅ **Modal tạo nhóm đẹp hơn:**
- Header gradient với animations
- Mode selector với pulse effects
- Buttons với hover effects
- Form inputs với focus states

✅ **Loading states:**
- Spinner với gradient
- Skeleton screens
- Smooth transitions

✅ **Responsive:**
- Mobile-friendly
- Tablet optimization
- Desktop full layout

---

## 🧪 TEST XEM ĐÃ FIX CHƯA

### 1. Check Backend

```powershell
# Test API endpoint
curl http://localhost:8000/api/v1/docs
```

Nếu thành công → Mở browser: http://localhost:8000/api/v1/docs

### 2. Check Frontend

Mở browser: http://localhost:5173

**F12 Console** không có lỗi đỏ → OK

### 3. Test tạo nhóm

1. Login vào hệ thống
2. Vào **Trao Đổi Nhóm** (sidebar trái)
3. Click **+ Tạo Nhóm Mới**
4. Nhập tên: "Test Group"
5. Chọn mode: **Trò chuyện**
6. Click **Tạo nhóm**

**Nếu thành công:** Nhóm mới xuất hiện trong danh sách với UI đẹp!

---

## 📞 NẾU VẪN LỖI

### Gửi cho tôi thông tin:

1. **Screenshot console errors** (F12 → Console tab)
2. **Backend logs** (terminal chạy backend)
3. **Network tab** (F12 → Network → Filter: Fetch/XHR)

### Hoặc check:

```powershell
# Backend status
curl http://localhost:8000/health

# Frontend build
cd frontend
npm run build

# Check ports
netstat -ano | findstr "8000 5173"
```

---

## 🎯 TÓM TẮT NHANH

```powershell
# CÁCH NHANH NHẤT - Docker Compose
docker-compose down
docker-compose up -d --build
# Xong! Vào http://localhost

# HOẶC Manual
# Terminal 1
cd backend && python main.py

# Terminal 2 (new)
cd frontend && npm run dev
# Xong! Vào http://localhost:5173
```

**Sau khi backend + frontend chạy → Refresh browser → Lỗi 502 sẽ mất!**

---

## 🎨 Preview giao diện mới

- **Cards có gradient borders** chạy liên tục
- **Hover effects** với 3D transform
- **Modal đẹp** với header gradient
- **Buttons** với ripple effects
- **Icons** với animations
- **Colors** đồng nhất toàn project

**Enjoy! 🚀**
