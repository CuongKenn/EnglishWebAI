// services/api.js
import axios from 'axios';

// Base URL configuration
const BASE_URL = 'http://127.0.0.1:8000';
const API_V1 = `${BASE_URL}/api/v1`;
const API_USERS = `${BASE_URL}/api/users`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
      throw error.response ? error.response.data : error;
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
  submitExercise: async (exerciseId, answer) => {
    try {
      const response = await apiClient.post(`/api/v1/exercises/${exerciseId}/submit`, {
        answer,
      });
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
  // Lấy danh sách học liệu
  getMaterials: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/v1/materials/', { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Lấy chi tiết học liệu
  getMaterialDetail: async (materialId) => {
    try {
      const response = await apiClient.get(`/api/v1/materials/${materialId}`);
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
};

// ==================== News APIs ====================
export const newsAPI = {
  // Lấy danh sách tin tức
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
};

// Export default apiClient for custom requests
export default apiClient;

// Backward compatibility
export const registerUser = authAPI.register;
