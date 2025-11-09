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
    const response = await api.post('/api/v1/exam-assessments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes for AI parsing (large files need more time)
    });
    return response.data;
  },

  /**
   * Get all exams for a class
   * @param {number} classId - Class ID
   * @param {string} examType - Optional exam type filter
   * @returns {Promise<Array>} List of exams
   */
  getClassExams: async (classId, examType = null) => {
    const params = examType ? { exam_type: examType } : {};
    const response = await api.get(`/api/v1/exam-assessments/classes/${classId}`, { params });
    return response.data;
  },

  /**
   * Get exam detail
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Exam detail
   */
  getExamDetail: async (examId) => {
    const response = await api.get(`/api/v1/exam-assessments/${examId}`);
    return response.data;
  },

  /**
   * Update exam
   * @param {number} examId - Exam ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated exam
   */
  updateExam: async (examId, updateData) => {
    const response = await api.put(`/api/v1/exam-assessments/${examId}`, updateData);
    return response.data;
  },

  /**
   * Delete exam
   * @param {number} examId - Exam ID
   * @returns {Promise<void>}
   */
  deleteExam: async (examId) => {
    await api.delete(`/api/v1/exam-assessments/${examId}`);
  },

  /**
   * Start exam (create submission)
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Submission
   */
  startExam: async (examId) => {
    const formData = new FormData();
    formData.append('exam_id', examId);
    const response = await api.post('/api/v1/exam-assessments/submissions/start', formData);
    return response.data;
  },

  /**
   * Update exam submission (save answers)
   * @param {number} submissionId - Submission ID
   * @param {Object} answers - Student answers
   * @param {string} status - Submission status
   * @returns {Promise<Object>} Updated submission
   */
  updateSubmission: async (submissionId, answers, status = 'in_progress') => {
    const response = await api.put(`/api/v1/exam-assessments/submissions/${submissionId}`, {
      answers,
      status,
    });
    return response.data;
  },

  /**
   * Submit exam for grading
   * @param {number} submissionId - Submission ID
   * @param {Object} answers - Final answers
   * @returns {Promise<Object>} Submitted submission
   */
  submitExam: async (submissionId, answers) => {
    const response = await api.post(`/api/v1/exam-assessments/submissions/${submissionId}/submit`, {
      answers,
    });
    return response.data;
  },

  /**
   * Get all submissions for an exam (teacher)
   * @param {number} examId - Exam ID
   * @returns {Promise<Array>} List of submissions
   */
  getExamSubmissions: async (examId) => {
    const response = await api.get(`/api/v1/exam-assessments/submissions/exam/${examId}`);
    return response.data;
  },

  /**
   * Get student's own submission
   * @param {number} examId - Exam ID
   * @returns {Promise<Object>} Submission
   */
  getMySubmission: async (examId) => {
    const response = await api.get(`/api/v1/exam-assessments/submissions/my/${examId}`);
    return response.data;
  },

  /**
   * Grade exam submission (teacher)
   * @param {number} submissionId - Submission ID
   * @param {Object} gradeData - Grade data (score, feedback, etc.)
   * @returns {Promise<Object>} Graded submission
   */
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await api.post(`/api/v1/exam-assessments/submissions/${submissionId}/grade`, gradeData);
    return response.data;
  },

  /**
   * Generate full comprehensive exam with AI
   * @param {Object} params - Generation parameters
   * @param {string} params.exam_type - 'midterm' or 'final'
   * @param {string} params.grade - Grade level (e.g., '10', '11', '12')
   * @param {string} params.semester - Semester ('1' or '2')
   * @param {string} params.difficulty - Difficulty level: 'easy', 'medium', 'hard', 'mixed'
   * @param {number} params.questions_per_skill - Number of questions per skill (default 10)
   * @param {string} params.additional_notes - Extra instructions for AI
   * @returns {Promise<Object>} Generated exam content with 4 skills
   */
  generateFullExam: async (params) => {
    try {
      // Calculate dynamic timeout based on questions per skill
      // Full exam with 4 skills needs more time: base 2 min + 30s per question per skill
      const questionsPerSkill = params.questions_per_skill || 10;
      const totalQuestions = questionsPerSkill * 4; // 4 skills
      const timeoutMs = Math.max(120000, Math.min(totalQuestions * 15000, 600000)); // 2-10 minutes
      
      const response = await api.post('/api/v1/exercises/generate-ai', {
        test_type: params.exam_type,
        grade: params.grade,
        semester: params.semester,
        difficulty: params.difficulty || 'mixed',
        questions_per_skill: questionsPerSkill,
        additional_notes: params.additional_notes || '',
      }, {
        timeout: timeoutMs
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

