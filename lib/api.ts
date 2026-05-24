import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────
export const register = (email: string, password: string) =>
  api.post('/auth/register', { email, password });

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getMe = () =>
  api.get('/auth/me');

// ── API Keys ──────────────────────────────────────
export const getKeys = () =>
  api.get('/keys/list');

export const addKey = (data: { name: string; provider: string; key_value: string }) =>
  api.post('/keys/add', data);

export const deleteKey = (id: string) =>
  api.delete(`/keys/delete/${id}`);

// ── Alerts ────────────────────────────────────────
export const getAlerts = () =>
  api.get('/alerts/list');

export const createAlert = (data: { alert_type: string; threshold: number }) =>
  api.post('/alerts/create', data);

export const deleteAlert = (id: string) =>
  api.delete(`/alerts/delete/${id}`);

// ── Usage ─────────────────────────────────────────
export const getUsageSummary = () =>
  api.get('/usage/stats');

export const getUsageDaily = () =>
  api.get('/usage/history');

export default api;
