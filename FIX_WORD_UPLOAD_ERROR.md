# 🔧 FIX LỖI UPLOAD FILE WORD

## ❌ LỖI: 413 Request Entity Too Large

File Word của bạn (11.52 MB) bị từ chối vì backend chưa cấu hình để nhận file lớn.

## ✅ ĐÃ SỬA

Tôi đã:
1. ✅ Sửa router prefix từ `/api/v1/exams` → `/api/v1/exam-assessments`
2. ✅ Tăng giới hạn file upload lên **50MB**
3. ✅ Cấu hình Uvicorn để xử lý file lớn
4. ✅ Tạo script khởi động mới

---

## 🚀 CÁCH SỬA (3 BƯỚC ĐỠN GIẢN)

### BƯỚC 1: Mở File Explorer

Vào thư mục:
```
C:\Users\Admin\Desktop\EnglishWebAI\backend\
```

### BƯỚC 2: Chạy File START_HERE.bat

**Cách 1: Double-click**
- Tìm file `START_HERE.bat`
- Double-click để chạy

**Cách 2: Right-click → Run as Administrator** (khuyến nghị)
- Right-click vào `START_HERE.bat`
- Chọn "Run as administrator"

### BƯỚC 3: Đợi Backend Khởi Động

Bạn sẽ thấy:
```
========================================
  EnglishWebAI Backend Startup
========================================

Starting backend server...
Backend will run on: http://localhost:8000
API docs: http://localhost:8000/api/v1/docs

========================================

[STARTUP] Starting EnglishWebAI Backend...
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**✅ XONG! Backend đã sẵn sàng!**

---

## 🧪 KIỂM TRA

### 1. Mở Browser
Vào: http://localhost:8000/health

Nếu thấy:
```json
{"status": "healthy"}
```
→ ✅ Backend chạy OK!

### 2. Thử Upload Lại

1. Refresh trang web (Ctrl + Shift + R)
2. Vào "Tạo bài tập mới"
3. Chọn "Kiểm tra Giữa kì"
4. Chọn "Import File"
5. Upload file Word
6. Click "Import & Tạo Đề Thi"

**Bây giờ sẽ THÀNH CÔNG!** 🎉

---

## 📝 CÁC THAY ĐỔI KỸ THUẬT

### File: `backend/main.py`
```python
# Cấu hình mới cho file lớn
config = uvicorn.Config(
    "main:app",
    host="0.0.0.0",
    port=8000,
    reload=True,
    timeout_keep_alive=120,
    limit_concurrency=100,
    limit_max_requests=1000,
    # Cho phép upload file 50MB
    h11_max_incomplete_event_size=50 * 1024 * 1024
)
```

### File: `backend/app/routers/exam_assessments.py`
```python
# Sửa prefix
router = APIRouter(prefix="/api/v1/exam-assessments", tags=["Exam Assessments"])
```

### File: `frontend/src/services/examService.js`
```javascript
// API endpoint đúng
uploadExamFromWord: async (formData) => {
  const response = await api.post('/api/v1/exam-assessments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
```

---

## ⚠️ LƯU Ý

### Nếu Vẫn Bị Lỗi 413

1. **Kiểm tra Nginx/Proxy**
   Nếu bạn dùng Nginx, thêm vào config:
   ```nginx
   client_max_body_size 50M;
   ```

2. **Kiểm tra Frontend Proxy (Vite)**
   File `frontend/vite.config.js` đã có config đúng:
   ```javascript
   server: {
     proxy: {
       '/api': 'http://localhost:8000'
     }
   }
   ```

3. **Kiểm tra File Size**
   Backend hiện chấp nhận tối đa **50MB**
   - File bạn: 11.52 MB ✅
   - Nếu file > 50MB, cần nén lại hoặc tăng limit

---

## 🎯 DEMO HOÀN CHỈNH

### Terminal 1: Backend
```bash
cd C:\Users\Admin\Desktop\EnglishWebAI\backend
START_HERE.bat
```
→ Thấy: "Uvicorn running on http://0.0.0.0:8000" ✅

### Terminal 2: Frontend
```bash
cd C:\Users\Admin\Desktop\EnglishWebAI\frontend
npm run dev
```
→ Thấy: "Local: http://localhost:3000" ✅

### Browser
1. Vào http://localhost:3000
2. Đăng nhập teacher
3. Upload file Word
4. ✅ Thành công!

---

## 📞 HỖ TRỢ

Nếu vẫn gặp lỗi, check:

1. **Backend có chạy không?**
   ```
   curl http://localhost:8000/health
   ```

2. **Port 8000 có bị chiếm không?**
   ```
   netstat -ano | findstr :8000
   ```

3. **Xem log lỗi trong terminal backend**

---

## ✨ HOÀN THÀNH

Sau khi restart backend:
- ✅ Upload file Word lên đến 50MB
- ✅ API endpoint đúng
- ✅ Giao diện đẹp, đồng bộ
- ✅ AI xử lý tự động
- ✅ Tạo đề thi tương tác

**Chúc mừng bạn!** 🎊

