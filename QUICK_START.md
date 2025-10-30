# 🚀 QUICK START - ENGLISH WEB AI

## ⚡ CÁCH NHANH NHẤT (30 giây)

### 1️⃣ Double-click file này:

```
START_ALL.bat
```

### 2️⃣ Đợi 15 giây

Bạn sẽ thấy 2 cửa sổ terminal mở ra:
- ✅ **Backend**: Chạy trên http://localhost:8000
- ✅ **Frontend**: Chạy trên http://localhost:3000

### 3️⃣ Mở trình duyệt

Vào: **http://localhost:3000**

### 4️⃣ Đăng nhập

**Teacher:**
- Username: `teacher1`
- Password: `teacher123`

**Student:**
- Username: `student1`
- Password: `student123`

**Admin:**
- Username: `admin`
- Password: `admin123`

---

## 📖 CÁCH CHI TIẾT HƠN

### Nếu muốn chạy riêng từng phần:

#### Terminal 1: Backend
```powershell
cd backend
python start_backend.py
```

#### Terminal 2: Frontend (terminal mới)
```powershell
cd frontend
npm run dev
```

---

## 🔧 NẾU GẶP LỖI

### Lỗi: "python không được nhận dạng"
→ Cài Python: https://www.python.org/downloads/

### Lỗi: "npm không được nhận dạng"
→ Cài Node.js: https://nodejs.org/

### Lỗi: Port 8000 đã được sử dụng
```powershell
# Tìm và kill process
netstat -ano | findstr :8000
taskkill /PID <số_PID> /F
```

### Lỗi: Module not found
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 🎯 IMPORT ĐỀ THI TỪ WORD

Sau khi đăng nhập teacher:

1. **Vào "Quản lý Bài tập & Kiểm tra"**
2. **Click "Tạo bài tập mới"**
3. **Chọn "Kiểm tra Giữa kì" hoặc "Kiểm tra Cuối kì"**
4. **Chọn tab "Import File"**
5. **Chọn lớp học**
6. **Upload file Word (.docx)**
7. **Click "Import & Tạo Đề Thi"**

✅ **AI sẽ tự động:**
- Đọc và phân tích đề thi
- Trích xuất hình ảnh
- Tạo câu hỏi tương tác
- Lưu vào database

---

## 📊 KIỂM TRA BACKEND

Vào: http://localhost:8000/health

Nếu thấy:
```json
{"status": "healthy"}
```
→ ✅ Backend OK!

API Documentation: http://localhost:8000/api/v1/docs

---

## 🛑 DỪNG SERVERS

**Cách 1:** Đóng cửa sổ terminal

**Cách 2:** Ctrl + C trong terminal

**Cách 3:** Task Manager → Tìm "python.exe" và "node.exe" → End Task

---

## 💡 MẸO

### 1. Auto-start khi mở máy
Tạo shortcut của `START_ALL.bat` vào:
```
C:\Users\<YourName>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

### 2. Thay đổi port
**Backend:** Sửa file `backend/start_backend.py`, dòng `port=8000`
**Frontend:** Sửa file `frontend/vite.config.js`

### 3. Reset database
Xóa file: `backend/dev.db`
Backend sẽ tự tạo lại khi khởi động

---

## 🎉 HOÀN THÀNH!

Bây giờ bạn có thể:
- ✅ Import đề thi từ Word
- ✅ AI tự động tạo câu hỏi tương tác
- ✅ Học sinh làm bài trực tiếp trên web
- ✅ Giáo viên chấm điểm và xem báo cáo

**Chúc bạn sử dụng hiệu quả!** 🚀

