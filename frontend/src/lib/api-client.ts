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

export function isPublicRoute(pathname?: string): boolean {
  if (!pathname) return true;
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/login') return true;
  if (cleanPath === '/landing' || cleanPath.startsWith('/landing/')) return true;
  if (cleanPath.startsWith('/careers')) return true;
  if (cleanPath.startsWith('/candidate-assessment')) return true;
  if (cleanPath.startsWith('/auth')) return true;
  if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/api/uploads')) return true;
  return false;
}

function redirectToLoginIfProtected() {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (isPublicRoute(currentPath)) {
    // Under NO circumstances redirect unauthenticated users on public landing/career pages to /login
    return;
  }
  if (currentPath !== '/login') {
    window.location.href = '/login';
  }
}

function getStoredAuthState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ehcm-auth') || localStorage.getItem('auth-storage');
    if (!raw) return null;
    return JSON.parse(raw)?.state || null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  let token = useAuthStore.getState().accessToken;
  const storedState = getStoredAuthState();
  if (storedState?.accessToken && storedState.accessToken !== token) {
    useAuthStore.getState().setTokens(storedState.accessToken, storedState.refreshToken || '');
    if (storedState.user) {
      useAuthStore.getState().setUser(storedState.user);
    }
    token = storedState.accessToken;
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
    redirectToLoginIfProtected();
    return null;
  }

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      clear();
      redirectToLoginIfProtected();
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
      const storedState = getStoredAuthState();
      const currentToken = useAuthStore.getState().accessToken;
      if (storedState?.accessToken && storedState.accessToken !== currentToken) {
        useAuthStore.getState().setTokens(storedState.accessToken, storedState.refreshToken || '');
        if (storedState.user) {
          useAuthStore.getState().setUser(storedState.user);
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${storedState.accessToken}`;
        return apiClient(originalRequest);
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
        redirectToLoginIfProtected();
      }
    }

    return Promise.reject(error);
  },
);
