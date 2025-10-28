import { apiV1 } from './api';

export const studentService = {
  // My Classes
  getMyClasses: async () => {
    const response = await apiV1.get('/classes/my-classes');
    return response.data;
  },

  getClassDetails: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}`);
    return response.data;
  },

  getClassLessons: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/lessons`);
    return response.data;
  },

  getClassExercises: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/exercises`);
    return response.data;
  },

  getClassMaterials: async (classId) => {
    const response = await apiV1.get(`/classes/${classId}/materials`);
    return response.data;
  },

  joinClass: async (classId) => {
    const response = await apiV1.post(`/classes/${classId}/join`);
    return response.data;
  },

  leaveClass: async (classId) => {
    const response = await apiV1.post(`/classes/${classId}/leave`);
    return response.data;
  },

  // Exercises & Submissions
  getExercises: async (params = {}) => {
    const response = await apiV1.get('/exercises/', { params });
    return response.data;
  },

  getExerciseDetail: async (exerciseId) => {
    const response = await apiV1.get(`/exercises/${exerciseId}`);
    return response.data;
  },

  submitExercise: async (exerciseId, submissionData) => {
    const response = await apiV1.post(`/exercises/${exerciseId}/submit`, submissionData);
    return response.data;
  },

  getMySubmission: async (exerciseId) => {
    const response = await apiV1.get(`/exercises/${exerciseId}/my-submission`);
    return response.data;
  },

  getMySubmissions: async (params = {}) => {
    const response = await apiV1.get('/exercises/my-submissions', { params });
    return response.data;
  },

  deleteSubmission: async (exerciseId) => {
    const response = await apiV1.delete(`/exercises/${exerciseId}/submission`);
    return response.data;
  },

  // Statistics
  getExerciseStatistics: async () => {
    const response = await apiV1.get('/exercises/statistics/summary');
    return response.data;
  }
};

export default studentService;

