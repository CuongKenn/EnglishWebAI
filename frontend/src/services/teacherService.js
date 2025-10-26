import { apiV1 } from './api';

export const teacherService = {
  // Classes Management
  getTeachingClasses: async () => {
    const response = await apiV1.get('/classes/teaching');
    return response.data;
  },

  getClassDetails: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}`);
    return response.data;
  },

  getClassStudents: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/students`);
    return response.data;
  },

  addStudents: async (classId, students) => {
    const response = await apiV1.post(`/classes/${classId}/students`, students);
    return response.data;
  },

  // Lessons Management
  getClassLessons: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/lessons`);
    return response.data;
  },

  createLesson: async (classId, lessonData) => {
    const response = await apiV1.post(`/classes/${classId}/lessons`, lessonData);
    return response.data;
  },

  updateLesson: async (classId, lessonId, lessonData) => {
    const response = await apiV1.put(`/classes/${classId}/lessons/${lessonId}`, lessonData);
    return response.data;
  },

  deleteLesson: async (classId, lessonId) => {
    const response = await apiV1.delete(`/classes/${classId}/lessons/${lessonId}`);
    return response.data;
  },

  // Materials Management
  getClassMaterials: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/materials`);
    return response.data;
  },

  uploadMaterial: async (classId, formData) => {
    const response = await apiV1.post(`/classes/${classId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Exercises Management
  getClassExercises: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/exercises`);
    return response.data;
  },

  createExercise: async (classId, exerciseData) => {
    const response = await apiV1.post(`/classes/${classId}/exercises`, exerciseData);
    return response.data;
  },

  // Grading & Feedback
  getClassSubmissions: async (classId, params = {}) => {
    const response = await apiV1.get(`/teacher/classes/${classId}/submissions`, { params });
    return response.data;
  },

  saveAIGrading: async (submissionId, gradingData) => {
    const response = await apiV1.post(`/teacher/submissions/${submissionId}/ai-grade`, gradingData);
    return response.data;
  },

  updateFeedback: async (submissionId, feedbackData) => {
    const response = await apiV1.put(`/teacher/submissions/${submissionId}/feedback`, feedbackData);
    return response.data;
  },

  // Analytics
  getStudentAnalytics: async (classId) => {
    const response = await apiV1.get(`/teacher/classes/${classId}/analytics/students`);
    return response.data;
  },

  getStudentsNeedSupport: async (classId, threshold = 60) => {
    const response = await apiV1.get(`/teacher/classes/${classId}/analytics/students-need-support`, {
      params: { threshold }
    });
    return response.data;
  },

  getClassOverview: async (classId) => {
    const response = await apiV1.get(`/teacher/classes/${classId}/analytics/overview`);
    return response.data;
  },

  // Worksheet Generator
  generateWorksheet: async (classId, worksheetData) => {
    const response = await apiV1.post(`/teacher/classes/${classId}/generate-worksheet`, worksheetData);
    return response.data;
  },

  // Export Reports
  exportProgressReport: async (classId, format = 'json') => {
    const response = await apiV1.get(`/teacher/classes/${classId}/export/progress-report`, {
      params: { format }
    });
    return response.data;
  }
};

export default teacherService;

