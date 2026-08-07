import axios from 'axios';
import i18n from '../i18n';
import { useUserStore } from '../store/useUserStore';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api/v1') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/api/v1`)
  : '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auto attach auth token, X-User-Id, and Accept-Language headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      config.headers['X-User-Id'] = currentUserId;
    }

    config.headers['Accept-Language'] = i18n.language || 'vi';

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centrally handle error status codes (400, 401, 403, 404, 500)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status || 500;
    const responseData = error.response?.data;

    const customError = {
      status,
      message: responseData?.message || getGenericErrorMessage(status),
      details: responseData?.details || null,
      rawError: error,
    };

    if (status === 401) {
      const pathname = window.location.pathname;
      if (!pathname.includes('/login') && !pathname.includes('/register')) {
        console.warn('Unauthorized - Token expired or missing. Redirecting to login...');
        useUserStore.getState().clearAuth();
        window.location.href = '/login';
      }
    } else if (status === 403) {
      console.warn('Forbidden - Access denied');
    }

    return Promise.reject(customError);
  }
);

function getGenericErrorMessage(status) {
  switch (status) {
    case 400:
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    case 401:
      return 'Chưa xác thực hoặc phiên làm việc đã hết hạn.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Không tìm thấy dữ liệu yêu cầu.';
    case 500:
    default:
      return 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.';
  }
}

export default api;
