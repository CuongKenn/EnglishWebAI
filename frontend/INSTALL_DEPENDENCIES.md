# Installation Guide - Teacher Dashboard V2

## Required Dependencies

Teacher Dashboard V2 cần các Radix UI packages để hoạt động đầy đủ.

## Cài đặt

### Option 1: Cài đặt tất cả cùng lúc (Khuyến nghị)

```bash
cd frontend
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-label @radix-ui/react-switch
```

### Option 2: Cài đặt từng package

```bash
cd frontend
npm install @radix-ui/react-dialog
npm install @radix-ui/react-tabs
npm install @radix-ui/react-label
npm install @radix-ui/react-switch
```

## Verify Installation

Sau khi cài đặt, `package.json` của bạn sẽ có các dependencies mới:

```json
{
  "dependencies": {
    "axios": "^1.12.2",
    "lucide-react": "^0.460.0",
    "prop-types": "^15.8.1",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.4",
    "@radix-ui/react-dialog": "^1.0.x",
    "@radix-ui/react-tabs": "^1.0.x",
    "@radix-ui/react-label": "^2.0.x",
    "@radix-ui/react-switch": "^1.0.x"
  }
}
```

## Optional: Chart Libraries (Cho Statistics)

Nếu muốn thêm biểu đồ thống kê:

### Recharts (Khuyến nghị)

```bash
npm install recharts
```

### Chart.js

```bash
npm install react-chartjs-2 chart.js
```

## Check Installation

Chạy lệnh sau để kiểm tra:

```bash
npm list @radix-ui/react-dialog
npm list @radix-ui/react-tabs
npm list @radix-ui/react-label
npm list @radix-ui/react-switch
```

Nếu thấy version numbers, installation thành công! ✅

## Troubleshooting

### Lỗi: "Cannot find module '@radix-ui/react-dialog'"

**Solution:**
```bash
npm install @radix-ui/react-dialog
```

### Lỗi: Peer dependencies warning

**Solution:**
```bash
npm install --legacy-peer-deps @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-label @radix-ui/react-switch
```

### Lỗi: Version conflicts

**Solution:**
```bash
# Clear cache
npm cache clean --force
# Remove node_modules
rm -rf node_modules package-lock.json
# Reinstall
npm install
# Install Radix UI packages
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-label @radix-ui/react-switch
```

## Start Development Server

Sau khi cài đặt xong:

```bash
npm run dev
```

Navigate to: `http://localhost:5173/teacher/dashboard-v2`

## Next Steps

1. ✅ Cài đặt dependencies
2. ✅ Start dev server
3. ✅ Access dashboard
4. ⏳ Tích hợp với backend API
5. ⏳ Customize theo nhu cầu

## Support

Nếu gặp vấn đề, check:
1. Node version: `node -v` (should be >= 16)
2. npm version: `npm -v` (should be >= 8)
3. Network connection (for downloading packages)

Hoặc liên hệ team phát triển để được hỗ trợ.

