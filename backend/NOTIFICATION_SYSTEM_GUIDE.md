# 🔔 Hệ Thống Thông Báo Tự Động Cho Phụ Huynh

## 📋 Tổng Quan

Hệ thống thông báo tự động giúp phụ huynh nhận thông tin realtime về hoạt động học tập của con em mình, bao gồm:
- ✅ Điểm số khi giáo viên chấm bài
- ✅ Thông báo khi học sinh nộp bài tập
- ✅ Cảnh báo điểm số thấp
- ✅ Nhắc nhở bài tập sắp hết hạn
- ✅ Thông báo từ giáo viên

## 🏗️ Kiến Trúc Hệ Thống

### Backend Components

#### 1. **Models** (`app/models/notification.py`)
```python
class Notification(Base):
    id: int
    user_id: int              # Parent ID
    title: str                # Tiêu đề thông báo
    message: str              # Nội dung chi tiết
    type: str                 # grade, info, success, warning, alert
    is_read: bool             # Đã đọc chưa
    related_id: int           # ID liên quan (submission_id, exercise_id)
    related_type: str         # Loại liên quan (submission, exercise, class)
    created_at: datetime      # Thời gian tạo
```

#### 2. **Service** (`app/services/notification_service.py`)

##### `NotificationService` Class Methods:

**`notify_parents_on_grading(db, submission, teacher_name)`**
- Tự động tạo thông báo khi giáo viên chấm bài xong
- Gửi cho tất cả phụ huynh của học sinh
- Type: `grade`
- Bao gồm: điểm số, nhận xét của giáo viên

**`notify_parents_on_submission(db, submission)`**
- Tự động tạo thông báo khi học sinh nộp bài
- Type: `success`
- Thông báo phụ huynh rằng con đã hoàn thành bài tập

**`notify_parents_on_low_score(db, submission, threshold=5.0)`**
- Tự động cảnh báo khi điểm số thấp (< 5.0)
- Type: `warning`
- Khuyến khích phụ huynh hỗ trợ con học tập

**`notify_parents_on_exercise_due(db, student_id, exercise)`**
- Nhắc nhở khi bài tập sắp hết hạn
- Type: `alert`
- Có thể chạy bằng cronjob hàng ngày

**`notify_parents_on_teacher_announcement(db, class_id, title, message, teacher_name)`**
- Thông báo từ giáo viên gửi cho cả lớp
- Type: `info`
- Gửi cho phụ huynh của tất cả học sinh trong lớp

#### 3. **API Routes** (`app/routers/notifications.py`)

```
GET    /notifications/                  # Lấy danh sách thông báo
GET    /notifications/unread-count      # Đếm số thông báo chưa đọc
POST   /notifications/                  # Tạo thông báo (admin/system)
PATCH  /notifications/{id}              # Đánh dấu đã đọc/chưa đọc
PATCH  /notifications/mark-all-read     # Đánh dấu tất cả đã đọc
DELETE /notifications/{id}              # Xóa một thông báo
DELETE /notifications/                  # Xóa tất cả thông báo
```

#### 4. **Integration Points**

##### **Teacher Grading** (`app/routers/teacher_grading.py`)
```python
@router.put("/submissions/{submission_id}/feedback")
async def update_teacher_feedback(...):
    # ... chấm bài logic ...
    
    # Tự động tạo thông báo
    NotificationService.notify_parents_on_grading(db, submission, teacher_name)
    
    # Cảnh báo nếu điểm thấp
    if submission.score < 5.0:
        NotificationService.notify_parents_on_low_score(db, submission)
```

##### **Exercise Submission** (`app/routers/exercises.py`)
```python
@router.post("/{exercise_id}/submit")
async def submit_exercise(...):
    # ... nộp bài logic ...
    
    # Tự động thông báo phụ huynh
    NotificationService.notify_parents_on_submission(db, submission)
```

### Frontend Components

#### 1. **Service** (`frontend/src/services/notificationService.js`)
```javascript
const notificationService = {
  getNotifications(params),      // Lấy danh sách
  getUnreadCount(),               // Đếm chưa đọc
  markAsRead(notificationId),     // Đánh dấu đã đọc
  markAllAsRead(),                // Đánh dấu tất cả
  deleteNotification(id),         // Xóa một cái
  deleteAllNotifications()        // Xóa tất cả
};
```

#### 2. **Page** (`frontend/src/pages/Parent/Notifications/NotificationsPage.jsx`)

**Features:**
- ✅ Hiển thị danh sách thông báo
- ✅ Filter: Tất cả / Chưa đọc / Đã đọc
- ✅ Search: Tìm kiếm theo nội dung
- ✅ Mark as read: Click vào thông báo
- ✅ Mark all as read: Button "Đánh dấu tất cả đã đọc"
- ✅ Delete: Xóa từng thông báo
- ✅ Export: Xuất PDF/Excel (optional)
- ✅ Priority indicators: High/Medium/Low
- ✅ Type icons: Grade/Success/Warning/Alert/Info

## 🚀 Cài Đặt & Migration

### 1. Chạy Migration
```bash
cd backend
alembic upgrade head
```

Migration sẽ thêm 2 cột mới vào bảng `notifications`:
- `related_id` (Integer, nullable)
- `related_type` (String, nullable)

### 2. Restart Backend
```bash
python start_backend.py
```

### 3. Frontend Ready
Frontend đã được cập nhật, không cần làm gì thêm.

## 📊 Luồng Hoạt Động

### Kịch Bản 1: Giáo viên chấm bài
```
1. Teacher chấm bài → PUT /submissions/{id}/feedback
2. Backend update submission.score, submission.feedback
3. Backend gọi NotificationService.notify_parents_on_grading()
4. Service tìm parent của student
5. Tạo notification cho từng parent
6. Nếu điểm < 5.0 → tạo thêm warning notification
7. Parent reload page → thấy notification mới
```

### Kịch Bản 2: Học sinh nộp bài
```
1. Student nộp bài → POST /exercises/{id}/submit
2. Backend tạo submission
3. Backend gọi NotificationService.notify_parents_on_submission()
4. Service tìm parent của student
5. Tạo notification type='success'
6. Parent reload page → thấy thông báo con đã nộp bài
```

### Kịch Bản 3: Parent đọc thông báo
```
1. Parent mở trang /notifications
2. Frontend gọi GET /notifications
3. Hiển thị danh sách với unread badge
4. Parent click vào notification
5. Frontend gọi PATCH /notifications/{id} {is_read: true}
6. Notification được đánh dấu đã đọc
7. Unread count giảm
```

## 🎯 Notification Types

### `grade` - Điểm Bài Kiểm Tra
- **Icon**: Award (🏆)
- **Color**: Orange (#f59e0b)
- **Priority**: High
- **Trigger**: Teacher chấm bài xong
- **Example**: "Con bạn đã nhận điểm 9/10 cho bài tập..."

### `success` - Hoàn Thành
- **Icon**: CheckCircle (✓)
- **Color**: Green (#10b981)
- **Priority**: Low
- **Trigger**: Student nộp bài
- **Example**: "Con bạn đã hoàn thành bài tập..."

### `warning` - Cảnh Báo
- **Icon**: AlertCircle (⚠)
- **Color**: Orange (#f59e0b)
- **Priority**: High
- **Trigger**: Điểm số thấp (< 5.0)
- **Example**: "Con bạn có điểm thấp, cần chú ý..."

### `alert` - Khẩn Cấp
- **Icon**: AlertCircle (!)
- **Color**: Red (#ef4444)
- **Priority**: High
- **Trigger**: Bài tập sắp hết hạn
- **Example**: "Bài tập sẽ hết hạn vào ngày mai..."

### `info` - Thông Tin
- **Icon**: Info (i)
- **Color**: Blue (#3b82f6)
- **Priority**: Medium
- **Trigger**: Thông báo từ giáo viên
- **Example**: "Lớp học ngày mai thay đổi giờ..."

## 📱 API Examples

### Lấy Thông Báo
```bash
GET /api/v1/notifications?skip=0&limit=50&unread_only=false

Response:
[
  {
    "id": 1,
    "user_id": 5,
    "title": "Điểm bài kiểm tra mới",
    "message": "Con bạn Nguyễn Văn A đã nhận điểm 9/10...",
    "type": "grade",
    "is_read": false,
    "related_id": 123,
    "related_type": "submission",
    "created_at": "2025-10-31T10:30:00Z"
  }
]
```

### Đếm Chưa Đọc
```bash
GET /api/v1/notifications/unread-count

Response:
{
  "count": 5
}
```

### Đánh Dấu Đã Đọc
```bash
PATCH /api/v1/notifications/1
Content-Type: application/json

{
  "is_read": true
}

Response:
{
  "id": 1,
  "is_read": true,
  ...
}
```

### Đánh Dấu Tất Cả
```bash
PATCH /api/v1/notifications/mark-all-read

Response:
{
  "message": "All notifications marked as read"
}
```

### Xóa Thông Báo
```bash
DELETE /api/v1/notifications/1

Response:
{
  "message": "Notification deleted"
}
```

## 🔧 Tùy Chỉnh

### Thêm Loại Thông Báo Mới

1. **Backend**: Tạo method mới trong `NotificationService`
```python
@staticmethod
def notify_parents_on_custom_event(db: Session, ...):
    NotificationService.create_notification(
        db=db,
        user_id=parent_id,
        title="...",
        message="...",
        notification_type="custom",
        related_id=...,
        related_type="..."
    )
```

2. **Frontend**: Thêm case mới trong `loadNotifications()`
```javascript
case 'custom':
  icon = CustomIcon;
  color = '#your-color';
  priority = 'medium';
  break;
```

### Thay Đổi Threshold Điểm Thấp

File: `backend/app/routers/teacher_grading.py`
```python
# Thay đổi từ 5.0 sang giá trị khác
if submission.score and submission.score < 4.0:  # Thay 5.0 thành 4.0
    NotificationService.notify_parents_on_low_score(
        db, submission, threshold=4.0
    )
```

### Thêm Thông Tin Vào Notification

Update `NotificationService` để include thêm data:
```python
message = (
    f"Con bạn {student.full_name} đã nhận điểm {submission.score}/10 "
    f"cho bài tập \"{exercise.title}\" trong lớp {classroom.name}. "
    f"Nhận xét: {submission.feedback}"
)
```

## 🧪 Testing

### Test Backend Service
```python
# test_notification_service.py
def test_notify_parents_on_grading(db):
    submission = create_test_submission(db)
    NotificationService.notify_parents_on_grading(
        db, submission, "Teacher Name"
    )
    
    # Check notification created
    notif = db.query(Notification).filter(
        Notification.related_id == submission.id
    ).first()
    
    assert notif is not None
    assert notif.type == "grade"
    assert "Teacher Name" in notif.message
```

### Test Frontend
```javascript
// NotificationsPage.test.jsx
test('loads notifications on mount', async () => {
  render(<NotificationsPage />);
  
  await waitFor(() => {
    expect(screen.getByText('Điểm bài kiểm tra mới')).toBeInTheDocument();
  });
});

test('marks notification as read on click', async () => {
  render(<NotificationsPage />);
  
  const notification = screen.getByText('Điểm bài kiểm tra mới');
  fireEvent.click(notification);
  
  await waitFor(() => {
    expect(notification).not.toHaveClass('unread');
  });
});
```

## 🐛 Troubleshooting

### Thông báo không được tạo
**Nguyên nhân**: Không có parent-student link
**Giải pháp**: 
```sql
-- Check parent-student links
SELECT * FROM parent_students WHERE student_id = ? AND is_verified = true;
```

### Parent không nhận được thông báo
**Nguyên nhân**: Parent ID không đúng
**Giải pháp**:
```python
# Debug trong NotificationService
print(f"Creating notification for parent_id: {link.parent_id}")
```

### Frontend không load được notifications
**Nguyên nhân**: API endpoint không đúng hoặc CORS
**Giải pháp**:
- Check browser console
- Verify API URL trong `api.js`
- Check CORS settings trong backend

## 📈 Performance

### Database Indexes
```sql
-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Pagination
Frontend tự động load 100 notifications đầu tiên. Có thể tăng hoặc implement infinite scroll.

### Caching
Có thể cache unread count trong Redis:
```python
# Pseudocode
cache_key = f"parent:{parent_id}:unread_count"
count = redis.get(cache_key)
if not count:
    count = db.query(Notification).filter(...).count()
    redis.setex(cache_key, 300, count)  # 5 minutes
```

## 🔐 Security

### Authorization
- ✅ Parent chỉ xem được notification của mình
- ✅ Backend verify user_id trong token
- ✅ Không thể access notification của người khác

### Data Privacy
- ✅ Message không chứa thông tin nhạy cảm
- ✅ Related data được protect bởi permission checks

## 🎨 UI/UX Guidelines

### Hiển Thị Priority
- **High**: Border màu đỏ/cam, badge "Quan trọng"
- **Medium**: Border màu xanh, badge "Bình thường"
- **Low**: Border màu xám, badge "Thấp"

### Unread Indicators
- Dot màu đỏ bên trái notification
- Badge số lượng ở header
- Background màu nhạt cho unread

### Animations
- Smooth fade-in khi load
- Slide-out khi delete
- Pulse effect cho unread badge

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [React Hooks](https://react.dev/reference/react)
- [Lucide Icons](https://lucide.dev/)

---

**Version**: 1.0  
**Last Updated**: 31/10/2025  
**Author**: AI Assistant  
**Status**: ✅ Production Ready

