# Hướng Dẫn Sử Dụng AI Virtual Room

## 📚 Tổng Quan

**AI Virtual Room** là hệ thống phòng học ảo thông minh, nơi học viên có thể:
- 🗣️ Luyện nói tiếng Anh với AI Teacher
- 🎯 Cải thiện phát âm và ngữ pháp
- 👥 Tham gia học nhóm với bạn bè
- 📊 Nhận phản hồi chi tiết sau mỗi buổi học

## 🚀 Cài Đặt

### 1. Chạy Migration Database

```bash
cd backend
alembic upgrade head
```

### 2. Khởi Động Backend

```bash
python main.py
```

### 3. Khởi Động Frontend

```bash
cd ../frontend
npm install  # Nếu chưa cài
npm run dev
```

### 4. Truy Cập

Mở trình duyệt và truy cập: `http://localhost:5173/discussion`

## ✨ Tính Năng Chính

### 1. Các Loại Phòng Học

#### 🗣️ Speaking Practice (Luyện Nói)
- Tập nói tự nhiên với AI
- Nhận feedback ngay lập tức
- Phù hợp mọi trình độ

#### 📢 Pronunciation (Phát Âm)
- Tập phát âm chuẩn
- AI đánh giá từng từ
- Cải thiện giọng điệu

#### 💬 Conversation (Hội Thoại)
- Trò chuyện tự nhiên về các chủ đề
- AI duy trì cuộc hội thoại
- Học từ vựng theo ngữ cảnh

#### 👥 Group Chat (Nhóm Chat)
- Học cùng bạn bè
- AI tham gia hỗ trợ
- Thực hành giao tiếp nhóm

### 2. Trình Độ

- 🟢 **Beginner (Cơ Bản)**: Cho người mới bắt đầu
- 🟡 **Intermediate (Trung Cấp)**: Cho người có nền tảng
- 🔴 **Advanced (Nâng Cao)**: Cho người thành thạo

### 3. Tính Năng AI Teacher

#### Sửa Ngữ Pháp Tự Động
```
Bạn: "I go to school yesterday"
AI: ✓ Sửa: "I went to school yesterday"
    Giải thích: Sử dụng quá khứ đơn cho hành động đã xảy ra
```

#### Gợi Ý Từ Vựng
```
Bạn: "The movie was very good"
AI: 💡 Thử dùng:
    - "excellent" - khi muốn nhấn mạnh
    - "fantastic" - khi rất ấn tượng
    - "outstanding" - khi xuất sắc
```

#### Đánh Giá Phát Âm
```
🎤 Điểm phát âm: 85/100
✓ Tốt: Phát âm rõ ràng
! Cần cải thiện: Trọng âm từ "comfortable"
```

## 🎯 Hướng Dẫn Sử Dụng

### Cách 1: Tạo Phòng Mới

1. Vào tab **"Phòng Học Ảo AI"**
2. Click nút **"Tạo phòng mới"**
3. Điền thông tin:
   - Tên phòng
   - Loại phòng (Speaking/Pronunciation/...)
   - Trình độ
   - Chủ đề (tùy chọn)
4. Click **"Tạo phòng"**

### Cách 2: Tham Gia Phòng Có Sẵn

1. Chọn phòng từ danh sách
2. Click vào card phòng để vào

### Cách 3: Tham Gia Bằng Mã

1. Nhận mã phòng từ bạn bè (VD: ABC123)
2. Click **"Tham gia phòng"**
3. Nhập mã 6 ký tự
4. Nhập biệt danh (tùy chọn)
5. Click **"Tham gia"**

## 💬 Sử Dụng Trong Phòng

### Chat Bằng Text

1. Gõ tin nhắn vào ô input
2. Nhấn **Enter** hoặc click nút **Send**
3. AI sẽ phản hồi ngay lập tức

### Chat Bằng Giọng Nói 🎤

1. Click nút **microphone** (biến đỏ khi đang bật)
2. Nói tiếng Anh
3. Văn bản sẽ tự động xuất hiện
4. Nhấn Send hoặc Enter

**Lưu ý**: Trình duyệt sẽ xin quyền truy cập micro lần đầu

### Xem Thống Kê Thành Viên

Sidebar bên trái hiển thị:
- 🤖 AI Teacher (luôn online)
- 👥 Các thành viên khác
- 🎤 Ai đang nói
- ⭐ Điểm phát âm của từng người

## 📊 Kết Thúc Buổi Học

### Tự Động
- Phiên tự động kết thúc khi rời phòng
- Nhận tổng kết chi tiết

### Tổng Kết Bao Gồm

1. **Thống Kê**
   - Thời gian học
   - Số tin nhắn gửi
   - Điểm phát âm trung bình

2. **Phản Hồi AI**
   - Tóm tắt buổi học
   - Điểm mạnh
   - Cần cải thiện
   - Chủ đề nên học tiếp

## 🎨 Giao Diện

### Theme
- Gradient tím - cam đẹp mắt
- Animation mượt mà
- Responsive trên mọi thiết bị

### Màu Sắc Trình Độ
- 🟢 **Beginner**: Xanh lá
- 🟡 **Intermediate**: Vàng
- 🔴 **Advanced**: Đỏ

## 🔧 API Endpoints

### Room Management
```
GET    /api/v1/ai-virtual-room/rooms
POST   /api/v1/ai-virtual-room/rooms
POST   /api/v1/ai-virtual-room/rooms/join
GET    /api/v1/ai-virtual-room/rooms/{id}
POST   /api/v1/ai-virtual-room/rooms/{id}/leave
```

### Messages
```
POST   /api/v1/ai-virtual-room/rooms/{id}/messages
GET    /api/v1/ai-virtual-room/rooms/{id}/messages
```

### Sessions
```
POST   /api/v1/ai-virtual-room/sessions/start
POST   /api/v1/ai-virtual-room/sessions/{id}/end
GET    /api/v1/ai-virtual-room/sessions/my-sessions
```

### WebSocket
```
WS     /api/v1/ai-virtual-room/ws/{room_id}?token=xxx
```

## 🧠 AI Configuration

AI sử dụng **Google Gemini** để:
- Tạo câu trả lời tự nhiên
- Phân tích ngữ pháp
- Gợi ý từ vựng
- Tạo tổng kết buổi học

### Cấu Hình AI Teacher

File: `backend/app/services/ai_virtual_room_service.py`

```python
def get_ai_teacher_persona(room_type, level, topic):
    # Persona khác nhau cho từng loại phòng
    # Điều chỉnh theo nhu cầu
```

## 🎯 Best Practices

### Cho Học Viên

1. **Bắt Đầu Từ Trình Độ Phù Hợp**
   - Đừng nhảy cóc trình độ
   - Học từ cơ bản

2. **Luyện Tập Đều Đặn**
   - Mỗi ngày 15-30 phút
   - Tốt hơn học dồn

3. **Sử Dụng Giọng Nói**
   - Tập phát âm thực tế
   - Tự tin hơn khi nói

4. **Chú Ý Phản Hồi**
   - Đọc sửa lỗi của AI
   - Áp dụng ngay

### Cho Giáo Viên

1. **Tạo Phòng Theo Chủ Đề**
   - Phù hợp với bài học
   - Tạo sự đa dạng

2. **Hướng Dẫn Học Sinh**
   - Giải thích cách dùng
   - Khuyến khích tham gia

3. **Theo Dõi Tiến Độ**
   - Xem session history
   - Đánh giá cải thiện

## 🐛 Xử Lý Lỗi

### Lỗi Thường Gặp

#### 1. Không Bật Được Micro
```
Lỗi: Trình duyệt không hỗ trợ

Giải pháp:
- Dùng Chrome, Edge, hoặc Safari
- Cho phép quyền truy cập micro
- Dùng HTTPS (production)
```

#### 2. AI Không Phản Hồi
```
Lỗi: GEMINI_API_KEY chưa config

Giải pháp:
1. Mở file .env
2. Thêm: GEMINI_API_KEY=your_key_here
3. Restart backend
```

#### 3. WebSocket Disconnect
```
Lỗi: Mất kết nối WebSocket

Giải pháp:
- Kiểm tra internet
- Reload trang
- Vào lại phòng
```

## 📱 Responsive Design

### Desktop (> 1024px)
- Sidebar + Main content
- Full features

### Tablet (768px - 1024px)
- Sidebar thu gọn
- Grid 2 cột

### Mobile (< 768px)
- Single column
- Stack layout
- Simplified UI

## 🔒 Security

### Authentication
- Tất cả API yêu cầu JWT token
- WebSocket verify token khi connect

### Authorization
- Chỉ participants mới thấy messages
- Chỉ creator mới xóa được room

## 🚀 Production Deployment

### Environment Variables

```bash
# Backend .env
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=postgresql://...
API_PREFIX=/api/v1
```

### HTTPS Required
Speech Recognition API chỉ hoạt động trên HTTPS trong production

### WebSocket Configuration
```python
# Cập nhật CORS nếu cần
allow_origins = ["https://yourdomain.com"]
```

## 📈 Future Enhancements

### Đang Phát Triển
- [ ] Voice recording & playback
- [ ] Real pronunciation scoring với speech API
- [ ] Video chat with WebRTC
- [ ] AI voice response (text-to-speech)
- [ ] Gamification (points, badges)
- [ ] Leaderboard
- [ ] Room themes customization

### Đề Xuất
- AI personas khác nhau (British, American)
- More detailed pronunciation feedback
- Practice scenarios (job interview, travel)
- Integration với bài tập trong hệ thống

## 💡 Tips & Tricks

1. **Tạo Atmosphere**
   - Chủ đề cụ thể giúp AI phản hồi đúng ngữ cảnh
   - VD: "Travel", "Job Interview", "Shopping"

2. **Học Nhóm Hiệu Quả**
   - Mời 3-4 người cùng trình độ
   - Thay phiên nhau nói
   - AI sẽ tương tác với tất cả

3. **Review Sessions**
   - Xem lại session history
   - Học từ lỗi đã mắc
   - Track progress over time

## 🆘 Support

### Issues
- Báo lỗi qua GitHub Issues
- Mô tả chi tiết: steps, screenshots, logs

### Contact
- Email: support@englishwebai.com
- Discord: EnglishWebAI Community

## 📄 License

MIT License - Free to use and modify

---

**Chúc bạn học tập hiệu quả với AI Virtual Room! 🎉**


