# 🎉 Tính năng Trao Đổi Nhóm (Group Discussion)

## ✨ Tổng quan

Hệ thống trao đổi nhóm hoàn chỉnh với:
- 💬 **Chat nhóm real-time** với WebSocket
- 📹 **Video call** với WebRTC (camera, microphone)
- 👥 **Quản lý thành viên**
- 🎨 **Giao diện đẹp** với gradient và animations

## 🚀 Tính năng chính

### 1. Tạo nhóm
- Tạo nhóm mới với tên và chế độ (Quiz/Chat/Mixed)
- Tự động tạo mã phòng (room code) để chia sẻ
- Hiển thị danh sách nhóm với card đẹp

### 2. Bên trong nhóm
- **Video Section** (Bên trái):
  - Bật/tắt camera và microphone
  - Hiển thị video của tất cả thành viên
  - Avatar placeholder khi tắt camera
  - Indicator trạng thái mic (muted/unmuted)

- **Chat Section** (Bên phải):
  - Gửi tin nhắn real-time
  - Hiển thị tin nhắn với tên người gửi
  - Tin nhắn của bạn có màu gradient đẹp
  - Timestamp cho mỗi tin nhắn

- **Participants Sidebar**:
  - Xem danh sách thành viên
  - Trạng thái online/offline
  - Avatar với initials

### 3. Navigation đẹp
- Sidebar bên trái cố định
- Width 80px, expand ra 200px khi hover
- Icon-first design với text hiện khi hover
- Gradient background với floating animations

## 📋 Cách sử dụng

### Tạo nhóm mới
1. Click vào tab **"Trao Đổi Nhóm"** ở sidebar trái
2. Click nút **"+ Tạo Nhóm Mới"**
3. Nhập:
   - **Tên nhóm**: Ví dụ "Học Tiếng Anh Giao Tiếp"
   - **Mô tả** (tùy chọn): "Nhóm luyện speaking"
   - **Chế độ**: Quiz / Chat / Mixed
4. Click **"Tạo Nhóm"**

### Tham gia nhóm
1. Mở nhóm từ danh sách
2. Giao diện bên trong nhóm sẽ hiện:
   - Video section ở bên trái
   - Chat section ở bên phải
   - Header với thông tin nhóm

### Sử dụng video call
1. Click nút **Camera** để bật/tắt camera
2. Click nút **Microphone** để bật/tắt mic
3. Video của bạn sẽ hiện đầu tiên
4. Video của người khác sẽ hiện theo grid

### Chat trong nhóm
1. Gõ tin nhắn ở ô input phía dưới
2. Nhấn **Enter** hoặc click nút **Send**
3. Tin nhắn sẽ hiển thị ngay lập tức
4. Tin nhắn của bạn: gradient xanh-tím
5. Tin nhắn người khác: nền trắng

### Xem thành viên
1. Click nút **"X người"** ở header
2. Sidebar thành viên sẽ trượt từ phải vào
3. Xem danh sách với avatar và trạng thái
4. Click **X** để đóng sidebar

### Rời nhóm
1. Click nút **"Rời nhóm"** ở header
2. Xác nhận trong popup
3. Quay lại danh sách nhóm

## 🎨 Giao diện

### Màu sắc
- **Primary gradient**: `#667eea → #764ba2` (xanh-tím)
- **Background**: Gradient với floating animations
- **Cards**: Trắng với shadow và border-radius 24px
- **Hover effects**: Transform + shadow + gradient

### Animations
- `fadeIn`: Modal và sections
- `slideUp`: Modal content
- `messageSlideIn`: Tin nhắn mới
- `pulse`: Mode selection
- `float`: Background circles

### Responsive
- **Desktop**: Full layout với 2 columns
- **Tablet**: Vertical stack
- **Mobile**: 
  - Single column
  - Participants sidebar full width
  - Video grid 1 column

## 🔧 Technical Details

### Backend APIs
```
GET    /api/v1/chat/rooms                 - Lấy danh sách nhóm
GET    /api/v1/chat/rooms/{id}            - Chi tiết nhóm
POST   /api/v1/chat/rooms                 - Tạo nhóm mới
POST   /api/v1/chat/rooms/join            - Tham gia nhóm bằng code
GET    /api/v1/chat/rooms/{id}/messages   - Lấy tin nhắn
GET    /api/v1/chat/rooms/{id}/participants - Lấy thành viên
WS     /api/v1/chat/rooms/ws/{id}         - WebSocket connection
```

### WebSocket Events
```javascript
// Gửi
{ type: "message", content: "..." }
{ type: "video_toggle", is_on: true/false }
{ type: "audio_toggle", is_on: true/false }

// Nhận
{ type: "message", user_id: 1, username: "...", content: "..." }
{ type: "user_joined", ... }
{ type: "user_left", ... }
```

### Frontend Components
```
EnhancedDiscussion.jsx    - Container chính với navigation
GroupRoom.jsx             - Danh sách nhóm và create modal
GroupRoomDetail.jsx       - Bên trong nhóm (video + chat)
```

### State Management
- `useState` cho UI state
- `useRef` cho WebSocket và video stream
- `useEffect` cho lifecycle và WebSocket connection

## 🐛 Troubleshooting

### Camera/Mic không hoạt động
- Kiểm tra quyền truy cập browser
- Đảm bảo HTTPS (hoặc localhost)
- F12 Console check errors

### WebSocket không kết nối
- Check backend đang chạy ở port 8000
- Kiểm tra token trong localStorage
- Console log connection status

### Tin nhắn không gửi được
- Kiểm tra WebSocket connected
- Verify participant membership
- Check network tab

### UI không đẹp
- Clear browser cache
- Check CSS files imported
- F12 Elements inspect styles

## 📝 Notes

- **Auto join**: Khi tạo nhóm, bạn tự động trở thành thành viên
- **Room code**: Mã phòng unique để chia sẻ cho người khác
- **Video quality**: Sử dụng WebRTC nên phụ thuộc vào mạng
- **Message history**: Lưu trong database, load khi vào nhóm
- **Offline handling**: WebSocket auto reconnect (có thể thêm)

## 🎯 Next Steps (Future)

- [ ] Screen sharing
- [ ] File/image upload trong chat
- [ ] Emoji reactions
- [ ] Message notifications
- [ ] Quiz mode implementation
- [ ] Recording video calls
- [ ] Virtual backgrounds
- [ ] Hand raise feature
- [ ] Breakout rooms

## 💡 Tips

1. **Hover sidebar**: Di chuột vào sidebar trái để expand
2. **Keyboard shortcuts**: Enter để gửi tin nhắn
3. **Video grid**: Tự động resize theo số người
4. **Participant count**: Hiện ở header
5. **Beautiful scrollbars**: Custom scrollbar trong CSS

---

**Enjoy your beautiful group discussion feature! 🎉**
