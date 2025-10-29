// services/api.js
import axios from 'axios';

// Base URL configuration
// Ưu tiên lấy từ biến môi trường Vite để linh hoạt ở dev/prod/Docker
const VITE_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && (
  import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_API_BASE_URL
)) || '';

// Cho phép truyền cả dạng đầy đủ (http://host:port) hoặc kèm /api/v1
const normalized = (() => {
  try {
    if (!VITE_API_BASE) return '';
    // Nếu người dùng set VITE_API_BASE_URL=http://localhost:8000/api/v1
    // thì tách phần base host để axios baseURL chuẩn
    const withoutTrailing = VITE_API_BASE.replace(/\/$/, '');
    const m = withoutTrailing.match(/^(.*):\/\/[^/]+(?::\d+)?(?:\/api\/v1)?$/);
    // Nếu có /api/v1 ở cuối, cắt đi
    return withoutTrailing.replace(/\/api\/v1$/, '');
  } catch {
    return '';
  }
})();

// Prefer explicit backend base if provided; otherwise fall back to relative in prod or localhost in dev
const isProduction = import.meta.env.PROD;
// Force localhost:8000 for development
const BASE_URL = 'http://localhost:8000';
const BASE_URL = normalized || (isProduction ? '' : 'http://localhost:8000');
const API_V1 = `${BASE_URL}/api/v1`;
const API_USERS = `${BASE_URL}/api/users`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Increase to 60 seconds for AI requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for /api/v1 endpoints
const apiV1Client = axios.create({
  baseURL: API_V1,
  timeout: 60000, // Increase to 60 seconds for AI requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for apiV1Client
apiV1Client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for apiV1Client
apiV1Client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ redirect về home nếu KHÔNG phải đang ở trang login
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/login');
      
      if (!isLoginPage && !isLoginRequest) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Export API instances
export const apiV1 = apiV1Client;
export const apiUsers = API_USERS;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ redirect về home nếu KHÔNG phải đang ở trang login
      // và KHÔNG phải request đến endpoint login
      const isLoginPage = window.location.pathname === '/login';
      const isLoginRequest = error.config?.url?.includes('/login');
      
      if (!isLoginPage && !isLoginRequest) {
        // Token expired or invalid - redirect to home
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Authentication APIs ====================
export const authAPI = {
  // Đăng ký user mới
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/users/register/', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Đăng nhập
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/api/users/login/', credentials);
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // Xử lý lỗi chi tiết hơn
      if (error.response) {
        const errorData = error.response.data;
        
        // Nếu có detail message từ backend
        if (errorData.detail) {
          throw { detail: errorData.detail, status: error.response.status };
        }
        
        // Nếu có message từ backend
        if (errorData.message) {
          throw { detail: errorData.message, status: error.response.status };
        }
        
        // Xử lý theo HTTP status code
        switch (error.response.status) {
          case 401:
            throw { detail: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
          case 403:
            throw { detail: 'Tài khoản đã bị vô hiệu hóa!' };
          case 404:
            throw { detail: 'Tài khoản không tồn tại!' };
          default:
            throw { detail: 'Đăng nhập thất bại, vui lòng thử lại!' };
        }
      }
      
      // Lỗi mạng hoặc lỗi khác
      if (error.message === 'Network Error') {
        throw { detail: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!' };
      }
      
      throw { detail: 'Đã xảy ra lỗi, vui lòng thử lại!' };
    }
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

// ==================== Classes APIs ====================
export const classesAPI = {
  // Lấy danh sách lớp học
  getClasses: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/classes/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết lớp học
  getClassDetail: async (classId) => {
    try {
      const response = await apiClient.get(`/api/v1/classes/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tham gia lớp học
  joinClass: async (classId) => {
    try {
      const response = await apiClient.post(`/api/v1/classes/${classId}/join`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Rời lớp học
  leaveClass: async (classId) => {
    try {
      const response = await apiClient.post(`/api/v1/classes/${classId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách lớp học của tôi
  getMyClasses: async () => {
    try {
      const response = await apiClient.get('/api/v1/classes/my-classes');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách lớp giáo viên đang dạy
  getTeachingClasses: async () => {
    try {
      const response = await apiClient.get('/api/v1/classes/teaching');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy học liệu của lớp (sau khi tham gia)
  getClassMaterials: async (classId) => {
    try {
      const response = await apiClient.get(`/api/v1/classes/${classId}/materials`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy bài tập của lớp (sau khi tham gia)
  getClassExercises: async (classId) => {
    try {
      const response = await apiClient.get(`/api/v1/classes/${classId}/exercises`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lessons of a class
  getClassLessons: async (classId) => {
    try {
      const response = await apiClient.get(`/api/v1/classes/${classId}/lessons`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  createLesson: async (classId, data) => {
    try {
      const response = await apiClient.post(`/api/v1/classes/${classId}/lessons`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  updateLesson: async (classId, lessonId, data) => {
    try {
      const response = await apiClient.put(`/api/v1/classes/${classId}/lessons/${lessonId}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  deleteLesson: async (classId, lessonId) => {
    try {
      const response = await apiClient.delete(`/api/v1/classes/${classId}/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Lessons APIs ====================
export const lessonsAPI = {
  // Lấy danh sách bài học
  getLessons: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/lessons/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết bài học
  getLessonDetail: async (lessonId) => {
    try {
      const response = await apiClient.get(`/api/v1/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy học liệu của bài học
  getLessonMaterials: async (lessonId) => {
    try {
      const response = await apiClient.get(`/api/v1/lessons/${lessonId}/materials`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật tiến độ học
  updateProgress: async (lessonId, progress) => {
    try {
      const response = await apiClient.post(
        `/api/v1/lessons/${lessonId}/progress`,
        null,
        { params: { progress } }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Exercises APIs ====================
export const exercisesAPI = {
  // Lấy danh sách bài tập
  getExercises: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/exercises/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết bài tập
  getExerciseDetail: async (exerciseId) => {
    try {
      const response = await apiClient.get(`/api/v1/exercises/${exerciseId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Nộp bài tập
  submitExercise: async (exerciseId, submissionData) => {
    try {
      const response = await apiClient.post(`/api/v1/exercises/${exerciseId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy kết quả bài tập
  getExerciseResult: async (exerciseId) => {
    try {
      const response = await apiClient.get(`/api/v1/exercises/${exerciseId}/result`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Materials APIs ====================
export const materialsAPI = {
  // Lấy danh sách học liệu cho student
  getMaterials: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/materials/student/materials/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết học liệu cho student
  getMaterialDetail: async (materialId) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/student/materials/${materialId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy học liệu theo lớp cho student
  getMaterialsByClass: async (classId, params = {}) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/student/materials/by-class/${classId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy thống kê học liệu cho student
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/api/v1/materials/student/materials/statistics');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật tiến độ học liệu
  updateProgress: async (materialId, progress) => {
    try {
      const response = await apiClient.post(
        `/api/v1/materials/${materialId}/progress`,
        null,
        { params: { progress } }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tải xuống học liệu
  downloadMaterial: async (materialId) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/${materialId}/download`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo học liệu (giáo viên)
  createMaterial: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/materials/', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật học liệu (giáo viên)
  updateMaterial: async (materialId, data) => {
    try {
      const response = await apiClient.put(`/api/v1/materials/${materialId}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa học liệu (giáo viên)
  deleteMaterial: async (materialId) => {
    try {
      const response = await apiClient.delete(`/api/v1/materials/${materialId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Danh sách học liệu theo lớp (giáo viên)
  listByClass: async (classId) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/by-class/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Danh sách học liệu theo bài học (giáo viên)
  listByLesson: async (lessonId) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/by-lesson/${lessonId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload file học liệu, trả về file_path
  upload: async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      // Tránh set Content-Type thủ công để axios tự thêm boundary
      // Gửi trực tiếp bằng axios, kèm Authorization nếu có
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${BASE_URL}/api/v1/materials/upload`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return response.data; // { file_path }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Courses (Public Catalog) APIs ====================
export const coursesAPI = {
  // List public courses (auth required for progress)
  getCourses: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/courses/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create a course (teacher/admin)
  createCourse: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/courses/', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // List exercises in a course
  getCourseExercises: async (courseId) => {
    try {
      const response = await apiClient.get(`/api/v1/courses/${courseId}/exercises`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Course detail
  getCourse: async (courseId) => {
    try {
      const response = await apiClient.get(`/api/v1/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create an exercise (teacher/admin)
  createCourseExercise: async (courseId, data) => {
    try {
      const response = await apiClient.post(`/api/v1/courses/${courseId}/exercises`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Submit exercise (student)
  submitCourseExercise: async (courseId, exerciseId, submission) => {
    try {
      const response = await apiClient.post(`/api/v1/courses/${courseId}/exercises/${exerciseId}/submit`, submission);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Units (Lessons)
  getUnits: async (courseId) => {
    try {
      const response = await apiClient.get(`/api/v1/courses/${courseId}/units`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  createUnit: async (courseId, data) => {
    try {
      const response = await apiClient.post(`/api/v1/courses/${courseId}/units`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  getQuestions: async (unitId) => {
    try {
      const response = await apiClient.get(`/api/v1/courses/units/${unitId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  createQuestion: async (unitId, data) => {
    try {
      const response = await apiClient.post(`/api/v1/courses/units/${unitId}/questions`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Discussions APIs ====================
export const discussionsAPI = {
  // Lấy danh sách thảo luận
  getDiscussions: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/discussions/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo chủ đề thảo luận mới
  createDiscussion: async (discussionData) => {
    try {
      const response = await apiClient.post('/api/v1/discussions/', discussionData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết thảo luận
  getDiscussionDetail: async (discussionId) => {
    try {
      const response = await apiClient.get(`/api/v1/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa thảo luận
  deleteDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.delete(`/api/v1/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy danh sách bình luận
  getPosts: async (discussionId, params = {}) => {
    try {
      const response = await apiClient.get(`/api/v1/discussions/${discussionId}/posts`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo bình luận mới
  createPost: async (discussionId, postData) => {
    try {
      const response = await apiClient.post(
        `/api/v1/discussions/${discussionId}/posts`,
        postData
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa bình luận
  deletePost: async (discussionId, postId) => {
    try {
      const response = await apiClient.delete(`/api/v1/discussions/${discussionId}/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Like câu hỏi
  likeDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.post(`/api/v1/discussions/${discussionId}/like`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Unlike câu hỏi
  unlikeDiscussion: async (discussionId) => {
    try {
      const response = await apiClient.delete(`/api/v1/discussions/${discussionId}/like`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tăng lượt xem
  viewThread: async (discussionId) => {
    try {
      const response = await apiClient.post(`/api/v1/discussions/${discussionId}/view`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Question Bank APIs ====================
export const questionBankAPI = {
  // List with optional filters
  list: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/question-bank/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Create item
  create: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/question-bank/', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Update item
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/v1/question-bank/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Delete item
  remove: async (id) => {
    const response = await apiClient.delete(`/api/v1/question-bank/${id}`);
    return response.data;
  },
  // Bulk delete items
  bulkDelete: async (ids) => {
    try {
      const response = await apiClient.post('/api/v1/question-bank/bulk-delete', ids);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Duplicate item
  duplicate: async (id) => {
    try {
      const response = await apiClient.post(`/api/v1/question-bank/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // Upload audio
  uploadAudio: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/question-bank/upload/audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  // Upload passage file
  uploadPassage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/question-bank/upload/passage', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  // Import CSV
  importCSV: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/question-bank/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  // Generate test by AI
  generateTest: async (config) => {
    // Dynamic timeout based on number of questions
    // Base: 2 minutes + 1 minute per 10 questions
    const numQuestions = config.totalQuestions || 10;
    const timeoutMs = Math.max(120000, Math.min(numQuestions * 12000, 600000)); // 2-10 minutes
    console.log(`[API] Generate test timeout: ${timeoutMs/1000}s for ${numQuestions} questions`);
    
    const response = await apiClient.post('/api/v1/question-bank/generate-test', config, {
      timeout: timeoutMs
    });
    return response.data;
  },
  // Export DOCX
  exportDocx: async (test) => {
    const response = await apiClient.post('/api/v1/question-bank/export-docx', test, {
      responseType: 'blob',
    });
    return response;
  },
  // Create exercise from test
  createExerciseFromTest: async (test, classId = null) => {
    const params = {};
    if (classId) params.class_id = classId;
    const response = await apiClient.post('/api/v1/question-bank/create-exercise', test, { params });
    return response.data;
  },
  // Save all questions from generated test to user's bank
  saveFromTest: async (test) => {
    const response = await apiClient.post('/api/v1/question-bank/save-from-test', test);
    return response.data;
  },
  // Save entire test as a set in bank
  saveTestSet: async (test) => {
    const response = await apiClient.post('/api/v1/question-bank/save-testset', test);
    return response.data;
  },
  // Get all saved test sets
  getTestSets: async () => {
    const response = await apiClient.get('/api/v1/question-bank/testsets');
    return response.data;
  },
  // Get test set detail
  getTestSetDetail: async (testId) => {
    const response = await apiClient.get(`/api/v1/question-bank/testsets/${testId}`);
    return response.data;
  },
  // Delete test set
  deleteTestSet: async (testId) => {
    const response = await apiClient.delete(`/api/v1/question-bank/testsets/${testId}`);
    return response.data;
  },
  // Parse DOCX file to text
  parseDocx: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/api/v1/question-bank/parse-docx', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
};

// ==================== News APIs ====================
export const newsAPI = {
  // Lấy danh sách tin tức (public)
  getNews: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/news/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết tin tức
  getNewsDetail: async (newsId) => {
    try {
      const response = await apiClient.get(`/api/v1/news/${newsId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy tất cả tin tức cho quản lý (admin/teacher)
  getAllNewsForManagement: async () => {
    try {
      const response = await apiClient.get('/api/v1/news/manage/all');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo tin tức mới (admin/teacher)
  createNews: async (newsData) => {
    try {
      const response = await apiClient.post('/api/v1/news/', newsData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật tin tức (admin/teacher)
  updateNews: async (newsId, newsData) => {
    try {
      const response = await apiClient.put(`/api/v1/news/${newsId}`, newsData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa tin tức (admin/teacher)
  deleteNews: async (newsId) => {
    try {
      const response = await apiClient.delete(`/api/v1/news/${newsId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Thích tin tức (yêu cầu đăng nhập)
  likeNews: async (newsId) => {
    try {
      const response = await apiClient.post(`/api/v1/news/${newsId}/like`);
      return response.data; // { likes }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Bỏ thích tin tức (yêu cầu đăng nhập)
  unlikeNews: async (newsId) => {
    try {
      const response = await apiClient.delete(`/api/v1/news/${newsId}/like`);
      return response.data; // { likes }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload ảnh cho tin tức
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/api/v1/news/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data; // { url }
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Sinh bài viết bằng AI
  generateArticle: async (params) => {
    try {
      const response = await apiClient.post('/api/v1/news/generate-ai', params);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update status
  updateNewsStatus: async (newsId, status) => {
    try {
      const response = await apiClient.patch(`/api/v1/news/${newsId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Users APIs ====================
export const usersAPI = {
  // Lấy thông tin profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/api/v1/users/me', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post('/api/v1/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ==================== Admin APIs ====================
export const adminAPI = {
  // Lấy danh sách users
  getUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo user mới
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/v1/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cập nhật user
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/api/v1/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Xóa user
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/api/v1/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Import users via CSV
  importUsersCSV: async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await apiClient.post('/api/v1/admin/users/import-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // System Settings
  getSystemSettings: async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/settings');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  updateSystemSettings: async (settings) => {
    try {
      const response = await apiClient.put('/api/v1/admin/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  initializeDefaultSettings: async () => {
    try {
      const response = await apiClient.post('/api/v1/admin/settings/initialize');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // System Config (Low-level)
  getAllSystemConfigs: async (publicOnly = false) => {
    try {
      const response = await apiClient.get('/api/v1/admin/system-config', {
        params: { public_only: publicOnly }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  getSystemConfigByKey: async (key) => {
    try {
      const response = await apiClient.get(`/api/v1/admin/system-config/${key}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  createSystemConfig: async (configData) => {
    try {
      const response = await apiClient.post('/api/v1/admin/system-config', configData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  updateSystemConfig: async (key, configData) => {
    try {
      const response = await apiClient.put(`/api/v1/admin/system-config/${key}`, configData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  deleteSystemConfig: async (key) => {
    try {
      const response = await apiClient.delete(`/api/v1/admin/system-config/${key}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  bulkUpdateSystemConfigs: async (configs) => {
    try {
      const response = await apiClient.post('/api/v1/admin/system-config/bulk-update', { configs });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ===========================
// AI Conversation API
// ===========================
export const aiAPI = {
  // Chat with AI
  sendMessage: async (message, chatHistory = null, systemPrompt = null) => {
    try {
      const response = await apiClient.post('/api/v1/ai/conversation', {
        message,
        chat_history: chatHistory,
        system_prompt: systemPrompt
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get conversation suggestions
  getConversationSuggestions: async (topic = null) => {
    try {
      const response = await apiClient.post('/api/v1/ai/conversation/suggestions', {
        topic
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Check writing
  checkWriting: async (text, writingType = 'general', level = 'intermediate') => {
    try {
      const response = await apiClient.post('/api/v1/ai/writing/check', {
        text,
        writing_type: writingType,
        level
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Generate writing topic
  generateWritingTopic: async (writingType = 'general', level = 'intermediate') => {
    try {
      const response = await apiClient.post('/api/v1/ai/writing/generate-topic', {
        writing_type: writingType,
        level
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Generate reading passage
  generateReadingPassage: async (level = 'intermediate', readingType = 'article', topic = null) => {
    try {
      const response = await apiClient.post('/api/v1/ai/reading/generate', {
        level,
        reading_type: readingType,
        topic
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Check reading answers
  checkReadingAnswers: async (answers) => {
    try {
      const response = await apiClient.post('/api/v1/ai/reading/check-answers', {
        answers
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ===========================
// AI Usage Logging API
// ===========================
export const aiUsageAPI = {
  // Log a usage event for AI features
  logUsage: async (feature, metadata = {}) => {
    try {
      const response = await apiClient.post('/api/v1/ai/usage', {
        feature,
        metadata,
      });
      return response.data;
    } catch (error) {
      // Do not throw to avoid breaking UX; surface optional debugging
      // console.warn('AI usage log failed', error);
      return null;
    }
  },
};

// ===========================
// Lesson Plans API
// ===========================
export const lessonPlansAPI = {
  // Get all lesson plans
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/lesson-plans/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get lesson plan by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/lesson-plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create lesson plan manually
  create: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/lesson-plans/', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Generate lesson plan with AI
  generateWithAI: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/lesson-plans/generate', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update lesson plan
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/v1/lesson-plans/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete lesson plan
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/api/v1/lesson-plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Download lesson plan as Word
  downloadWord: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/lesson-plans/${id}/export/word`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Download lesson plan as PDF
  downloadPDF: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/lesson-plans/${id}/export/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

// ===========================
// Worksheets API
// ===========================
export const worksheetsAPI = {
  // Get all worksheets
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/worksheets/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get worksheet by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/worksheets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create worksheet manually
  create: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/worksheets/', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Generate worksheet with AI
  generateWithAI: async (data) => {
    try {
      const response = await apiClient.post('/api/v1/worksheets/generate', data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update worksheet
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/v1/worksheets/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete worksheet
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/api/v1/worksheets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Download worksheet as Word
  downloadWord: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/worksheets/${id}/export/word`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download Word error:', error);
      // If error response is blob, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw { response: { data: errorData } };
        } catch (parseError) {
          // If can't parse, throw original error
          throw error;
        }
      }
      throw error;
    }
  },

  // Download worksheet as PDF
  downloadPDF: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/worksheets/${id}/export/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download PDF error:', error);
      // If error response is blob, try to parse it
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw { response: { data: errorData } };
        } catch (parseError) {
          // If can't parse, throw original error
          throw error;
        }
      }
      throw error;
    }
  },
};

// Export default apiClient for custom requests
export default apiClient;

// Backward compatibility
export const registerUser = authAPI.register;
