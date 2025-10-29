/**
 * Student Progress Service
 * API calls for student progress tracking and reports
 */
import { apiV1 } from './api';

const studentProgressService = {
  /**
   * Create a progress snapshot for a student
   * @param {number} studentId - Student ID
   * @param {number} classId - Optional class ID
   * @param {string} periodType - Period type (week, month, semester)
   * @param {string} periodLabel - Optional period label
   */
  createSnapshot: async (studentId, classId = null, periodType = 'week', periodLabel = null) => {
    const response = await apiV1.post('/student-progress/snapshots', {
      student_id: studentId,
      class_id: classId,
      period_type: periodType,
      period_label: periodLabel
    });
    return response.data;
  },

  /**
   * Get progress snapshots for a student
   * @param {number} studentId - Student ID
   * @param {Object} options - Optional filters (class_id, period_type, limit)
   */
  getSnapshots: async (studentId, options = {}) => {
    const response = await apiV1.get(`/student-progress/snapshots/student/${studentId}`, {
      params: options
    });
    return response.data;
  },

  /**
   * Get skill progress timeline for a student
   * @param {number} studentId - Student ID
   * @param {string} skillType - Skill type (reading, writing, listening, speaking)
   * @param {number} limit - Number of records to fetch
   */
  getSkillTimeline: async (studentId, skillType, limit = 20) => {
    const response = await apiV1.get(`/student-progress/skills/student/${studentId}/${skillType}`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get comprehensive student summary
   * @param {number} studentId - Student ID
   * @param {number} classId - Optional class ID
   */
  getStudentSummary: async (studentId, classId = null) => {
    const params = classId ? { class_id: classId } : {};
    const response = await apiV1.get(`/student-progress/summary/student/${studentId}`, {
      params
    });
    return response.data;
  },

  /**
   * Get all snapshots for a class
   * @param {number} classId - Class ID
   * @param {Object} options - Optional filters (period_type, limit)
   */
  getClassSnapshots: async (classId, options = {}) => {
    const response = await apiV1.get(`/student-progress/class/${classId}/snapshots`, {
      params: options
    });
    return response.data;
  },

  /**
   * Export student progress report as PDF
   * @param {number} studentId - Student ID
   * @param {number} classId - Optional class ID
   * @returns {Promise<Blob>} PDF file blob
   */
  exportPDF: async (studentId, classId = null) => {
    const params = classId ? { class_id: classId } : {};
    const response = await apiV1.get(`/student-progress/export/pdf/student/${studentId}`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Download student progress report as PDF
   * @param {number} studentId - Student ID
   * @param {string} studentName - Student name for filename
   * @param {number} classId - Optional class ID
   */
  downloadPDF: async (studentId, studentName, classId = null) => {
    try {
      const blob = await studentProgressService.exportPDF(studentId, classId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao_cao_${studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  /**
   * Export student progress report as Excel
   * @param {number} studentId - Student ID
   * @param {number} classId - Optional class ID
   * @returns {Promise<Blob>} Excel file blob
   */
  exportExcel: async (studentId, classId = null) => {
    const params = classId ? { class_id: classId } : {};
    const response = await apiV1.get(`/student-progress/export/excel/student/${studentId}`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Download student progress report as Excel
   * @param {number} studentId - Student ID
   * @param {string} studentName - Student name for filename
   * @param {number} classId - Optional class ID
   */
  downloadExcel: async (studentId, studentName, classId = null) => {
    try {
      const blob = await studentProgressService.exportExcel(studentId, classId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao_cao_${studentName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading Excel:', error);
      throw error;
    }
  }
};

export default studentProgressService;

