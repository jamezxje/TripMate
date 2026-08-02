import { create } from 'zustand';
import api from '../services/api';

const getInitialUser = () => {
  try {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    return null;
  }
};

const initialToken = localStorage.getItem('token') || null;
const initialUser = getInitialUser();

export const useUserStore = create((set, get) => ({
  currentUser: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,

  setAuth: (token, user) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.id) {
        localStorage.setItem('userId', String(user.id));
      }
    }
    set({ token, currentUser: user, isAuthenticated: !!token });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    set({ currentUser: null, token: null, isAuthenticated: false });
  },

  logout: () => {
    get().clearAuth();
  },

  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.id) {
        localStorage.setItem('userId', String(user.id));
      }
    }
    set({ currentUser: user });
  },

  fetchCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response && response.data) {
        const user = response.data;
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.id) {
          localStorage.setItem('userId', String(user.id));
        }
        set({ currentUser: user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Lỗi nạp thông tin người dùng:', error);
      get().clearAuth();
    }
  },

  updateUserRole: (role) =>
    set((state) => {
      const updatedUser = state.currentUser ? { ...state.currentUser, role } : null;
      if (updatedUser) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return { currentUser: updatedUser };
    }),
}));
