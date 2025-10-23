# Backend Structure - English AI Platform

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role ENUM('student', 'teacher', 'parent', 'admin') DEFAULT 'student',
  grade_level ENUM('kindergarten', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 2. Courses Table
```sql
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  grade_level VARCHAR(50),
  category VARCHAR(100), -- 'grammar', 'vocabulary', 'speaking', 'writing', 'listening'
  difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
  icon VARCHAR(50),
  color VARCHAR(20),
  total_lessons INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Lessons Table
```sql
CREATE TABLE lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT,
  lesson_order INT,
  duration_minutes INT,
  lesson_type VARCHAR(50), -- 'video', 'interactive', 'quiz', 'game'
  video_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

### 4. Fun English Activities Table
```sql
CREATE TABLE fun_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'animals', 'colors', 'food', 'sports'
  difficulty VARCHAR(20),
  icon VARCHAR(50),
  color VARCHAR(20),
  total_games INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Questions (Q&A Forum) Table
```sql
CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags JSON, -- ['grammar', 'tenses']
  views_count INT DEFAULT 0,
  answers_count INT DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 6. Answers Table
```sql
CREATE TABLE answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT,
  user_id INT,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN DEFAULT FALSE,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 7. News & Events Table
```sql
CREATE TABLE news_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  type VARCHAR(50), -- 'promotion', 'tips', 'guide', 'event'
  icon VARCHAR(50),
  publish_date DATE,
  event_date DATE,
  is_published BOOLEAN DEFAULT TRUE,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8. Teachers Table
```sql
CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(150),
  specialization VARCHAR(200),
  experience_years INT,
  total_students INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  bio TEXT,
  avatar VARCHAR(255),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 9. User Progress Table
```sql
CREATE TABLE user_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  course_id INT,
  lesson_id INT,
  completion_percentage INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  score INT,
  time_spent_minutes INT DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (user_id, lesson_id)
);
```

### 10. Enrollments Table
```sql
CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  course_id INT,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress_percentage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (user_id, course_id)
);
```

## API Endpoints Structure

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Courses
- `GET /api/courses` - Get all courses (with filters: grade, category)
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/lessons` - Get course lessons
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/my-courses` - Get user's enrolled courses

### Lessons
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons/:id/complete` - Mark lesson as completed
- `PUT /api/lessons/:id/progress` - Update lesson progress

### Fun English
- `GET /api/fun-activities` - Get all fun activities
- `GET /api/fun-activities/:id` - Get activity details
- `POST /api/fun-activities/:id/play` - Record activity play

### Q&A Forum
- `GET /api/questions` - Get all questions (with pagination)
- `POST /api/questions` - Create new question
- `GET /api/questions/:id` - Get question details with answers
- `POST /api/questions/:id/answers` - Post answer to question
- `PUT /api/answers/:id/upvote` - Upvote answer
- `PUT /api/answers/:id/best` - Mark as best answer

### News & Events
- `GET /api/news-events` - Get all news & events
- `GET /api/news-events/:id` - Get news/event details
- `PUT /api/news-events/:id/view` - Increment view count

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher details
- `POST /api/teachers/:id/contact` - Contact teacher

### User Progress
- `GET /api/progress/overview` - Get user's overall progress
- `GET /api/progress/courses/:id` - Get progress for specific course
- `GET /api/progress/stats` - Get learning statistics

## Backend Technology Stack Recommendations

### Option 1: Node.js + Express
```javascript
// Example structure
backend/
  ├── config/
  │   ├── database.js
  │   └── auth.js
  ├── controllers/
  │   ├── authController.js
  │   ├── courseController.js
  │   ├── questionController.js
  │   └── ...
  ├── models/
  │   ├── User.js
  │   ├── Course.js
  │   ├── Question.js
  │   └── ...
  ├── routes/
  │   ├── authRoutes.js
  │   ├── courseRoutes.js
  │   └── ...
  ├── middleware/
  │   ├── auth.js
  │   └── validation.js
  ├── utils/
  │   └── helpers.js
  └── server.js
```

### Option 2: Python + FastAPI/Django

### Option 3: Java + Spring Boot

## Frontend Integration Points

### 1. Update authService.js
```javascript
// Add API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  GET_USER: '/api/auth/me',
  COURSES: '/api/courses',
  QUESTIONS: '/api/questions',
  // ... more endpoints
};
```

### 2. Update api.js
```javascript
// Add API client configuration
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptors for auth tokens
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Next Steps for Implementation

1. Choose backend technology stack
2. Set up database (MySQL, PostgreSQL, or MongoDB)
3. Create database migrations
4. Implement authentication system (JWT tokens)
5. Create API endpoints
6. Connect frontend to backend
7. Implement real-time features (WebSocket for chat/Q&A)
8. Add file upload for avatars/images
9. Implement caching (Redis)
10. Set up CI/CD pipeline

