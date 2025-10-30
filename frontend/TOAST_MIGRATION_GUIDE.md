# Hướng dẫn thay thế Alert bằng Toast Notifications

## Các file đã hoàn thành:
✅ `Register.jsx` - Sử dụng inline error + toast
✅ `WritingExercise.jsx` - Sử dụng useToast hook

## Các bước thay thế Alert trong component:

### 1. Import các dependencies cần thiết:
```javascript
import Toast from '../../components/Toast/Toast';
import useToast from '../../hooks/useToast';
```

### 2. Khởi tạo useToast hook trong component:
```javascript
const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();
```

### 3. Thay thế các alert():

**Alert thành công:**
```javascript
// Cũ:
alert('✅ Thao tác thành công!');

// Mới:
showSuccess('Thao tác thành công!');
```

**Alert lỗi:**
```javascript
// Cũ:
alert('❌ Đã có lỗi xảy ra!');

// Mới:
showError('Đã có lỗi xảy ra!');
```

**Alert cảnh báo:**
```javascript
// Cũ:
alert('⚠️ Vui lòng kiểm tra lại!');

// Mới:
showWarning('Vui lòng kiểm tra lại!');
```

**Alert thông tin:**
```javascript
// Cũ:
alert('Thông tin quan trọng');

// Mới:
showInfo('Thông tin quan trọng');
```

### 4. Thêm ToastContainer vào cuối JSX return:
```javascript
return (
  <div>
    {/* ... component content ... */}
    
    {/* Toast Notification */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
      />
    )}
  </div>
);
```

## Các file cần thay thế (theo thứ tự ưu tiên):

### Teacher Components (ưu tiên cao):
1. ✅ `Teacher/Worksheets/Worksheets.jsx` - 10 alerts
2. ⏳ `Teacher/WeeklyAssessments/WeeklyAssessments.jsx` - 5 alerts
3. ⏳ `Teacher/TeacherMaterials/TeacherMaterials.jsx` - 1 alert
4. ⏳ `Teacher/TeacherDashboardV3/components/Statistics.jsx` - 1 alert
5. ⏳ `Teacher/TeacherDashboardV3/components/QuestionBankV2.jsx` - ~50 alerts (nhiều nhất)
6. ⏳ `Teacher/TeacherDashboardV3/components/NewsArticles.jsx` - 6 alerts
7. ⏳ `Teacher/TeacherDashboardV3/components/GradingFeedback.jsx` - 3 alerts
8. ⏳ `Teacher/TeacherDashboardV3/components/ExportReports.jsx` - 6 alerts
9. ⏳ `Teacher/TeacherDashboardV3/components/ExercisesTests.jsx` - 4 alerts
10. ⏳ `Teacher/TeacherDashboardV3/components/ExerciseManagement/` - 8 alerts
11. ⏳ `Teacher/TeacherDashboardV3/components/ClassManagement.jsx` - 14 alerts

## Lưu ý:
- Toast sẽ tự động đóng sau 5 giây (có thể tùy chỉnh)
- Có thể hiển thị nhiều toast cùng lúc (nếu cần)
- Loại bỏ emoji (✅, ❌, ⚠️) trong message vì toast đã có icon riêng
- Đối với các alert có nội dung dài hoặc cần xác nhận, cân nhắc sử dụng Modal thay vì Toast
