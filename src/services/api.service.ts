import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { updateToken, logout } from '../store/slices/authSlice';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken || localStorage.getItem('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 Unauthorized
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints (login, refresh-token itself)
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    const refreshToken = store.getState().auth.refreshToken || localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post('/api/v1/auth/refresh-token', { refreshToken }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
      store.dispatch(updateToken({ accessToken: newAccessToken, refreshToken: newRefreshToken }));

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr as AxiosError, null);
      store.dispatch(logout());
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
