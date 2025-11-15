# Google OAuth Setup Guide for EnglishWebAI

Hướng dẫn cấu hình Google OAuth để thực hiện đăng nhập/đăng ký bằng Google.

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)

2. Tạo hoặc chọn một project:
   - Click vào dropdown project ở thanh trên cùng
   - Chọn "New Project" nếu chưa có
   - Đặt tên: "EnglishWebAI" (hoặc tên khác)
   - Click "Create"

3. Bật Google+ API:
   - Vào menu ☰ > "APIs & Services" > "Library"
   - Tìm "Google+ API" hoặc "Google Identity"
   - Click "Enable"

4. Tạo OAuth 2.0 Client ID:
   - Vào menu ☰ > "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Nếu chưa có OAuth consent screen:
     - Click "Configure Consent Screen"
     - Chọn "External" (cho testing) hoặc "Internal" (nếu dùng Google Workspace)
     - Điền thông tin app:
       - App name: EnglishWebAI
       - User support email: [your-email@gmail.com]
       - Developer contact: [your-email@gmail.com]
     - Scope: Không cần thêm scope đặc biệt, mặc định đã có email và profile
     - Test users: Thêm email của bạn để test
     - Click "Save and Continue"

5. Tạo credentials:
   - Quay lại "Credentials" > "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "EnglishWebAI Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (nếu dùng port khác)
     - `http://localhost` (production local)
   - Authorized redirect URIs:
     - `http://localhost:5173/login`
     - `http://localhost:3000/login`
   - Click "Create"

6. Lưu credentials:
   - Copy **Client ID** (có dạng: `xxxxx.apps.googleusercontent.com`)
   - Copy **Client Secret** (có dạng: `GOCSPX-xxxxx`)

## Bước 2: Cấu hình Backend

1. Mở file `.env` ở root project (hoặc copy từ `.env.example`)

2. Thêm/cập nhật các biến sau:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/login
```

3. Thay thế giá trị bằng credentials vừa tạo ở Bước 1.6

## Bước 3: Cấu hình Frontend

1. Thêm biến môi trường frontend trong `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Lưu ý**: Client ID giống với backend, nhưng **KHÔNG cần** Client Secret ở frontend.

## Bước 4: Cài đặt Dependencies

### Backend

```bash
cd backend
pip install google-auth
```

### Frontend

```bash
cd frontend
npm install @react-oauth/google
```

## Bước 5: Chạy Database Migration

Chạy migration để thêm cột `google_id` vào bảng `users`:

```bash
cd backend
alembic upgrade head
```

Hoặc nếu dùng Docker:

```bash
docker-compose exec backend alembic upgrade head
```

## Bước 6: Khởi động ứng dụng

### Development (Manual)

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Production (Docker)

```bash
docker-compose up -d --build
```

Truy cập: http://localhost:5173 (dev) hoặc http://localhost (production)

## Bước 7: Test Google Login

1. Mở trình duyệt và truy cập trang login
2. Click nút "Continue with Google"
3. Chọn tài khoản Google
4. Cho phép ứng dụng truy cập thông tin cơ bản
5. Hệ thống sẽ tự động:
   - Tạo tài khoản mới nếu chưa tồn tại (với `google_id`)
   - Đăng nhập nếu đã có tài khoản
   - Redirect về dashboard tương ứng với role

## Xử lý lỗi thường gặp

### Error: `redirect_uri_mismatch`

**Nguyên nhân**: Redirect URI không khớp với cấu hình trong Google Console

**Giải pháp**:
- Kiểm tra chính xác URL đang truy cập (port, protocol)
- Đảm bảo đã thêm URL vào "Authorized redirect URIs" trong Google Console
- URL phải khớp chính xác (không thừa `/` cuối)

### Error: `idpiframe_initialization_failed`

**Nguyên nhân**: Third-party cookies bị chặn hoặc chạy ở chế độ incognito

**Giải pháp**:
- Tắt chế độ incognito
- Cho phép third-party cookies trong trình duyệt
- Chrome: Settings > Privacy > Cookies > Allow all cookies (hoặc add exception cho `accounts.google.com`)

### Error: `400 Invalid token`

**Nguyên nhân**: ID Token không hợp lệ hoặc đã hết hạn

**Giải pháp**:
- Kiểm tra `GOOGLE_CLIENT_ID` trong backend phải khớp với frontend
- Clear cache và thử lại
- Đảm bảo server time đồng bộ (NTP)

### Error: `User already exists with this email`

**Nguyên nhân**: User đã đăng ký bằng email/password trước đó

**Giải pháp**: 
- Backend service tự động liên kết Google ID với tài khoản hiện có
- Nếu vẫn lỗi, kiểm tra logic trong `google_auth_service.py`

## Security Notes

- **Client Secret**: KHÔNG được commit vào Git hoặc expose ra frontend
- **ID Token**: Phải verify ở backend trước khi tin cậy
- **Redirect URI**: Phải whitelist chính xác để tránh phishing
- **Production**: Thay đổi redirect URI thành domain chính thức (https://yourdomain.com)

## Production Deployment

Khi deploy lên production (VPS, cloud):

1. Cập nhật Authorized JavaScript origins và Redirect URIs trong Google Console:
   - `https://yourdomain.com`
   - `https://yourdomain.com/login`

2. Cập nhật `.env`:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/login
   ```

3. Đảm bảo HTTPS được bật (Google OAuth yêu cầu HTTPS cho production)

## Resources

- [Google Identity Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [@react-oauth/google](https://github.com/MomenSherif/react-oauth)
- [google-auth Python Library](https://google-auth.readthedocs.io/)
