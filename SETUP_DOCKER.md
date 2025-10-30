# 🐳 HƯỚNG DẪN SỬA LỖI DOCKER

## ❌ LỖI HIỆN TẠI

```
unable to get image 'englishwebai-frontend': 
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/images/englishwebai-frontend/json": 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Nghĩa là:** Docker Desktop chưa chạy hoặc chưa được cài đặt.

---

## ✅ GIẢI PHÁP 1: CÀI VÀ CHẠY DOCKER DESKTOP

### Bước 1: Tải Docker Desktop
1. Vào: https://www.docker.com/products/docker-desktop/
2. Download **Docker Desktop for Windows**
3. Cài đặt (yêu cầu restart máy)

### Bước 2: Bật WSL 2 (Windows Subsystem for Linux)

Mở PowerShell **với quyền Administrator**:

```powershell
# Bật WSL
wsl --install

# Hoặc nếu đã cài, update lên WSL 2
wsl --set-default-version 2
```

Restart máy sau khi cài WSL.

### Bước 3: Khởi động Docker Desktop

1. Mở **Docker Desktop** từ Start Menu
2. Đợi Docker khởi động (icon màu xanh ở system tray)
3. Kiểm tra: Click icon Docker → Settings → Resources

### Bước 4: Kiểm tra Docker

```powershell
# Kiểm tra Docker đã chạy chưa
docker --version
docker ps

# Nên thấy:
# Docker version 24.x.x
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

### Bước 5: Chạy Docker Compose

```powershell
cd C:\Users\Admin\Desktop\EnglishWebAI
docker-compose up -d --build
```

**Lưu ý:** Lần đầu build sẽ mất 5-10 phút!

---

## ✅ GIẢI PHÁP 2: CHẠY LOCAL - KHÔNG CẦN DOCKER (KHUYẾN NGHỊ)

**Docker phức tạp và tốn RAM!** Chạy local đơn giản hơn nhiều!

### Terminal 1: Backend
```powershell
cd C:\Users\Admin\Desktop\EnglishWebAI\backend
python start_backend.py
```

### Terminal 2: Frontend
```powershell
cd C:\Users\Admin\Desktop\EnglishWebAI\frontend
npm run dev
```

**✅ XONG!** Vào http://localhost:3000

---

## 🔍 SO SÁNH

| Tiêu chí | Docker | Local |
|----------|--------|-------|
| **Dễ setup** | ⭐⭐ Khó | ⭐⭐⭐⭐⭐ Dễ |
| **Tốc độ** | ⭐⭐⭐ Chậm hơn | ⭐⭐⭐⭐⭐ Nhanh |
| **RAM** | ⭐⭐ Tốn 2-4GB | ⭐⭐⭐⭐ Nhẹ |
| **Development** | ⭐⭐⭐ OK | ⭐⭐⭐⭐⭐ Tốt nhất |
| **Production** | ⭐⭐⭐⭐⭐ Tốt nhất | ⭐⭐⭐ OK |

**Khuyến nghị:** 
- **Development (bây giờ):** Dùng Local
- **Production (deploy lên server):** Dùng Docker

---

## 🚀 KHỞI ĐỘNG NHANH (LOCAL)

Tôi đã tạo scripts cho bạn!

### Windows:

**File 1: `START_BACKEND.bat`**
```batch
@echo off
cd backend
python start_backend.py
pause
```

**File 2: `START_FRONTEND.bat`**
```batch
@echo off
cd frontend
npm run dev
pause
```

**File 3: `START_ALL.bat`** (Chạy cả 2 cùng lúc)
```batch
@echo off
echo Starting EnglishWebAI...
start "Backend" cmd /k "cd backend && python start_backend.py"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
pause
```

**Cách dùng:** Double-click `START_ALL.bat` và chờ!

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Docker daemon is not running"
→ Mở Docker Desktop và đợi nó khởi động

### Lỗi: "WSL 2 installation is incomplete"
→ Chạy: `wsl --install` trong PowerShell (Administrator)

### Lỗi: "Cannot connect to Docker daemon"
→ Restart Docker Desktop

### Lỗi: Port 8000 hoặc 3000 đã được dùng
```powershell
# Tìm process đang dùng port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill process (thay PID)
taskkill /PID <PID> /F
```

---

## 📊 YÊU CẦU HỆ THỐNG

### Chạy Local:
- ✅ Python 3.8+
- ✅ Node.js 16+
- ✅ 2GB RAM
- ✅ Windows 10/11

### Chạy Docker:
- ✅ Windows 10/11 Pro (hoặc Home với WSL 2)
- ✅ Docker Desktop
- ✅ WSL 2
- ✅ 8GB RAM (khuyến nghị)
- ✅ Virtualization enabled trong BIOS

---

## ✨ KẾT LUẬN

**Cho Development (bây giờ):**
→ Dùng Local (Đơn giản, nhanh, ít lỗi)

**Cho Production (sau này):**
→ Dùng Docker (Chuẩn hóa, dễ deploy)

**Bạn đã có Python và Node.js rồi, nên:**
→ **CHẠY LOCAL NGAY!** Không cần Docker! 🚀

