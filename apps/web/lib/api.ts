import axios from 'axios';
import {
  clearStoredSession,
  getStoredAccessToken,
  setSessionNotice,
} from '@/lib/auth-storage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url = typeof err.config?.url === 'string' ? err.config.url : '';
      const isPublicAuthRequest =
        url.includes('/auth/login') || url.includes('/auth/refresh');

      if (!isPublicAuthRequest && getStoredAccessToken()) {
        setSessionNotice('expired');
        clearStoredSession();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
