import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Get all classes for teacher
export const getClasses = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/classes/teacher/classes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
};

// Get students in a class
export const getClassStudents = async (classId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/classes/${classId}/students`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching class students:', error);
    return [];
  }
};

// Create new class
export const createClass = async (classData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/classes/`, classData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

// Update class
export const updateClass = async (classId, classData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/classes/${classId}`, classData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Delete class
export const deleteClass = async (classId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/api/classes/${classId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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

