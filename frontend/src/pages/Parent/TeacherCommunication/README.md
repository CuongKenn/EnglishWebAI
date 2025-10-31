# 💬 Trang Trao Đổi với Giáo Viên

## 📋 Tổng Quan

Trang **Teacher Communication** cho phép phụ huynh trao đổi trực tiếp với giáo viên của con em mình. Đây là trang đã được thiết kế lại hoàn toàn với giao diện hiện đại và đồng bộ với hệ thống.

## ✨ Tính Năng Chính

### 1. **Quản Lý Con**
- Xem danh sách tất cả các con được liên kết
- Chuyển đổi giữa các con (nếu có nhiều con)
- Xem giáo viên của từng con

### 2. **Danh Sách Giáo Viên**
- Hiển thị tất cả giáo viên đang dạy con
- Xem lớp học mà giáo viên đang dạy
- Tìm kiếm giáo viên theo tên hoặc email
- Avatar và thông tin liên hệ

### 3. **Cuộc Trò Chuyện**
- Xem danh sách cuộc trò chuyện đang có
- Hiển thị tin nhắn cuối và thời gian
- Đếm số tin nhắn chưa đọc
- Sắp xếp theo thời gian gần nhất

### 4. **Chat Realtime**
- Gửi và nhận tin nhắn
- Hiển thị trạng thái đang gửi
- Tự động scroll đến tin nhắn mới
- Đánh dấu đã đọc tự động

## 🎨 Giao Diện

### Components

#### **Navbar**
```jsx
<Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
```
- Điều hướng chính
- Profile dropdown
- Logout functionality

#### **Breadcrumb**
```
[← Trang chủ] > Trao đổi với giáo viên
```
- Biết vị trí hiện tại
- Quay lại trang chủ dễ dàng

#### **Page Header**
- Icon gradient với shadow
- Title và subtitle
- Info card (hiển thị con đang được chọn)

#### **Sidebar**
- **Header**: Gradient background
- **Child Selector**: Dropdown chọn con
- **Conversations List**: Danh sách cuộc trò chuyện
- **Teachers List**: Danh sách giáo viên với search

#### **Chat Area**
- **Chat Header**: Thông tin giáo viên
- **Messages Container**: Hiển thị tin nhắn
- **Input Area**: Gửi tin nhắn mới

## 🔧 Cấu Trúc Code

### State Management

```javascript
const [conversations, setConversations] = useState([]);     // Danh sách cuộc trò chuyện
const [teachers, setTeachers] = useState([]);               // Danh sách giáo viên
const [children, setChildren] = useState([]);               // Danh sách con
const [selectedChild, setSelectedChild] = useState(null);   // Con đang được chọn
const [selectedUser, setSelectedUser] = useState(null);     // Giáo viên đang chat
const [messages, setMessages] = useState([]);               // Tin nhắn hiện tại
const [newMessage, setNewMessage] = useState('');           // Tin nhắn mới
const [loading, setLoading] = useState(true);               // Trạng thái loading
const [sending, setSending] = useState(false);              // Trạng thái gửi tin
const [searchQuery, setSearchQuery] = useState('');         // Query tìm kiếm
```

### API Calls

#### 1. Load Children
```javascript
GET /api/v1/parent/children
Response: [{ id, name, email, ... }]
```

#### 2. Load Teachers for Child
```javascript
GET /api/v1/parent/children/{childId}/teachers
Response: [{ id, full_name, email, avatar_url, classes }]
```

#### 3. Load Conversations
```javascript
GET /messages/conversations
Response: [{ user_id, user_name, last_message, unread_count, ... }]
```

#### 4. Load Messages with User
```javascript
GET /messages/conversation/{userId}
Response: [{ id, content, sender_id, created_at, ... }]
```

#### 5. Send Message
```javascript
POST /messages/
Body: { receiver_id, content }
Response: { id, content, created_at, ... }
```

#### 6. Mark as Read
```javascript
PATCH /messages/conversation/{userId}/mark-all-read
Response: { success: true }
```

### Functions

#### **loadChildren()**
```javascript
// Tải danh sách con từ API
// Set selectedChild là con đầu tiên
```

#### **loadTeachersForChild(childId)**
```javascript
// Tải danh sách giáo viên của một con
// Cập nhật state teachers
```

#### **loadConversations()**
```javascript
// Tải danh sách cuộc trò chuyện
// Hiển thị unread count
```

#### **loadMessages(userId)**
```javascript
// Tải tin nhắn với một giáo viên
// Auto scroll to bottom
```

#### **handleSendMessage(e)**
```javascript
// Gửi tin nhắn mới
// Reload messages và conversations
// Reset input
```

#### **handleSelectTeacher(teacher)**
```javascript
// Chọn giáo viên để chat
// Load messages nếu có
// Set selectedUser
```

## 🎨 Styling

### CSS Classes

#### Layout
- `.teacher-communication-page` - Container chính
- `.breadcrumb-nav` - Navigation breadcrumb
- `.page-header-modern` - Header section
- `.communication-container` - Grid layout 2 cột

#### Sidebar
- `.sidebar` - Sidebar container
- `.sidebar-header` - Header với gradient
- `.child-selector` - Dropdown chọn con
- `.conversations-section` - Section cuộc trò chuyện
- `.teachers-section` - Section giáo viên
- `.search-box` - Ô tìm kiếm

#### Chat
- `.chat-area` - Chat container
- `.chat-header` - Header chat
- `.messages-container` - Container tin nhắn
- `.message` - Single message
- `.message.sent` - Tin nhắn đã gửi
- `.message.received` - Tin nhắn nhận được
- `.message-input-area` - Input gửi tin

### Color Scheme

```css
/* Primary Colors */
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
--background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

/* Text Colors */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--text-tertiary: #9ca3af;

/* Accent Colors */
--blue-gradient: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
--red-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

/* Borders & Shadows */
--border-light: #e5e7eb;
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 12px rgba(99, 102, 241, 0.15);
--shadow-lg: 0 6px 16px rgba(99, 102, 241, 0.4);
```

## 📱 Responsive Design

### Desktop (>1200px)
- Sidebar: 380px
- Chat: flex (còn lại)
- Padding: 3rem

### Laptop (1024-1200px)
- Sidebar: 340px
- Chat: flex
- Padding: 2rem

### Tablet (768-1024px)
- Sidebar: 300px
- Chat: flex
- Padding: 1.5rem

### Mobile (<768px)
- Single column
- Chat trên, Sidebar dưới
- Max height sidebar: 400px
- Padding: 1rem

### Small Mobile (<480px)
- Ultra compact
- Full width buttons
- Smaller fonts
- Padding: 0.75rem

## 🔒 Bảo Mật

### Authentication
```javascript
// Check user role = parent
if (current_user.role != UserRole.PARENT) {
  raise HTTPException(status_code=403)
}
```

### Authorization
```javascript
// Verify parent-child relationship
link = db.query(ParentStudent).filter(
  ParentStudent.parent_id == current_user.id,
  ParentStudent.student_id == child_id,
  ParentStudent.is_verified == True
).first()

if not link:
  raise HTTPException(status_code=404)
```

### Data Access
- Chỉ xem con của mình
- Chỉ chat với giáo viên dạy con
- Chỉ xem tin nhắn của mình

## 🐛 Debugging

### Common Issues

#### 1. No teachers showing
```javascript
// Check:
- selectedChild có đúng không?
- Child có enrolled classes không?
- Teachers có assigned không?
```

#### 2. Messages not loading
```javascript
// Check:
- selectedUser có đúng không?
- userId có đúng format không?
- Network tab có errors không?
```

#### 3. Can't send message
```javascript
// Check:
- newMessage có empty không?
- selectedUser có null không?
- Backend có running không?
```

### Console Logs
```javascript
console.log('Current user:', currentUserId);
console.log('Children:', children);
console.log('Selected child:', selectedChild);
console.log('Teachers:', teachers);
console.log('Selected user:', selectedUser);
console.log('Messages:', messages);
```

## 📚 Dependencies

### React
```javascript
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
```

### Services
```javascript
import messageService from '../../../services/messageService';
import { getCurrentUser } from '../../../services/userService';
import authService from '../../../services/authService';
```

### Components
```javascript
import Navbar from '../../../components/Navbar/Navbar';
```

### Icons
```javascript
import { 
  FaComments, FaPaperPlane, FaSearch, FaUserCircle,
  FaCircle, FaArrowLeft, FaChevronRight, FaInfoCircle
} from 'react-icons/fa';
```

## 🚀 Deployment

### Build
```bash
cd frontend
npm run build
```

### Serve
```bash
npm run preview
```

### Production
- Đảm bảo backend running
- Check API endpoints
- Test authentication
- Verify parent permissions

## 📝 Changelog

### Version 2.0 (31/10/2025)
- ✅ Added Navbar
- ✅ Added Breadcrumb
- ✅ Redesigned header
- ✅ Added info card
- ✅ Enhanced sidebar
- ✅ Improved chat area
- ✅ Added animations
- ✅ Better responsive
- ✅ Modern colors
- ✅ Gradient effects

### Version 1.0 (Original)
- Basic chat functionality
- Teacher list
- Message sending
- Conversation list

## 🤝 Contributing

Khi cập nhật trang này:
1. Giữ nguyên backend API calls
2. Test trên nhiều thiết bị
3. Check responsive design
4. Verify animations
5. Test với nhiều role
6. Update documentation

## 📞 Support

Nếu có vấn đề:
1. Check browser console
2. Check network tab
3. Verify backend running
4. Check user role
5. Test API endpoints manually

---

**Last Updated**: 31/10/2025  
**Version**: 2.0  
**Status**: ✅ Production Ready

