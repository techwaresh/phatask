// src/stores/authStore.ts
import { create } from 'zustand';
import { User } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('bwms_user') || 'null'),
  token: localStorage.getItem('bwms_access_token'),
  isAuthenticated: !!localStorage.getItem('bwms_access_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('bwms_access_token', accessToken);
      localStorage.setItem('bwms_refresh_token', refreshToken);
      localStorage.setItem('bwms_user', JSON.stringify(user));

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiClient.post('/auth/logout').catch(() => {});
    localStorage.removeItem('bwms_access_token');
    localStorage.removeItem('bwms_refresh_token');
    localStorage.removeItem('bwms_user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  setUser: (user: User) => {
    localStorage.setItem('bwms_user', JSON.stringify(user));
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('bwms_access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data.data;
      localStorage.setItem('bwms_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      get().logout();
    }
  },
}));
