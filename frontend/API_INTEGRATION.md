# API Integration Guide

## Cấu trúc API Services

Tất cả các API services đã được tích hợp vào frontend với cấu trúc như sau:

### 📁 Cấu trúc thư mục

```
frontend/src/
├── services/
│   ├── api.js              # Tất cả API endpoints
│   └── authService.js      # Authentication service
├── hooks/
│   ├── useClasses.js       # Classes custom hooks
│   ├── useLessons.js       # Lessons custom hooks
│   ├── useExercises.js     # Exercises custom hooks
│   ├── useMaterials.js     # Materials custom hooks
│   ├── useDiscussions.js   # Discussions custom hooks
│   ├── useNews.js          # News custom hooks
│   └── index.js            # Export tất cả hooks
└── components/
    └── ProtectedRoute/     # Route protection
```

## 🔐 Authentication

### Sử dụng AuthService

```javascript
import authService from './services/authService';

// Đăng ký
const registerResult = await authService.register({
  username: 'user123',
  phone: '0123456789',
  email: 'user@example.com',
  password: 'password',
  confirmPassword: 'password'
});

// Đăng nhập
const loginResult = await authService.login({
  username: 'user123',
  password: 'password'
});

// Lấy thông tin user hiện tại
const currentUser = authService.getCurrentUser();

// Kiểm tra đã đăng nhập
const isAuth = authService.isAuthenticated();

// Kiểm tra role
const isAdmin = authService.isAdmin();
const isTeacher = authService.isTeacher();
const isStudent = authService.isStudent();

// Đăng xuất
authService.logout();
```

## 📚 Sử dụng Custom Hooks

### Classes

```javascript
import { useClasses, useMyClasses, useClassDetail } from './hooks';

function ClassesPage() {
  // Lấy danh sách lớp học với filters
  const { classes, loading, error, refetch, joinClass, leaveClass } = useClasses({
    search: 'toán',
    grade: 'Lớp 2'
  });

  // Tham gia lớp học
  const handleJoin = async (classId) => {
    const success = await joinClass(classId);
    if (success) {
      alert('Tham gia lớp học thành công!');
    }
  };

  // Lấy danh sách lớp học của tôi
  const { classes: myClasses } = useMyClasses();

  // Lấy chi tiết lớp học
  const { classData } = useClassDetail(classId);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {classes.map(cls => (
        <div key={cls.id}>
          <h3>{cls.name}</h3>
          <button onClick={() => handleJoin(cls.id)}>Tham gia</button>
        </div>
      ))}
    </div>
  );
}
```

### Lessons

```javascript
import { useLessons, useLessonDetail } from './hooks';

function LessonsPage() {
  // Lấy danh sách bài học
  const { lessons, loading, error } = useLessons({
    grade: 'Lớp 2',
    subject: 'Toán'
  });

  // Chi tiết bài học và cập nhật tiến độ
  const { lesson, updateProgress } = useLessonDetail(lessonId);

  const handleUpdateProgress = async () => {
    const success = await updateProgress(80); // 80%
    if (success) {
      alert('Cập nhật tiến độ thành công!');
    }
  };

  return <div>...</div>;
}
```

### Exercises

```javascript
import { useExercises, useExerciseDetail } from './hooks';

function ExercisesPage() {
  // Lấy danh sách bài tập
  const { exercises } = useExercises({
    subject: 'Toán',
    grade: 'Lớp 2',
    difficulty: 'easy'
  });

  // Chi tiết bài tập
  const { exercise, submitExercise, getResult } = useExerciseDetail(exerciseId);

  // Nộp bài
  const handleSubmit = async () => {
    const result = await submitExercise({ answer: 'Your answer here' });
    console.log('Submission result:', result);
  };

  // Lấy kết quả
  const handleGetResult = async () => {
    const result = await getResult();
    console.log('Exercise result:', result);
  };

  return <div>...</div>;
}
```

### Materials

```javascript
import { useMaterials, useMaterialDetail } from './hooks';

function MaterialsPage() {
  // Lấy danh sách học liệu
  const { materials } = useMaterials({
    grade: 'Lớp 2',
    subject: 'Toán'
  });

  // Chi tiết học liệu
  const { material, updateProgress, downloadMaterial } = useMaterialDetail(materialId);

  // Tải xuống học liệu
  const handleDownload = async () => {
    const result = await downloadMaterial();
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  return <div>...</div>;
}
```

### Discussions

```javascript
import { useDiscussions, useDiscussionDetail } from './hooks';

function DiscussionsPage() {
  // Lấy danh sách thảo luận
  const { discussions, createDiscussion, deleteDiscussion } = useDiscussions({
    subject: 'Toán',
    answered: false
  });

  // Tạo thảo luận mới
  const handleCreate = async () => {
    const result = await createDiscussion({
      class_id: 1,
      title: 'Câu hỏi về phép cộng',
    });
    if (result) {
      alert('Tạo thảo luận thành công!');
    }
  };

  // Chi tiết thảo luận
  const { discussion, posts, createPost } = useDiscussionDetail(discussionId);

  // Tạo bình luận
  const handleCreatePost = async () => {
    const result = await createPost({
      content: 'Câu trả lời của tôi...',
      parent_post_id: null
    });
  };

  return <div>...</div>;
}
```

### News

```javascript
import { useNews, useNewsDetail } from './hooks';

function NewsPage() {
  // Lấy danh sách tin tức
  const { news, loading, error } = useNews({
    category: 'Học tập',
    skip: 0,
    limit: 10
  });

  // Chi tiết tin tức
  const { newsItem } = useNewsDetail(newsId);

  return <div>...</div>;
}
```

## 🛡️ Protected Routes

Bảo vệ các routes cần authentication:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes - cần đăng nhập */}
        <Route 
          path="/classes" 
          element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - chỉ admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole={['admin', 'superadmin']}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - chỉ teacher */}
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🔧 Sử dụng API trực tiếp (không dùng hooks)

Nếu bạn muốn gọi API trực tiếp thay vì dùng hooks:

```javascript
import { classesAPI, lessonsAPI, exercisesAPI } from './services/api';

// Classes
const classes = await classesAPI.getClasses({ search: 'toán' });
const classDetail = await classesAPI.getClassDetail(1);
await classesAPI.joinClass(1);

// Lessons
const lessons = await lessonsAPI.getLessons({ grade: 'Lớp 2' });
const lesson = await lessonsAPI.getLessonDetail(1);
await lessonsAPI.updateProgress(1, 75);

// Exercises
const exercises = await exercisesAPI.getExercises({ subject: 'Toán' });
const result = await exercisesAPI.submitExercise(1, { answer: 'answer' });

// Và tương tự cho các API khác...
```

## 📝 API Endpoints

Tất cả các endpoints có sẵn:

### Authentication
- `POST /api/users/login/` - Đăng nhập
- `POST /api/users/register/` - Đăng ký

### Classes
- `GET /api/v1/classes/` - Danh sách lớp học
- `GET /api/v1/classes/{id}` - Chi tiết lớp học
- `POST /api/v1/classes/{id}/join` - Tham gia lớp
- `POST /api/v1/classes/{id}/leave` - Rời lớp
- `GET /api/v1/classes/my-classes` - Lớp của tôi

### Lessons
- `GET /api/v1/lessons/` - Danh sách bài học
- `GET /api/v1/lessons/{id}` - Chi tiết bài học
- `GET /api/v1/lessons/{id}/materials` - Học liệu của bài học
- `POST /api/v1/lessons/{id}/progress` - Cập nhật tiến độ

### Exercises
- `GET /api/v1/exercises/` - Danh sách bài tập
- `GET /api/v1/exercises/{id}` - Chi tiết bài tập
- `POST /api/v1/exercises/{id}/submit` - Nộp bài
- `GET /api/v1/exercises/{id}/result` - Xem kết quả

### Materials
- `GET /api/v1/materials/` - Danh sách học liệu
- `GET /api/v1/materials/{id}` - Chi tiết học liệu
- `POST /api/v1/materials/{id}/progress` - Cập nhật tiến độ
- `GET /api/v1/materials/{id}/download` - Tải xuống

### Discussions
- `GET /api/v1/discussions/` - Danh sách thảo luận
- `POST /api/v1/discussions/` - Tạo thảo luận
- `GET /api/v1/discussions/{id}` - Chi tiết thảo luận
- `DELETE /api/v1/discussions/{id}` - Xóa thảo luận
- `GET /api/v1/discussions/{id}/posts` - Danh sách bình luận
- `POST /api/v1/discussions/{id}/posts` - Tạo bình luận

### News
- `GET /api/v1/news/` - Danh sách tin tức
- `GET /api/v1/news/{id}` - Chi tiết tin tức

## 🌐 Environment Configuration

Backend URL được cấu hình trong `services/api.js`:

```javascript
const BASE_URL = 'http://127.0.0.1:8000';
```

Để thay đổi cho production, cập nhật BASE_URL hoặc sử dụng environment variables.

## 🔄 Error Handling

Tất cả API calls đều có error handling tự động:
- Token expired → tự động redirect về /login
- Network errors → throw error với message rõ ràng
- Validation errors → throw error với detail từ backend

## 🚀 Ví dụ Component hoàn chỉnh

```javascript
import { useState } from 'react';
import { useClasses } from './hooks';

function ClassesPage() {
  const [filters, setFilters] = useState({ search: '', grade: '' });
  const { classes, loading, error, joinClass } = useClasses(filters);

  const handleJoin = async (classId) => {
    const success = await joinClass(classId);
    if (success) {
      alert('Tham gia lớp học thành công!');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <input 
        placeholder="Tìm kiếm..." 
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
      
      <div>
        {classes.map(cls => (
          <div key={cls.id}>
            <h3>{cls.name}</h3>
            <p>{cls.description}</p>
            <button onClick={() => handleJoin(cls.id)}>
              Tham gia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClassesPage;
```

---

**Lưu ý:** 
- Tất cả API calls đều tự động thêm Bearer token vào headers
- Token được lưu trong localStorage
- Khi token expired, user sẽ tự động logout và redirect về /login
