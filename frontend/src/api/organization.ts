import { apiClient } from '@/lib/api-client';
import type { Branch, Company, Department, Designation, Location } from './types';

export const companiesApi = {
  list: async () => (await apiClient.get<Company[]>('/organization/companies')).data,
  create: async (payload: Partial<Company>) => (await apiClient.post<Company>('/organization/companies', payload)).data,
  update: async (id: string, payload: Partial<Company>) =>
    (await apiClient.patch<Company>(`/organization/companies/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/companies/${id}`)).data,
};

export interface BranchAdminAccess {
  success: boolean;
  role: string;
  adminEmail: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  accessScope: string;
  loginUrl: string;
  invitationUrl: string;
  invitationStatus: 'ACTIVATED' | 'DISPATCHED';
}

export const branchesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<Branch[]>('/organization/branches', { params: { companyId } })).data,
  create: async (payload: Partial<Branch>) => (await apiClient.post<Branch>('/organization/branches', payload)).data,
  update: async (id: string, payload: Partial<Branch>) =>
    (await apiClient.patch<Branch>(`/organization/branches/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/branches/${id}`)).data,
  getAdminAccess: async (branchId: string) =>
    (await apiClient.get<BranchAdminAccess>(`/organization/branches/${branchId}/admin-access`)).data,
  updateAdminEmail: async (branchId: string, email: string) =>
    (await apiClient.patch<{ success: boolean; message: string; invitationUrl: string; adminEmail: string }>(
      `/organization/branches/${branchId}/admin-email`,
      { email },
    )).data,
  resendInvitation: async (branchId: string, email?: string) =>
    (await apiClient.post<{ success: boolean; message: string; invitationUrl: string; adminEmail: string }>(
      `/organization/branches/${branchId}/resend-invitation`,
      { email },
    )).data,
};

export const locationsApi = {
  list: async (branchId: string) => (await apiClient.get<Location[]>(`/organization/branches/${branchId}/locations`)).data,
  create: async (branchId: string, payload: Partial<Location>) =>
    (await apiClient.post<Location>(`/organization/branches/${branchId}/locations`, payload)).data,
  update: async (id: string, payload: Partial<Location>) =>
    (await apiClient.patch<Location>(`/organization/branches/locations/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/branches/locations/${id}`)).data,
};

export const departmentsApi = {
  list: async (companyId?: string, branchId?: string) =>
    (await apiClient.get<Department[]>('/organization/departments', { params: { companyId, branchId } })).data,
  create: async (payload: Partial<Department>) =>
    (await apiClient.post<Department>('/organization/departments', payload)).data,
  update: async (id: string, payload: Partial<Department>) =>
    (await apiClient.patch<Department>(`/organization/departments/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/departments/${id}`)).data,
};

export const designationsApi = {
  list: async (companyId?: string, departmentId?: string, branchId?: string) =>
    (await apiClient.get<Designation[]>('/organization/designations', { params: { companyId, departmentId, branchId } })).data,
  create: async (payload: Partial<Designation>) =>
    (await apiClient.post<Designation>('/organization/designations', payload)).data,
  update: async (id: string, payload: Partial<Designation>) =>
    (await apiClient.patch<Designation>(`/organization/designations/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/designations/${id}`)).data,
};
