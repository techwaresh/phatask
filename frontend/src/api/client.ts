// src/api/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bwms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expired
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('bwms_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('bwms_access_token', accessToken);
          localStorage.setItem('bwms_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('bwms_access_token');
          localStorage.removeItem('bwms_refresh_token');
          localStorage.removeItem('bwms_user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('bwms_access_token');
        localStorage.removeItem('bwms_refresh_token');
        localStorage.removeItem('bwms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
