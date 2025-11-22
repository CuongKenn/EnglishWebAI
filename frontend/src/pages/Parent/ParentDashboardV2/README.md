# Parent Dashboard V2 - Phụ Huynh

## Tổng quan
Dashboard hiện đại và thân thiện dành cho Phụ huynh để theo dõi tiến độ học tập của con em.

## Cấu trúc

```
ParentDashboardV2/
├── ParentDashboardV2.jsx          # Main component
├── ParentDashboardV2.css          # Main styles
├── components/
│   ├── Sidebar.jsx                # Sidebar navigation
│   ├── Sidebar.css
│   ├── Dashboard.jsx              # Trang Dashboard chính
│   ├── Dashboard.css
│   ├── StudentProgress.jsx        # Theo dõi tiến độ
│   ├── StudentProgress.css
│   ├── Notifications.jsx          # Thông báo từ giáo viên
│   ├── Notifications.css
│   ├── Messages.jsx               # Trao đổi với giáo viên
│   ├── Messages.css
│   ├── Settings.jsx               # Cài đặt
│   └── Settings.css
└── README.md
```

## Tính năng

### 1. Dashboard (Tổng quan)
- **Chọn con em**: Card selector để chọn xem thông tin của con nào
- **Thống kê tổng quan**: 
  - Số lớp học đang theo
  - Bài học hoàn thành
  - Điểm trung bình
  - Chuyên cần
- **Hoạt động gần đây**: Timeline các hoạt động học tập
- **Tiến độ theo kỹ năng**: Progress bars cho từng kỹ năng
- **Công việc sắp tới**: Danh sách bài tập và deadline

### 2. Theo dõi tiến độ
- **Tab chọn con**: Tabs để chuyển đổi giữa các con
- **Chuyên cần**: Cards hiển thị số ngày có mặt, vắng, muộn
- **Tiến độ chi tiết**: 
  - Circular progress cho từng kỹ năng
  - Số bài học hoàn thành/tổng số
- **Timeline hoạt động**: Xem chi tiết các hoạt động đã thực hiện
- **Upcoming tasks**: Danh sách công việc sắp tới với priority

### 3. Thông báo
- **Filter tabs**: Lọc theo tất cả, chưa đọc, đã đọc
- **Thông báo realtime**: Nhận thông báo từ giáo viên
- **Loại thông báo**:
  - Điểm số mới (grade)
  - Thông tin chung (info)
  - Hoàn thành bài học (success)
  - Cảnh báo deadline (alert)
- **Tương tác**: Đánh dấu đã đọc, xóa thông báo

### 4. Trao đổi/Tin nhắn
- **Danh sách giáo viên**: Sidebar với tất cả giáo viên của con
- **Chat realtime**: Giao diện chat hiện đại
- **Online status**: Hiển thị trạng thái online của giáo viên
- **Tìm kiếm**: Search giáo viên nhanh chóng
- **Actions**: Gọi điện, video call (tương lai)

### 5. Cài đặt
- **Thông báo**: Toggle on/off các loại thông báo
  - Email notifications
  - Push notifications
  - Thông báo điểm số
  - Thông báo hoạt động
- **Tài khoản**: Quản lý thông tin cá nhân
- **Bảo mật**: Đổi mật khẩu
- **Trợ giúp**: Hướng dẫn sử dụng

## Design System

### Colors
- **Primary**: `#3b82f6` (Blue) - Màu chủ đạo cho phụ huynh
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Yellow)
- **Danger**: `#ef4444` (Red)
- **Purple**: `#8b5cf6`
- **Gray**: `#6b7280`

### Typography
- **Title**: 32px, font-weight: 700
- **Subtitle**: 16px, color: #6b7280
- **Body**: 14px-15px
- **Small**: 12-13px

### Spacing
- **Section padding**: 32px
- **Card padding**: 24px
- **Gap between elements**: 12-20px

### Border Radius
- **Cards**: 16px
- **Buttons**: 10-12px
- **Avatar**: 50% (circular)

## Logic & Integration

### API Services
Dashboard tích hợp với `parentService.js`:
- `parentAPI.getChildren()` - Lấy danh sách con em
- `parentAPI.getChildProgress(childId)` - Lấy tiến độ học tập
- `parentAPI.linkStudent(email)` - Liên kết với học sinh mới

### State Management
- Local state với `useState` cho UI interactions
- Data fetching với `useEffect`
- Error handling với try-catch

### Navigation
- Client-side routing với React Router
- Protected routes chỉ cho phụ huynh
- Sidebar navigation với active states

## Responsive Design
- **Desktop**: Full layout với sidebar và content area
- **Tablet**: Responsive grid, adjusted spacing
- **Mobile**: 
  - Stack layout
  - Collapsible sidebar
  - Touch-friendly buttons
  - Optimized for small screens

## Future Enhancements
- [ ] Real-time notifications với WebSocket
- [ ] Video call integration
- [ ] Export báo cáo PDF
- [ ] Lịch học tương tác
- [ ] Chat với nhiều giáo viên cùng lúc (group chat)
- [ ] Thống kê chi tiết hơn với charts
- [ ] Dark mode
- [ ] Multi-language support

## Usage

```jsx
import ParentDashboardV2 from './pages/Parent/ParentDashboardV2/ParentDashboardV2';

// In App.jsx or Routes
<Route
  path="/parent-dashboard"
  element={
    <ProtectedRoute requiredRole="parent">
      <ParentDashboardV2 />
    </ProtectedRoute>
  }
/>
```

## Notes
- Dashboard được thiết kế với tông màu xanh dương nhẹ nhàng, phù hợp với phụ huynh
- Không màu mè, tập trung vào thông tin quan trọng
- Dễ sử dụng, trực quan
- Responsive hoàn toàn trên mọi thiết bị

