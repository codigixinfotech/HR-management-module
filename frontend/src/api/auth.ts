import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/stores/auth-store';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function fetchMe(token?: string): Promise<AuthUser> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await apiClient.get<AuthUser>('/auth/me', { headers });
  return data;
}

export async function logout(refreshToken: string) {
  await apiClient.post('/auth/logout', { refreshToken });
}
