import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tams_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tams_token');
      localStorage.removeItem('tams_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (error.message === 'Network Error') return 'Unable to connect to server. Please ensure the backend is running.';
  return error.message || 'An unexpected error occurred';
};

export const getBlobErrorMessage = async (error) => {
  const data = error.response?.data;
  if (data instanceof Blob && data.type?.includes('json')) {
    try {
      const json = JSON.parse(await data.text());
      if (typeof json.detail === 'string') return json.detail;
    } catch {
      /* fall through */
    }
  }
  return getErrorMessage(error);
};

export const downloadBlob = (response, fallbackName = 'report.csv') => {
  const disposition = response.headers['content-disposition'];
  let filename = fallbackName;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) [, filename] = match;
  }
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
