import api, { downloadBlob, getBlobErrorMessage } from './api';

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const teacherAPI = {
  getProfile: () => api.get('/teacher/profile'),
};

export const sectionsAPI = {
  list: (params) => api.get('/sections', { params }),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
  delete: (id) => api.delete(`/sections/${id}`),
};

export const subjectsAPI = {
  list: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const assignmentsAPI = {
  list: () => api.get('/assignments'),
  create: (data) => api.post('/assignments', data),
};

export const studentsAPI = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getFilters: () => api.get('/students/filters/options'),
};

export const marksAPI = {
  getConfig: () => api.get('/marks/config'),
  getSheet: (params) => api.get('/marks/sheet', { params }),
  bulkSave: (data) => api.post('/marks/bulk', data),
  update: (id, data) => api.put(`/marks/${id}`, data),
  delete: (id) => api.delete(`/marks/${id}`),
};

export const attendanceAPI = {
  getConfig: () => api.get('/attendance/config'),
  getSheet: (params) => api.get('/attendance/sheet', { params }),
  bulkSave: (data) => api.post('/attendance/bulk', data),
  getSummary: (params) => api.get('/attendance/summary', { params }),
};

export const analyticsAPI = {
  getFilters: () => api.get('/analytics/filters/options'),
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getAtRisk: (params) => api.get('/analytics/at-risk', { params }),
  getStudentAnalytics: (id, params) => api.get(`/analytics/student/${id}`, { params }),
};

export const reportsAPI = {
  preview: (params) => api.get('/reports/preview', { params }),
  export: async (reportType, params) => {
    try {
      const response = await api.get(`/reports/${reportType}/export`, { params, responseType: 'blob' });
      downloadBlob(response, `${reportType}_report.${params.format || 'csv'}`);
      return response;
    } catch (error) {
      throw new Error(await getBlobErrorMessage(error));
    }
  },
};
