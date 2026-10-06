import { apiClient } from '@/lib/api-client';

export const api = {
  get: <T = any>(url: string, config?: any): Promise<T> =>
    apiClient.get<T>(url, config).then((res) => res.data),
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    apiClient.post<T>(url, data, config).then((res) => res.data),
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    apiClient.put<T>(url, data, config).then((res) => res.data),
  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),
  delete: <T = any>(url: string, config?: any): Promise<T> =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

export default api;
