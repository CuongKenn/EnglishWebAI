# Teacher Analytics API Documentation

## 📚 Tổng quan

API cung cấp thống kê và phân tích chi tiết cho giáo viên về kết quả học tập của học sinh.

**Base URL**: `/api/v1/teacher`

**Authentication**: Bearer Token required

---

## 🔐 Authentication

Tất cả endpoints yêu cầu authentication token:

```http
Authorization: Bearer <your_token_here>
```

---

## 📊 1. Get Teacher Statistics

Lấy thống kê tổng quan về tất cả lớp học của giáo viên.

### Endpoint
```http
GET /api/v1/teacher/statistics
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Khoảng thời gian: `week`, `month`, `semester`, `year` |
| `class_id` | integer | No | null | Filter theo lớp cụ thể |

### Example Request

```bash
# Thống kê tháng này, tất cả lớp
curl -X GET "http://localhost:8000/api/v1/teacher/statistics?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Thống kê học kỳ, lớp cụ thể
curl -X GET "http://localhost:8000/api/v1/teacher/statistics?period=semester&class_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response 200 OK

```json
{
  "total_students": 45,
  "avg_score": 78.5,
  "completion_rate": 85.3,
  "excellent_count": 12,
  "class_performance": [
    {
      "class_id": 1,
      "class_name": "10A1",
      "avg_score": 82.3,
      "completion": 90.5,
      "students": 25
    },
    {
      "class_id": 2,
      "class_name": "10A2",
      "avg_score": 74.2,
      "completion": 80.1,
      "students": 20
    }
  ],
  "score_distribution": [
    {
      "range": "0-4",
      "count": 3,
      "percentage": 6.7
    },
    {
      "range": "4-6",
      "count": 8,
      "percentage": 17.8
    },
    {
      "range": "6-8",
      "count": 20,
      "percentage": 44.4
    },
    {
      "range": "8-10",
      "count": 14,
      "percentage": 31.1
    }
  ],
  "skills_data": [
    {
      "skill": "Reading",
      "score": 82.5,
      "count": 45
    },
    {
      "skill": "Writing",
      "score": 75.3,
      "count": 42
    },
    {
      "skill": "Listening",
      "score": 78.9,
      "count": 38
    },
    {
      "skill": "Speaking",
      "score": 77.1,
      "count": 35
    }
  ],
  "monthly_progress": [
    {
      "month": "T09",
      "avg_score": 75.2,
      "submissions": 120
    },
    {
      "month": "T10",
      "avg_score": 78.5,
      "submissions": 135
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_students` | integer | Tổng số học sinh |
| `avg_score` | float | Điểm trung bình chung (0-100) |
| `completion_rate` | float | Tỷ lệ hoàn thành bài tập (%) |
| `excellent_count` | integer | Số học sinh xuất sắc (avg ≥ 80%) |
| `class_performance` | array | Kết quả từng lớp |
| `score_distribution` | array | Phân bố điểm số |
| `skills_data` | array | Điểm theo 4 kỹ năng |
| `monthly_progress` | array | Tiến độ 4 tháng gần nhất |

---

## 📥 2. Export Statistics to Excel

Xuất thống kê ra file Excel với nhiều sheets chi tiết.

### Endpoint
```http
GET /api/v1/teacher/statistics/export
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `month` | Khoảng thời gian |
| `class_id` | integer | No | null | Filter theo lớp |

### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/teacher/statistics/export?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.xlsx
```

### Response

**Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**File structure**:
- Sheet 1: **Tổng quan** - Thông tin chung, các chỉ tiêu
- Sheet 2: **Kết quả theo lớp** - Điểm TB, số HS mỗi lớp
- Sheet 3: **Phân bố điểm** - Phân loại điểm số (0-4, 4-6, 6-8, 8-10)
- Sheet 4: **Phân tích kỹ năng** - Điểm TB từng kỹ năng (Reading, Writing, Listening, Speaking)
- Sheet 5: **Tiến độ theo tháng** - Xu hướng điểm theo thời gian

**Filename format**: `BaoCaoThongKe_<username>_<timestamp>.xlsx`

---

## 📋 3. Get Class Overview

Lấy tổng quan về một lớp cụ thể.

### Endpoint
```http
GET /api/v1/teacher/classes/{class_id}/analytics/overview
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `class_id` | integer | ID của lớp |

### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/teacher/classes/1/analytics/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response 200 OK

```json
{
  "student_count": 25,
  "total_exercises": 15,
  "total_submissions": 320,
  "class_average": 78.5,
  "submission_rate": 85.3,
  "pending_grading": 12,
  "graded_submissions": 308
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `student_count` | integer | Số học sinh trong lớp |
| `total_exercises` | integer | Tổng số bài tập đã giao |
| `total_submissions` | integer | Tổng số bài đã nộp |
| `class_average` | float | Điểm TB lớp (0-100) |
| `submission_rate` | float | Tỷ lệ nộp bài (%) |
| `pending_grading` | integer | Số bài chưa chấm |
| `graded_submissions` | integer | Số bài đã chấm |

### Error Responses

**404 Not Found** - Lớp không tồn tại
```json
{
  "detail": "Class not found"
}
```

**403 Forbidden** - Không phải giáo viên của lớp
```json
{
  "detail": "Not authorized"
}
```

---

## 👥 4. Get Student Analytics (Paginated)

Lấy phân tích chi tiết từng học sinh trong lớp, có hỗ trợ phân trang.

### Endpoint
```http
GET /api/v1/teacher/classes/{class_id}/analytics/students
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `class_id` | integer | ID của lớp |

### Query Parameters

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `page` | integer | No | 1 | ≥ 1 | Số trang |
| `page_size` | integer | No | 50 | 1-200 | Số học sinh mỗi trang |

### Example Request

```bash
# Trang 1, 50 học sinh
curl -X GET "http://localhost:8000/api/v1/teacher/classes/1/analytics/students?page=1&page_size=50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trang 2, 20 học sinh
curl -X GET "http://localhost:8000/api/v1/teacher/classes/1/analytics/students?page=2&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response 200 OK

```json
{
  "total": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3,
  "students": [
    {
      "student_id": 101,
      "student_name": "Nguyễn Văn A",
      "total_submissions": 25,
      "graded_submissions": 22,
      "average_score": 88.5,
      "skill_scores": {
        "reading": 90.0,
        "writing": 85.0,
        "listening": 88.0,
        "speaking": 91.0
      },
      "recent_trend": "improving"
    },
    {
      "student_id": 102,
      "student_name": "Trần Thị B",
      "total_submissions": 23,
      "graded_submissions": 20,
      "average_score": 82.3,
      "skill_scores": {
        "reading": 85.0,
        "writing": 78.0,
        "listening": 83.0,
        "speaking": 82.0
      },
      "recent_trend": "stable"
    }
  ]
}
```

### Response Fields

**Pagination metadata:**
| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Tổng số học sinh |
| `page` | integer | Trang hiện tại |
| `page_size` | integer | Số items mỗi trang |
| `total_pages` | integer | Tổng số trang |
| `students` | array | Danh sách học sinh trong trang |

**Student object:**
| Field | Type | Description |
|-------|------|-------------|
| `student_id` | integer | ID học sinh |
| `student_name` | string | Tên đầy đủ |
| `total_submissions` | integer | Tổng số bài nộp |
| `graded_submissions` | integer | Số bài đã chấm |
| `average_score` | float | Điểm TB (0-100) |
| `skill_scores` | object | Điểm từng kỹ năng |
| `recent_trend` | string | Xu hướng: `improving`, `stable`, `declining` |

---

## 🧪 5. Test Endpoint

Kiểm tra xem router có hoạt động không.

### Endpoint
```http
GET /api/v1/teacher/test
```

### Example Request

```bash
curl -X GET "http://localhost:8000/api/v1/teacher/test"
```

### Response 200 OK

```json
{
  "status": "ok",
  "message": "Teacher analytics optimized router is working"
}
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized"
}
```

### 404 Not Found
```json
{
  "detail": "Class not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": {
    "error": "Failed to get statistics",
    "message": "Error description",
    "type": "ErrorType"
  }
}
```

---

## 🚀 Performance Notes

### Optimizations Applied:
- ✅ Eager loading với joinedload
- ✅ Database indexes (composite + single)
- ✅ Batch calculations
- ✅ Pagination cho large datasets
- ✅ Efficient caching

### Expected Response Times:
- **Statistics**: < 1 second
- **Class Overview**: < 0.5 seconds
- **Student Analytics**: < 2 seconds (với pagination)
- **Excel Export**: < 5 seconds

### Tips for Best Performance:
1. Sử dụng pagination khi có > 50 students
2. Filter theo `class_id` khi có thể
3. Chọn `period` phù hợp với nhu cầu
4. Export Excel nên làm async nếu data lớn

---

## 📊 Use Cases

### 1. Dashboard Overview
```javascript
// Load tổng quan tháng này
const stats = await fetch('/api/v1/teacher/statistics?period=month', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Class Detail Page
```javascript
// Load chi tiết một lớp
const overview = await fetch(`/api/v1/teacher/classes/${classId}/analytics/overview`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Student List with Pagination
```javascript
// Load danh sách học sinh, page by page
const students = await fetch(
  `/api/v1/teacher/classes/${classId}/analytics/students?page=${page}&page_size=20`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### 4. Export Report
```javascript
// Download Excel file
const response = await fetch('/api/v1/teacher/statistics/export?period=semester', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'report.xlsx';
a.click();
```

---

## 📝 Notes

1. **Điểm số**: Tất cả scores được chuẩn hóa về thang 0-100
2. **Excellent students**: Học sinh có avg score ≥ 80%
3. **Completion rate**: Tính theo tổng bài nộp / tổng bài giao cho tất cả HS
4. **Recent trend**: Dựa trên 5 bài nộp gần nhất, so sánh nửa đầu vs nửa sau
5. **Monthly progress**: Lấy 4 tháng gần nhất, format "T01", "T02", ...

---

## 🔍 Debugging

Nếu gặp vấn đề, check logs:

```bash
# Backend logs sẽ có format:
[ANALYTICS-OPT] Stats request: user=1, period=month, class=None
[ANALYTICS-OPT] Loaded 450 submissions
[ANALYTICS-OPT] Stats calculated successfully
[ANALYTICS-OPT] Export completed: BaoCaoThongKe_teacher1_20251030_123456.xlsx
```

---

## 📚 Related Documentation

- [Backend Optimization Summary](./BACKEND_OPTIMIZATION_SUMMARY.md)
- [Database Migrations](./alembic/versions/)
- [Performance Test Script](./test_analytics_performance.py)

