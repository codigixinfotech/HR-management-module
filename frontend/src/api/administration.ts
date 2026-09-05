import { apiClient } from '@/lib/api-client';
import type { AppUser, LoginAccessConfig, PaginatedResult, Permission, Role, RoleDataScope, RoleType } from './types';

export const usersApi = {
  list: async (params: { page?: number; pageSize?: number; search?: string; companyId?: string }) =>
    (await apiClient.get<PaginatedResult<AppUser>>('/users', { params })).data,
  create: async (payload: {
    email: string;
    password: string;
    companyId?: string;
    roleIds?: string[];
    mustResetPassword?: boolean;
    employeeName?: string;
    phone?: string;
    departmentId?: string;
  }) => (await apiClient.post<AppUser>('/users', payload)).data,
  update: async (id: string, payload: { isActive?: boolean; roleIds?: string[] }) =>
    (await apiClient.patch<AppUser>(`/users/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/users/${id}`)).data,
};

export interface CreateRolePayload {
  name: string;
  type?: RoleType;
  description?: string;
  companyId?: string;
  dataScope?: RoleDataScope;
  loginAccess?: LoginAccessConfig;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  type?: RoleType;
  description?: string;
  dataScope?: RoleDataScope;
  loginAccess?: LoginAccessConfig;
  permissionIds?: string[];
}

export const rolesApi = {
  list: async (params?: { companyId?: string }) => {
    const cleanParams = typeof params?.companyId === 'string' ? { companyId: params.companyId } : undefined;
    return (await apiClient.get<Role[]>('/roles', { params: cleanParams })).data;
  },
  permissionsCatalog: async () =>
    (await apiClient.get<Permission[]>('/roles/permissions/catalog')).data,
  create: async (payload: CreateRolePayload) =>
    (await apiClient.post<Role>('/roles', payload)).data,
  duplicate: async (id: string) =>
    (await apiClient.post<Role>(`/roles/${id}/duplicate`)).data,
  assignUsers: async (id: string, userIds: string[]) =>
    (await apiClient.post<Role>(`/roles/${id}/assign-users`, { userIds })).data,
  update: async (id: string, payload: UpdateRolePayload) =>
    (await apiClient.patch<Role>(`/roles/${id}`, payload)).data,
  remove: async (id: string) =>
    (await apiClient.delete(`/roles/${id}`)).data,
};
