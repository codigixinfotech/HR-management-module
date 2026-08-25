import { apiClient } from '@/lib/api-client';
import type { Branch, Company, Department, Designation, Location } from './types';

export const companiesApi = {
  list: async () => (await apiClient.get<Company[]>('/organization/companies')).data,
  create: async (payload: Partial<Company>) => (await apiClient.post<Company>('/organization/companies', payload)).data,
  update: async (id: string, payload: Partial<Company>) =>
    (await apiClient.patch<Company>(`/organization/companies/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/companies/${id}`)).data,
};

export const branchesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<Branch[]>('/organization/branches', { params: { companyId } })).data,
  create: async (payload: Partial<Branch>) => (await apiClient.post<Branch>('/organization/branches', payload)).data,
  update: async (id: string, payload: Partial<Branch>) =>
    (await apiClient.patch<Branch>(`/organization/branches/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/branches/${id}`)).data,
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
  list: async (companyId?: string) =>
    (await apiClient.get<Department[]>('/organization/departments', { params: { companyId } })).data,
  create: async (payload: Partial<Department>) =>
    (await apiClient.post<Department>('/organization/departments', payload)).data,
  update: async (id: string, payload: Partial<Department>) =>
    (await apiClient.patch<Department>(`/organization/departments/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/departments/${id}`)).data,
};

export const designationsApi = {
  list: async (companyId?: string, departmentId?: string) =>
    (await apiClient.get<Designation[]>('/organization/designations', { params: { companyId, departmentId } })).data,
  create: async (payload: Partial<Designation>) =>
    (await apiClient.post<Designation>('/organization/designations', payload)).data,
  update: async (id: string, payload: Partial<Designation>) =>
    (await apiClient.patch<Designation>(`/organization/designations/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/organization/designations/${id}`)).data,
};
