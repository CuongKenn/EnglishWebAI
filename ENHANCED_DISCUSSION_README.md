# Hỏi Đáp Thông Minh - Enhanced Discussion Feature

## Tổng quan

Tính năng Hỏi Đáp được nâng cấp với 3 chế độ học tập và giao tiếp:

1. **Đặt Câu Hỏi** - Hệ thống hỏi đáp truyền thống
2. **Chế độ Solo (Bài Học)** - Quiz tương tác với bảng xếp hạng
3. **Giao Tiếp Trò Chuyện** - Chat nhóm với video call

## Tính năng

### 1. Chế độ Solo (Quiz)

#### Dành cho học sinh:
- Tham gia quiz về ngữ pháp, từ vựng, nghe
- Trả lời câu hỏi có giới hạn thời gian
- Nhận phản hồi ngay lập tức
- Xem điểm số và bảng xếp hạng
- Cạnh tranh với bạn bè

#### Dành cho giáo viên:
- Tạo quiz room với chủ đề khác nhau
- Thêm câu hỏi (multiple choice, fill blank, listening)
- Thiết lập độ khó và thời gian
- Xem thống kê học sinh

### 2. Giao Tiếp Trò Chuyện

#### Tính năng chính:
- **Chat nhóm real-time** với WebSocket
- **Video call** với WebRTC
- **Bật/tắt camera và mic**
- **Biệt danh tùy chỉnh** trong phòng
- **Chế độ sáng/tối** (light/dark theme)
- **Mã phòng** để mời bạn bè
- **Danh sách thành viên** trực tuyến

#### Cách sử dụng:
1. Tạo phòng mới hoặc tham gia bằng mã
2. Bật camera/mic để giao tiếp
3. Chat văn bản song song với video
4. Thay đổi biệt danh và giao diện theo ý muốn

## Cài đặt

### Backend

1. **Chạy migration:**
```bash
cd backend
alembic upgrade head
```

2. **Khởi động server:**
```bash
python main.py
```

### Frontend

1. **Cài đặt dependencies:**
```bash
cd frontend
npm install
```

2. **Chạy development server:**
```bash
npm run dev
```

3. **Truy cập:** http://localhost:5173/discussion

## API Endpoints

### Quiz API

```
GET    /api/v1/quiz/rooms                    # Lấy danh sách quiz
GET    /api/v1/quiz/rooms/{id}               # Chi tiết quiz
POST   /api/v1/quiz/rooms                    # Tạo quiz (teacher)
POST   /api/v1/quiz/rooms/{id}/questions     # Thêm câu hỏi (teacher)
POST   /api/v1/quiz/sessions/start           # Bắt đầu quiz
POST   /api/v1/quiz/sessions/{id}/answer     # Gửi câu trả lời
POST   /api/v1/quiz/sessions/{id}/complete   # Hoàn thành quiz
GET    /api/v1/quiz/rooms/{id}/leaderboard   # Xem bảng xếp hạng
```

### Chat Room API

```
GET    /api/v1/chat/rooms                    # Lấy danh sách phòng
GET    /api/v1/chat/rooms/{id}               # Chi tiết phòng
POST   /api/v1/chat/rooms                    # Tạo phòng mới
POST   /api/v1/chat/rooms/join               # Tham gia phòng
POST   /api/v1/chat/rooms/{id}/messages      # Gửi tin nhắn
GET    /api/v1/chat/rooms/{id}/messages      # Lấy tin nhắn
PATCH  /api/v1/chat/rooms/{id}/theme         # Đổi giao diện
WS     /api/v1/chat/ws/{id}                  # WebSocket connection
```

## Database Schema

### Quiz Tables

- `quiz_rooms` - Phòng quiz
- `quiz_questions` - Câu hỏi
- `quiz_sessions` - Phiên làm bài
- `quiz_answers` - Câu trả lời của học sinh

### Chat Tables

- `chat_rooms` - Phòng chat
- `chat_participants` - Thành viên
- `chat_messages` - Tin nhắn

## WebSocket Events

### Client -> Server

```javascript
{
  type: "message" | "video_toggle" | "audio_toggle" | "peer_signal",
  data: { ... }
}
```

### Server -> Client

```javascript
{
  type: "message" | "user_joined" | "user_left" | "video_toggle" | "audio_toggle",
  data: { ... }
}
```

## Công nghệ sử dụng

### Backend
- FastAPI (REST API + WebSocket)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Alembic (Migrations)

### Frontend
- React 19
- Lucide React (Icons)
- WebRTC (Video call)
- WebSocket (Real-time chat)
- CSS3 (Animations)

## Giao diện

### Scrollbar Navigation
- Tab ngang có thể cuộn
- Hiệu ứng hover mượt mà
- Gradient background đẹp mắt
- Responsive trên mọi thiết bị

### Quiz Mode
- Card hiển thị đẹp
- Animation trả lời câu hỏi
- Progress bar trực quan
- Leaderboard với medal

### Chat Room Mode
- Video grid layout
- Chat bubbles hiện đại
- Participant list sidebar
- Theme switcher

## Tips & Best Practices

### Cho học sinh:
- Kiểm tra kết nối camera/mic trước khi vào phòng
- Đọc kỹ câu hỏi trước khi trả lời quiz
- Tận dụng thời gian để suy nghĩ
- Tham gia nhiều quiz để cải thiện

### Cho giáo viên:
- Tạo quiz với độ khó tăng dần
- Thêm explanation cho câu hỏi
- Theo dõi bảng xếp hạng để đánh giá
- Tạo phòng chat để hỗ trợ học sinh

## Troubleshooting

### Lỗi camera/mic không hoạt động:
1. Kiểm tra quyền truy cập trình duyệt
2. Đảm bảo không có ứng dụng khác đang dùng
3. Thử refresh trang

### WebSocket không kết nối:
1. Kiểm tra backend đang chạy
2. Xem console log để debug
3. Kiểm tra token authentication

### Quiz không load:
1. Kiểm tra database migration đã chạy
2. Xem backend logs
3. Kiểm tra API endpoints

## Phát triển tiếp

### Tính năng mở rộng:
- [ ] Screen sharing trong video call
- [ ] Ghi âm video call
- [ ] Quiz với hình ảnh/video
- [ ] AI tạo câu hỏi tự động
- [ ] Emoji reactions trong chat
- [ ] File sharing
- [ ] Private messaging
- [ ] Achievement badges

### Cải thiện:
- [ ] Optimize WebRTC performance
- [ ] Add more quiz types
- [ ] Better error handling
- [ ] Mobile app version
- [ ] Analytics dashboard

## License

MIT License - EnglishWebAI Project

## Contributors

- Backend API: FastAPI Team
- Frontend UI: React Team
- Design: UI/UX Team
