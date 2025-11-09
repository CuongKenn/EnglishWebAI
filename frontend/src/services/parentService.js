import { apiV1 } from './api';

export const parentAPI = {
  // Get all children linked to the current parent
  getChildren: async () => {
    const res = await apiV1.get('/parent/children');
    return res.data;
  },

  // Get progress details for a specific child with optional filters
  getChildProgress: async (childId, filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.subject && filters.subject !== 'all') {
      params.append('subject', filters.subject);
    }
    if (filters.timeRange && filters.timeRange !== 'all') {
      params.append('time_range', filters.timeRange);
    }
    if (filters.evaluationType && filters.evaluationType !== 'all') {
      params.append('evaluation_type', filters.evaluationType);
    }
    
    const queryString = params.toString();
    const url = `/parent/children/${childId}/progress${queryString ? '?' + queryString : ''}`;
    
    const res = await apiV1.get(url);
    return res.data;
  },

  // Export progress to PDF
  exportProgressPDF: async (childId, exportOptions, filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.subject && filters.subject !== 'all') {
        params.append('subject', filters.subject);
      }
      if (filters.timeRange && filters.timeRange !== 'all') {
        params.append('time_range', filters.timeRange);
      }
      if (filters.evaluationType && filters.evaluationType !== 'all') {
        params.append('evaluation_type', filters.evaluationType);
      }
      
      const queryString = params.toString();
      const url = `/parent/children/${childId}/export/pdf${queryString ? '?' + queryString : ''}`;
      
      const res = await apiV1.post(url, exportOptions, {
        responseType: 'blob',
        timeout: 60000
      });
      
      return res.data;
    } catch (error) {
      console.error('[ParentService] PDF export error:', error);
      throw error;
    }
  },

  // Export progress to Excel
  exportProgressExcel: async (childId, exportOptions, filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.subject && filters.subject !== 'all') {
        params.append('subject', filters.subject);
      }
      if (filters.timeRange && filters.timeRange !== 'all') {
        params.append('time_range', filters.timeRange);
      }
      if (filters.evaluationType && filters.evaluationType !== 'all') {
        params.append('evaluation_type', filters.evaluationType);
      }
      
      const queryString = params.toString();
      const url = `/parent/children/${childId}/export/excel${queryString ? '?' + queryString : ''}`;
      
      const res = await apiV1.post(url, exportOptions, {
        responseType: 'blob',
        timeout: 60000 // 60 seconds timeout
      });
      
      return res.data;
    } catch (error) {
      // Try to parse error message from blob if possible
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          JSON.parse(text);
          // Error already logged by interceptor
        } catch {
          // Parsing failed, error already logged
        }
      }
      
      throw error;
    }
  },

  // Parent sends request to link with student
  linkStudent: async (studentEmail) => {
    const res = await apiV1.post('/parent/link-student', {
      student_email: studentEmail
    });
    return res.data;
  },

  // Get dashboard summary statistics
  getDashboardSummary: async () => {
    const res = await apiV1.get('/parent/dashboard/summary');
    return res.data;
  },

  // Get pending exercises
  getPendingExercises: async () => {
    const res = await apiV1.get('/parent/pending-exercises');
    return res.data;
  },

  // Get monthly report
  getMonthlyReport: async (month, year, timeRange = 'month') => {
    const params = new URLSearchParams();
    params.append('month', month);
    if (year) params.append('year', year);
    params.append('time_range', timeRange);
    
    const res = await apiV1.get(`/parent/monthly-report?${params.toString()}`);
    return res.data;
  },

  // Export monthly report to PDF
  exportMonthlyReportPDF: async (month, year, timeRange, exportOptions) => {
    const requestBody = {
      month: month,
      year: year || new Date().getFullYear(),
      time_range: timeRange,
      ...exportOptions
    };
    
    const res = await apiV1.post('/parent/monthly-report/export/pdf', requestBody, {
      responseType: 'blob',
      timeout: 60000
    });
    return res.data;
  },

  // Export monthly report to Excel
  exportMonthlyReportExcel: async (month, year, timeRange, exportOptions) => {
    const requestBody = {
      month: month,
      year: year || new Date().getFullYear(),
      time_range: timeRange,
      ...exportOptions
    };
    
    const res = await apiV1.post('/parent/monthly-report/export/excel', requestBody, {
      responseType: 'blob',
      timeout: 60000
    });
    return res.data;
  }
};
