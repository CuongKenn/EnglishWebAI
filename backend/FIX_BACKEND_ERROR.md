# Hướng dẫn sửa lỗi Backend 502 Bad Gateway

## Nguyên nhân lỗi:
Backend không thể khởi động do thiếu module `psycopg2` (PostgreSQL driver).

## Cách sửa:

### Bước 1: Cài đặt dependencies
```bash
cd backend
pip install psycopg2-binary
```

Hoặc cài tất cả dependencies từ requirements.txt:
```bash
cd backend
pip install -r requirements.txt
```

### Bước 2: Restart backend
Sau khi cài xong, restart backend:
```bash
cd backend
python start_backend.py
```

### Bước 3: Kiểm tra backend đã chạy
Mở trình duyệt và truy cập: `http://localhost:8000/docs`
Nếu thấy Swagger UI thì backend đã chạy thành công.

## Lưu ý:
- Đảm bảo đã cài Python 3.8+
- Đảm bảo PostgreSQL đã được cài đặt và đang chạy
- Kiểm tra file `.env` có cấu hình DATABASE_URL đúng không

## Nếu vẫn lỗi:
1. Kiểm tra log backend để xem lỗi chi tiết
2. Đảm bảo virtual environment đã được activate (nếu có)
3. Thử cài lại tất cả dependencies: `pip install --upgrade -r requirements.txt`

