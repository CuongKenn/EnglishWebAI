import { apiV1 } from './api';

// Get all classes for teacher
export const getClasses = async () => {
  try {
    const response = await apiV1.get('/classes/teaching');
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
};

// Get students in a class
export const getClassStudents = async (classId) => {
  try {
    const response = await apiV1.get(`/classes/${classId}/students`);
    return response.data;
  } catch (error) {
    console.error('Error fetching class students:', error);
    return [];
  }
};

// Create new class
export const createClass = async (classData) => {
  try {
    const response = await apiV1.post('/classes/', classData);
    return response.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

// Update class
export const updateClass = async (classId, classData) => {
  try {
    const response = await apiV1.put(`/classes/${classId}`, classData);
    return response.data;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Delete class
export const deleteClass = async (classId) => {
  try {
    await apiV1.delete(`/classes/${classId}`);
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

export default {
  getClasses,
  getClassStudents,
  createClass,
  updateClass,
  deleteClass
};

