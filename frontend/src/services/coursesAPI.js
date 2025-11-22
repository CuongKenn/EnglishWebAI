import apiClient from './api';

const BASE_URL = '/api/v1/courses';

export const coursesManageAPI = {
  // List all courses with filters
  getCourses: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get single course detail
  getCourse: async (courseId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create new course
  createCourse: async (data) => {
    try {
      const response = await apiClient.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update course
  updateCourse: async (courseId, data) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${courseId}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload thumbnail (prepare for backend)
  uploadThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // TODO: Backend endpoint needed
      const response = await apiClient.post(`${BASE_URL}/upload-thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get units (lessons) for a course
  getUnits: async (courseId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${courseId}/units`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create unit
  createUnit: async (courseId, data) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/${courseId}/units`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update unit
  updateUnit: async (courseId, unitId, data) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${courseId}/units/${unitId}`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete unit
  deleteUnit: async (courseId, unitId) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${courseId}/units/${unitId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get questions for a unit
  getQuestions: async (unitId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/units/${unitId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create question
  createQuestion: async (unitId, data) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/units/${unitId}/questions`, data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Delete question
  deleteQuestion: async (unitId, questionId) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/units/${unitId}/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default coursesManageAPI;

