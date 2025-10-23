# EnglishWebAI Docker Setup

Complete Docker setup cho dự án EnglishWebAI với Backend FastAPI, Frontend React, và PostgreSQL database.

## 📦 Services

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Nginx
- **Database**: PostgreSQL 15
- **Cache**: Redis (optional)
- **DB Admin**: PgAdmin (optional, dev profile)

## 🚀 Quick Start

### 1. Chuẩn bị môi trường

```bash
# Clone repository
git clone https://github.com/CuongKenn/EnglishWebAI.git
cd EnglishWebAI

# Copy environment file
cp .env.docker .env
```

### 2. Cấu hình environment variables

Chỉnh sửa file `.env`:

```env
# Database
DB_USER=englishwebai
DB_PASSWORD=your_secure_password
DB_NAME=englishwebai_db

# Backend
SECRET_KEY=your-super-secret-key-min-32-characters
DEBUG=False

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Build và chạy containers

```bash
# Build và start tất cả services
docker-compose up -d

# Hoặc build lại images
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Truy cập ứng dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/v1/docs
- **PgAdmin** (dev): http://localhost:5050

## 🛠️ Docker Commands

### Start/Stop Services

```bash
# Start tất cả services
docker-compose up -d

# Stop tất cả services
docker-compose down

# Stop và xóa volumes
docker-compose down -v

# Restart service cụ thể
docker-compose restart backend
docker-compose restart frontend
```

### Quản lý Containers

```bash
# Xem trạng thái containers
docker-compose ps

# Xem logs
docker-compose logs -f [service_name]

# Vào shell của container
docker-compose exec backend bash
docker-compose exec frontend sh
docker-compose exec postgres psql -U englishwebai -d englishwebai_db

# Chạy lệnh trong container
docker-compose exec backend python manage.py
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Rollback migration
docker-compose exec backend alembic downgrade -1

# Backup database
docker-compose exec postgres pg_dump -U englishwebai englishwebai_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U englishwebai englishwebai_db < backup.sql
```

### Development với PgAdmin

```bash
# Start với PgAdmin
docker-compose --profile dev up -d

# Truy cập PgAdmin: http://localhost:5050
# Login: admin@englishwebai.com / admin123

# Kết nối đến PostgreSQL:
# Host: postgres
# Port: 5432
# Username: englishwebai
# Password: (từ .env)
```

## 📁 Docker Files Structure

```
EnglishWebAI/
├── docker-compose.yml          # Docker Compose configuration
├── .env.docker                 # Environment template
├── backend/
│   ├── Dockerfile             # Backend Dockerfile
│   └── .dockerignore          # Backend ignore rules
└── frontend/
    ├── Dockerfile             # Frontend Dockerfile
    ├── nginx.conf             # Nginx configuration
    └── .dockerignore          # Frontend ignore rules
```

## 🔧 Development Mode

Để development với hot-reload:

```bash
# Backend: Mount code as volume (đã config sẵn)
docker-compose up -d

# Frontend: Chạy development server riêng
cd frontend
npm install
npm run dev
```

## 🚀 Production Deployment

### 1. Build production images

```bash
# Set production environment
export DEBUG=False
export SECRET_KEY=your-production-secret-key

# Build images
docker-compose build --no-cache

# Tag images
docker tag englishwebai_backend:latest your-registry/englishwebai-backend:v1.0.0
docker tag englishwebai_frontend:latest your-registry/englishwebai-frontend:v1.0.0

# Push to registry
docker push your-registry/englishwebai-backend:v1.0.0
docker push your-registry/englishwebai-frontend:v1.0.0
```

### 2. Production docker-compose

Tạo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/englishwebai-backend:v1.0.0
    restart: always
    env_file: .env.production
    
  frontend:
    image: your-registry/englishwebai-frontend:v1.0.0
    restart: always
```

### 3. Deploy

```bash
# On production server
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Best Practices

1. **Đổi default passwords** trong `.env`
2. **Sử dụng secrets management** cho production
3. **Giới hạn exposed ports** khi deploy
4. **Enable SSL/TLS** với reverse proxy (nginx/traefik)
5. **Regular security updates**: `docker-compose pull && docker-compose up -d`

## 🐛 Troubleshooting

### Backend không connect được database

```bash
# Check database status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U englishwebai -d englishwebai_db -c "\conninfo"
```

### Port conflicts

```bash
# Đổi ports trong .env
BACKEND_PORT=8001
FRONTEND_PORT=8080
DB_PORT=5433
```

### Rebuild containers

```bash
# Rebuild everything
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Clear all Docker resources

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker rmi $(docker images -q englishwebai*)

# Clean up system
docker system prune -a --volumes
```

## 📊 Monitoring

### Health Checks

```bash
# Check health status
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Test frontend health
curl http://localhost/
```

### Logs

```bash
# View all logs
docker-compose logs -f

# Filter logs
docker-compose logs -f --tail=100 backend

# Export logs
docker-compose logs --no-color > logs.txt
```

## 🤝 Contributing

Khi thêm services mới vào Docker setup:

1. Thêm service vào `docker-compose.yml`
2. Tạo Dockerfile nếu cần
3. Update `.env.docker` với variables mới
4. Update documentation này

## 📝 Notes

- **Volumes**: Data được persist trong Docker volumes
- **Networks**: Tất cả services trong cùng network `englishwebai_network`
- **Hot reload**: Backend có hot-reload trong development mode
- **Frontend**: Build static files và serve qua Nginx

## 📞 Support

- Issues: https://github.com/CuongKenn/EnglishWebAI/issues
- Documentation: Xem README.md trong mỗi service

---

**Happy Coding! 🚀**
