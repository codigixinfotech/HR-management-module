import { apiClient } from '@/lib/api-client';
import type { AppUser, PaginatedResult, Permission, Role } from './types';

export const usersApi = {
  list: async (params: { page?: number; pageSize?: number; search?: string }) =>
    (await apiClient.get<PaginatedResult<AppUser>>('/users', { params })).data,
  create: async (payload: { email: string; password: string; companyId?: string; roleIds?: string[] }) =>
    (await apiClient.post<AppUser>('/users', payload)).data,
  update: async (id: string, payload: { isActive?: boolean; roleIds?: string[] }) =>
    (await apiClient.patch<AppUser>(`/users/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/users/${id}`)).data,
};

export const rolesApi = {
  list: async () => (await apiClient.get<Role[]>('/roles')).data,
  permissionsCatalog: async () => (await apiClient.get<Permission[]>('/roles/permissions/catalog')).data,
  create: async (payload: { name: string; description?: string; companyId?: string; permissionIds?: string[] }) =>
    (await apiClient.post<Role>('/roles', payload)).data,
  update: async (id: string, payload: { name?: string; description?: string; permissionIds?: string[] }) =>
    (await apiClient.patch<Role>(`/roles/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/roles/${id}`)).data,
};
