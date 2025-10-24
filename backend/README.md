# EnglishWebAI Backend API

FastAPI backend cho ứng dụng EnglishWebAI - Nền tảng học tiếng Anh tích hợp AI.

## 🚀 Công nghệ sử dụng

- **FastAPI** - Modern web framework cho Python
- **SQLAlchemy** - ORM cho database
- **Alembic** - Database migration tool
- **PostgreSQL** - Database
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Uvicorn** - ASGI server

## 📁 Cấu trúc dự án

```
backend/
├── app/
│   ├── core/           # Core configuration
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── models/         # Database models
│   │   └── user.py
│   ├── schemas/        # Pydantic schemas
│   │   ├── user.py
│   │   └── auth.py
│   ├── routers/        # API routes
│   │   ├── auth.py
│   │   └── users.py
│   ├── services/       # Business logic
│   │   ├── auth_service.py
│   │   └── user_service.py
│   ├── middleware/     # Custom middleware
│   └── utils/          # Utility functions
├── tests/              # Test files
├── alembic/            # Database migrations
├── main.py             # Application entry point
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── .gitignore

```

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/CuongKenn/EnglishWebAI.git
cd EnglishWebAI/backend
```

### 2. Tạo môi trường ảo

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/englishwebai_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### 5. Cài đặt PostgreSQL

- Tải và cài đặt PostgreSQL từ https://www.postgresql.org/download/
- Tạo database:

```sql
CREATE DATABASE englishwebai_db;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE englishwebai_db TO user;
```

### 6. Chạy migrations

```bash
# Initialize Alembic (chỉ lần đầu)
alembic init alembic

# Tạo migration
alembic revision --autogenerate -m "Initial migration"

# Chạy migration
alembic upgrade head
```

## 🚀 Chạy ứng dụng

### Development mode

```bash
# Cách 1: Sử dụng uvicorn trực tiếp
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Cách 2: Chạy file main.py
python main.py
```

Server sẽ chạy tại: http://localhost:8000

### API Documentation

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## 📝 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Đăng ký tài khoản mới
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/logout` - Đăng xuất

### Users

- `GET /api/v1/users/me` - Lấy thông tin user hiện tại
- `PUT /api/v1/users/me` - Cập nhật thông tin user
- `POST /api/v1/users/me/change-password` - Đổi mật khẩu
- `GET /api/v1/users/` - Lấy danh sách users
- `GET /api/v1/users/{user_id}` - Lấy thông tin user theo ID
- `DELETE /api/v1/users/{user_id}` - Xóa user

### OTP & Email Service

- `POST /api/v1/otp/send` - Gửi OTP đến email người dùng
- `POST /api/v1/otp/send-to-me` - Gửi OTP đến email user hiện tại (authenticated)
- `POST /api/v1/otp/verify` - Xác thực mã OTP
- `POST /api/v1/otp/resend` - Gửi lại mã OTP

📚 **Xem thêm**: [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md) và [EMAIL_SERVICE.md](./EMAIL_SERVICE.md)

## 📧 Email Service Setup

Backend đã tích hợp dịch vụ gửi email qua SMTP để gửi OTP. Để sử dụng:

1. Cấu hình SMTP trong `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=noreply@englishwebai.com
   SMTP_FROM_NAME=EnglishWebAI
   OTP_EXPIRE_MINUTES=5
   OTP_LENGTH=6
   ```

2. Tạo App Password cho Gmail (nếu dùng Gmail):
   - Truy cập https://myaccount.google.com/security
   - Bật 2-Factor Authentication
   - Tạo App Password cho Mail

3. Test email service:
   ```bash
   python tests/test_email_service.py
   ```

**Xem hướng dẫn chi tiết**: [EMAIL_QUICKSTART.md](./EMAIL_QUICKSTART.md)

## 🧪 Testing

```bash
# Chạy tất cả tests
pytest

# Chạy với coverage
pytest --cov=app tests/

# Chạy test cụ thể
pytest tests/test_auth.py
```

## 🗄️ Database Models

### User Model

```python
- id: Integer (Primary Key)
- email: String (Unique)
- username: String (Unique)
- full_name: String
- hashed_password: String
- role: Enum (student, teacher, admin)
- is_active: Boolean
- is_verified: Boolean
- phone: String
- avatar_url: String
- created_at: DateTime
- updated_at: DateTime
```

## 🔒 Security

- Mật khẩu được hash bằng bcrypt
- Authentication sử dụng JWT tokens
- CORS được cấu hình cho frontend
- Token expiration: 30 phút (có thể điều chỉnh)

## 📦 Deployment

### Production setup

1. Cập nhật `.env` với production values
2. Set `DEBUG=False`
3. Sử dụng production database
4. Cấu hình proper CORS origins
5. Sử dụng HTTPS

### Run with Gunicorn

```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License

## 👥 Authors

- CuongKenn - [GitHub](https://github.com/CuongKenn)

## 📞 Liên hệ

- Email: your-email@example.com
- Project Link: https://github.com/CuongKenn/EnglishWebAI
