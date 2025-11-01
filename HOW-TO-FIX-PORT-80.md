# 🔧 Hướng Dẫn Sửa Lỗi Port 80 (Không Cần Đổi Cổng)

## ⚡ Cách Nhanh Nhất (Khuyến Nghị)

### Bước 1: Chạy Script Tự Động

1. **Mở PowerShell as Administrator**
   - Nhấn `Win + X`
   - Chọn **"Windows PowerShell (Admin)"** hoặc **"Terminal (Admin)"**

2. **Di chuyển vào thư mục project**
   ```powershell
   cd D:\EnglishWebAI-1\EnglishWebAI
   ```

3. **Chạy script fix**
   ```powershell
   .\fix-port-80.ps1
   ```

   > Nếu gặp lỗi execution policy:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\fix-port-80.ps1
   ```

### Bước 2: Chạy Docker

Sau khi script chạy thành công:

```bash
docker-compose down
docker-compose up -d
```

### Bước 3: Truy Cập

- **Frontend**: http://localhost
- **Backend**: http://localhost:8000

---

## 🛠️ Cách Thủ Công (Nếu Script Không Chạy)

### Option 1: Dừng HTTP Service

```powershell
# PowerShell as Administrator
net stop http
```

Nếu có cảnh báo về dependent services, gõ `Y` để confirm.

### Option 2: Dừng IIS

```powershell
# PowerShell as Administrator
net stop W3SVC
net stop IISADMIN
```

### Option 3: Restart WinNAT

```powershell
# PowerShell as Administrator
net stop winnat
net start winnat
```

### Option 4: Disable IIS Hoàn Toàn

1. Nhấn `Win + R` → gõ `appwiz.cpl` → Enter
2. Click **"Turn Windows features on or off"**
3. Bỏ tick ☑️ **"Internet Information Services"**
4. Click OK
5. Restart máy

---

## 🔍 Kiểm Tra Port 80

Kiểm tra xem port 80 còn bị chiếm không:

```powershell
netstat -ano | findstr :80
```

**Nếu KHÔNG có kết quả** → Port 80 đã trống! ✅

---

## ❌ Nếu Vẫn Không Được

### Tìm Process Đang Chiếm Port 80

```powershell
# Tìm PID đang dùng port 80
netstat -ano | findstr :80

# Xem process đó là gì (thay 1234 bằng PID thực tế)
tasklist | findstr 1234
```

### Các Service Thường Chiếm Port 80

| Service | Cách Tắt |
|---------|----------|
| **IIS (PID 4)** | `net stop http` hoặc `net stop W3SVC` |
| **Apache** | Tắt từ Services hoặc Task Manager |
| **Skype** | Settings → Advanced → Connection → Bỏ tick port 80/443 |
| **VMware** | Disable VMware Workstation Server |
| **Hyper-V NAT** | `net stop winnat` |

---

## 🆘 Vẫn Không Giải Quyết Được?

### Last Resort: Restart Máy

1. Chạy script `fix-port-80.ps1`
2. Restart máy
3. Chạy Docker ngay sau khi khởi động (trước khi Windows services tự start)

### Hoặc: Đổi sang Port 3000

Nếu thực sự không sửa được, chỉnh file `.env`:

```env
FRONTEND_PORT=3000
```

Sau đó:
```bash
docker-compose down
docker-compose up -d
```

Truy cập: http://localhost:3000

---

## ✅ Checklist

- [ ] Chạy PowerShell as Administrator
- [ ] Chạy `.\fix-port-80.ps1`
- [ ] Kiểm tra `netstat -ano | findstr :80` → Không có kết quả
- [ ] Chạy `docker-compose up -d`
- [ ] Truy cập http://localhost

---

## 📞 Support

Nếu vẫn gặp vấn đề, check logs:

```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```


