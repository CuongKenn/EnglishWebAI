/**
 * Exam Assessment Service
 * API calls for exam assessments (midterm/final exams)
 */
import api from './api';

const examService = {
  /**
   * Upload Word document to create exam
   * @param {FormData} formData - Form data with file and metadata
   * @returns {Promise<Object>} Upload response
   */
  uploadExamFromWord: async (formData) => {
    try {
      const response = await api.post('/api/v1/exam-assessments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes for AI parsing (large files need more time)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all exams for a class
   * @param {number} classId - Class ID
   * @param {string} examType - Optional exam type filter
   * @returns {Promise<Array>} List of exams
   */
  getClassExams: async (classId, examType = null) => {
    try {
      const params = examType ? { exam_type: examType } : {};
      const response = await api.get(`/api/v1/exam-assessments/classes/${classId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get exam detail
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Exam detail
   */
  getExamDetail: async (examId) => {
    try {
      const response = await api.get(`/api/v1/exam-assessments/${examId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update exam
   * @param {number} examId - Exam ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated exam
   */
  updateExam: async (examId, updateData) => {
    try {
      const response = await api.put(`/api/v1/exam-assessments/${examId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete exam
   * @param {number} examId - Exam ID
   * @returns {Promise<void>}
   */
  deleteExam: async (examId) => {
    try {
      await api.delete(`/api/v1/exam-assessments/${examId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Start exam (create submission)
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Submission
   */
  startExam: async (examId) => {
    try {
      const formData = new FormData();
      formData.append('exam_id', examId);
      const response = await api.post('/api/v1/exam-assessments/submissions/start', formData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update exam submission (save answers)
   * @param {number} submissionId - Submission ID
   * @param {Object} answers - Student answers
   * @param {string} status - Submission status
   * @returns {Promise<Object>} Updated submission
   */
  updateSubmission: async (submissionId, answers, status = 'in_progress') => {
    try {
      const response = await api.put(`/api/v1/exam-assessments/submissions/${submissionId}`, {
        answers,
        status,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Submit exam for grading
   * @param {number} submissionId - Submission ID
   * @param {Object} answers - Final answers
   * @returns {Promise<Object>} Submitted submission
   */
  submitExam: async (submissionId, answers) => {
    try {
      const response = await api.post(`/api/v1/exam-assessments/submissions/${submissionId}/submit`, {
        answers,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all submissions for an exam (teacher)
   * @param {number} examId - Exam ID
   * @returns {Promise<Array>} List of submissions
   */
  getExamSubmissions: async (examId) => {
    try {
      const response = await api.get(`/api/v1/exam-assessments/submissions/exam/${examId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get student's own submission
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Submission
   */
  getMySubmission: async (examId) => {
    try {
      const response = await api.get(`/api/v1/exam-assessments/submissions/my/${examId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Grade exam submission (teacher)
   * @param {number} submissionId - Submission ID
   * @param {Object} gradeData - Grade data (score, feedback, etc.)
   * @returns {Promise<Object>} Graded submission
   */
  gradeSubmission: async (submissionId, gradeData) => {
    try {
      const response = await api.post(`/api/v1/exam-assessments/submissions/${submissionId}/grade`, gradeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate full comprehensive exam with AI
   * @param {Object} params - Generation parameters
   * @param {string} params.exam_type - 'midterm' or 'final'
   * @param {string} params.grade - Grade level (e.g., '10', '11', '12')
   * @param {string} params.semester - Semester ('1' or '2')
   * @returns {Promise<Object>} Generated exam content with 4 skills
   */
  generateFullExam: async (params) => {
    try {
      const response = await api.post('/api/v1/exercises/generate-ai', {
        test_type: params.exam_type,
        grade: params.grade,
        semester: params.semester,
      });
      
      // Return the exercise data from response
      return response.data.exercise || response.data;
    } catch (error) {
      console.error('Generate full exam error:', error);
      throw error;
    }
  },
};

export default examService;

