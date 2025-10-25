# SpeakingExercise Component

## Tổng quan
Component SpeakingExercise được thiết kế để tạo giao diện làm bài cho các khóa học speaking, lấy cảm hứng từ Prep và các ứng dụng học tiếng Anh hiện đại.

## Tính năng chính

### 1. Giao diện người dùng
- **Header kết quả**: Hiển thị trạng thái "Đạt" và điểm số khi hoàn thành bài tập
- **AI Grading Badge**: Thông báo bài được chấm bởi AI
- **Audio Player**: Giao diện phát audio với các nút điều khiển (play/pause, skip, volume, settings)
- **Recording Controls**: Nút ghi âm với animation và trạng thái rõ ràng
- **Score Display**: Hiển thị điểm số và trạng thái đạt/chưa đạt
- **Pronunciation Results**: Kết quả chấm phát âm với legend màu sắc

### 2. Các loại bài tập
- **Word Pronunciation**: Đọc từ đơn lẻ
- **Sentence Reading**: Đọc câu hoàn chỉnh
- **Question Answer**: Trả lời câu hỏi
- **Picture Description**: Mô tả hình ảnh
- **Conversation**: Đối thoại tình huống
- **Presentation**: Thuyết trình ngắn

### 3. Tính năng kỹ thuật
- **Audio Recording**: Sử dụng MediaRecorder API để ghi âm
- **Audio Playback**: Phát lại bản ghi âm của người dùng
- **Progress Tracking**: Theo dõi tiến độ qua các bài tập
- **Responsive Design**: Tối ưu cho mobile và desktop
- **Real-time Feedback**: Phản hồi tức thì khi hoàn thành bài tập

## Cách sử dụng

### 1. Routing
```jsx
<Route 
  path="/speaking/:courseId" 
  element={
    <ProtectedRoute isLoggedIn={isLoggedIn}>
      <SpeakingExercise />
    </ProtectedRoute>
  } 
/>
```

### 2. Navigation từ MyCourses
```jsx
<Link 
  to={course.category === 'speaking' ? `/speaking/${course.id}` : `/learn/${course.id}`}
  className="course-action-btn"
>
  {course.status === 'completed' && 'Xem lại'}
  {course.status === 'in-progress' && 'Tiếp tục học'}
  {course.status === 'not-started' && 'Bắt đầu học'}
</Link>
```

### 3. Mock Data Structure
```javascript
const speakingExercises = {
  'courseId': {
    title: 'Course Title',
    exercises: [
      {
        id: 1,
        title: 'Exercise Title',
        type: 'word-pronunciation', // hoặc 'sentence-reading', 'question-answer', etc.
        words: ['word1', 'word2'], // cho word-pronunciation
        currentWord: 'word1',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Beginner'
      }
    ]
  }
};
```

## Styling

### Màu sắc chính
- **Xanh lá**: #10b981 (Đạt, thành công)
- **Xanh dương**: #3b82f6 (Nút chính, audio controls)
- **Đỏ**: #ef4444 (Ghi âm, lỗi)
- **Cam**: #f59e0b (Cần cải thiện)
- **Xám**: #64748b (Text phụ)

### Layout
- **Container**: Gradient background với padding 20px
- **Cards**: White background với border-radius 16px và shadow
- **Buttons**: Rounded corners với hover effects
- **Progress bars**: Smooth animations với gradient fills

## Responsive Design

### Mobile (< 768px)
- Audio player chuyển thành layout dọc
- Navigation buttons full width
- Font sizes giảm phù hợp

### Tablet (768px - 1024px)
- Layout tối ưu cho màn hình trung bình
- Spacing điều chỉnh phù hợp

### Desktop (> 1024px)
- Layout đầy đủ với tất cả tính năng
- Hover effects và animations

## Dependencies
- React 18+
- React Router DOM
- Lucide React (icons)
- CSS3 với Flexbox/Grid

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Future Enhancements
- [ ] Tích hợp AI speech recognition
- [ ] Real-time pronunciation feedback
- [ ] Voice activity detection
- [ ] Advanced audio effects
- [ ] Offline support
- [ ] Multi-language support
