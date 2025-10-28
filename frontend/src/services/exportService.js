// services/exportService.js
import { apiV1 } from './api';

const exportService = {
  /**
   * Export grades for a single exercise
   * @param {number} exerciseId - ID of the exercise
   * @param {string} format - Export format ('xlsx' or 'csv')
   * @returns {Promise<Blob>} File blob
   */
  exportExerciseGrades: async (exerciseId, format = 'xlsx') => {
    const response = await apiV1.get(`/exports/exercise/${exerciseId}/grades`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Export grades for entire class
   * @param {number} classId - ID of the class
   * @param {string} format - Export format ('xlsx' or 'csv')
   * @param {Object} options - Optional filters (from_date, to_date)
   * @returns {Promise<Blob>} File blob
   */
  exportClassGrades: async (classId, format = 'xlsx', options = {}) => {
    const response = await apiV1.get(`/exports/class/${classId}/grades`, {
      params: { format, ...options },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Export student list for a class
   * @param {number} classId - ID of the class
   * @param {string} format - Export format ('xlsx' or 'csv')
   * @returns {Promise<Blob>} File blob
   */
  exportStudentList: async (classId, format = 'xlsx') => {
    const response = await apiV1.get(`/exports/class/${classId}/students`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Helper function to download blob as file
   * @param {Blob} blob - File blob
   * @param {string} filename - Suggested filename
   */
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export exercise grades and trigger download
   * @param {number} exerciseId
   * @param {string} exerciseTitle
   * @param {string} format
   */
  downloadExerciseGrades: async (exerciseId, exerciseTitle, format = 'xlsx') => {
    try {
      const blob = await exportService.exportExerciseGrades(exerciseId, format);
      const extension = format === 'xlsx' ? 'xlsx' : 'csv';
      const filename = `diem_${exerciseTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      exportService.downloadFile(blob, filename);
      return true;
    } catch (error) {
      console.error('Error downloading exercise grades:', error);
      throw error;
    }
  },

  /**
   * Export class grades and trigger download
   * @param {number} classId
   * @param {string} className
   * @param {string} format
   * @param {Object} options
   */
  downloadClassGrades: async (classId, className, format = 'xlsx', options = {}) => {
    try {
      const blob = await exportService.exportClassGrades(classId, format, options);
      const extension = format === 'xlsx' ? 'xlsx' : 'csv';
      const filename = `bangdiem_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      exportService.downloadFile(blob, filename);
      return true;
    } catch (error) {
      console.error('Error downloading class grades:', error);
      throw error;
    }
  },

  /**
   * Export student list and trigger download
   * @param {number} classId
   * @param {string} className
   * @param {string} format
   */
  downloadStudentList: async (classId, className, format = 'xlsx') => {
    try {
      const blob = await exportService.exportStudentList(classId, format);
      const extension = format === 'xlsx' ? 'xlsx' : 'csv';
      const filename = `danhsach_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      exportService.downloadFile(blob, filename);
      return true;
    } catch (error) {
      console.error('Error downloading student list:', error);
      throw error;
    }
  }
};

export default exportService;
