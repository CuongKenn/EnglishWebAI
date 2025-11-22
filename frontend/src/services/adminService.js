import { apiV1 } from './api';

// -------- Users --------
export const adminListUsers = async ({ search, role, status, skip = 0, limit = 100 } = {}) => {
  const res = await apiV1.get('/admin/users', { params: { search, role, status, skip, limit } });
  return res.data;
};

export const adminCreateUser = async (payload) => {
  const res = await apiV1.post('/admin/users', payload);
  return res.data;
};

export const adminUpdateUser = async (userId, payload) => {
  const res = await apiV1.put(`/admin/users/${userId}`, payload);
  return res.data;
};

export const adminDeleteUser = async (userId) => {
  const res = await apiV1.delete(`/admin/users/${userId}`);
  return res.data;
};

export const adminListTeachers = async () => {
  const res = await apiV1.get('/admin/teachers');
  return res.data;
};

// -------- Classes --------
export const adminListClasses = async ({ search } = {}) => {
  const res = await apiV1.get('/admin/classes', { params: { search } });
  return res.data;
};

export const adminCreateClass = async (payload) => {
  const res = await apiV1.post('/admin/classes', payload);
  return res.data;
};

export const adminUpdateClass = async (classId, payload) => {
  const res = await apiV1.put(`/admin/classes/${classId}`, payload);
  return res.data;
};

export const adminDeleteClass = async (classId) => {
  const res = await apiV1.delete(`/admin/classes/${classId}`);
  return res.data;
};

// -------- Class Students --------
export const adminListClassStudents = async (classId) => {
  const res = await apiV1.get(`/admin/classes/${classId}/students`);
  return res.data;
};

export const adminAddStudentsToClass = async (classId, { identifiers, idType = 'username', role = 'student', status = 'active' }) => {
  const res = await apiV1.post(`/admin/classes/${classId}/students`, { identifiers, idType, role, status });
  return res.data;
};

export const adminRemoveStudentFromClass = async (classId, userId) => {
  const res = await apiV1.delete(`/admin/classes/${classId}/students/${userId}`);
  return res.data;
};

// -------- Import Excel --------
export const adminImportClassesExcel = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await apiV1.post('/admin/classes/import-excel', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// -------- Stats --------
export const adminOverviewStats = async () => {
  const res = await apiV1.get('/admin/stats/overview');
  return res.data;
};

// -------- AI Analytics --------
export const adminGetAIAnalytics = async (range = '30d') => {
  const res = await apiV1.get('/admin/ai/analytics', { params: { range } });
  return res.data;
};
