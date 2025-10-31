import { apiV1 } from './api';

export const parentAPI = {
  // Get all children linked to the current parent
  getChildren: async () => {
    const res = await apiV1.get('/parent/children');
    return res.data;
  },

  // Get progress details for a specific child
  getChildProgress: async (childId) => {
    const res = await apiV1.get(`/parent/children/${childId}/progress`);
    return res.data;
  },

  // Get teachers related to a specific child (classes taught)
  getTeachersForChild: async (childId) => {
    const res = await apiV1.get(`/parent/children/${childId}/teachers`);
    return res.data;
  },

  // Parent sends request to link with student
  linkStudent: async (studentEmail) => {
    const res = await apiV1.post('/parent/link-student', {
      student_email: studentEmail
    });
    return res.data;
  }
};
