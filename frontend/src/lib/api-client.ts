import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    return `http://${hostname}:3001/api`;
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  let token = useAuthStore.getState().accessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        const localToken = parsed?.state?.accessToken;
        if (localToken && localToken !== token) {
          useAuthStore.getState().setTokens(localToken, parsed?.state?.refreshToken || '');
          if (parsed?.state?.user) {
            useAuthStore.getState().setUser(parsed.state.user);
          }
          token = localToken;
        }
      }
    } catch {}
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      clear();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as any;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                           originalRequest?.url?.includes('/auth/refresh') ||
                           originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      // Check if localStorage has an updated token (e.g. from a recent login in another tab)
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            const localToken = parsed?.state?.accessToken;
            const currentToken = useAuthStore.getState().accessToken;
            if (localToken && localToken !== currentToken) {
              useAuthStore.getState().setTokens(localToken, parsed?.state?.refreshToken || '');
              if (parsed?.state?.user) {
                useAuthStore.getState().setUser(parsed.state.user);
              }
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${localToken}`;
              return apiClient(originalRequest);
            }
          }
        } catch {}
      }

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);
