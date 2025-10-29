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

  // Upload audio for listening questions
  uploadAudio: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${BASE_URL}/upload/audio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload document for reading questions
  uploadDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${BASE_URL}/upload/document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Student: Submit unit attempt
  submitUnit: async (unitId, answers) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/units/${unitId}/submit`, { answers });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Student: Get my progress
  getMyProgress: async (courseId = null) => {
    try {
      const params = courseId ? { course_id: courseId } : {};
      const response = await apiClient.get(`${BASE_URL}/progress/my`, { params });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Student: Get unit attempts
  getUnitAttempts: async (unitId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/units/${unitId}/attempts`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Upload thumbnail image
  uploadThumbnail: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${BASE_URL}/upload/thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Submit speaking audio with AI grading
  submitSpeakingAudio: async (unitId, audioBlob, referenceText) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('reference_text', referenceText);
      formData.append('unit_id', unitId);
      
      const response = await apiClient.post(`${BASE_URL}/speaking/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000 // 60 seconds for AI processing
      });
      return response.data;
    } catch (error) {
      console.error('Submit speaking error:', error);
      throw error.response ? error.response.data : error;
    }
  },

  // AI Feedback endpoints
  getListeningFeedback: async (score, correctAnswers, totalQuestions, timeSpent, unitId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/feedback/listening`, {
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        time_spent: timeSpent,
        unit_id: unitId
      });
      return response.data;
    } catch (error) {
      console.error('Get listening feedback error:', error);
      throw error.response ? error.response.data : error;
    }
  },

  getReadingFeedback: async (score, correctAnswers, totalQuestions, timeSpent, unitId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/feedback/reading`, {
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        time_spent: timeSpent,
        unit_id: unitId
      });
      return response.data;
    } catch (error) {
      console.error('Get reading feedback error:', error);
      throw error.response ? error.response.data : error;
    }
  },

  getWritingFeedback: async (essayText, wordCount, targetWords, timeSpent, unitId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/feedback/writing`, {
        essay_text: essayText,
        word_count: wordCount,
        target_words: targetWords,
        time_spent: timeSpent,
        unit_id: unitId
      });
      return response.data;
    } catch (error) {
      console.error('Get writing feedback error:', error);
      throw error.response ? error.response.data : error;
    }
  },
};

export default coursesManageAPI;

