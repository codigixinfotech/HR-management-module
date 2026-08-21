import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/stores/auth-store';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  mustResetPassword?: boolean;
}

export interface DemoAccountInfo {
  roleName: string;
  displayName: string;
  email: string;
  description: string;
  icon: string;
  badgeColor: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  department?: string;
  role?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/register', payload);
  return data;
}

export async function fetchMe(token?: string): Promise<AuthUser> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await apiClient.get<AuthUser>('/auth/me', { headers });
  return data;
}

export async function fetchDemoAccounts(): Promise<DemoAccountInfo[]> {
  const { data } = await apiClient.get<DemoAccountInfo[]>('/auth/demo-accounts');
  return data;
}

export async function logout(refreshToken: string) {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post('/auth/change-password', { newPassword });
  return data;
}
