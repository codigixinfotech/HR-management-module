import { apiClient } from '@/lib/api-client';
import type { ComplianceStatus, ComplianceTask, ComplianceType, PaginatedResult } from './types';

export const complianceTypesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<ComplianceType[]>('/compliance/types', { params: { companyId } })).data,
  create: async (payload: Partial<ComplianceType>) =>
    (await apiClient.post<ComplianceType>('/compliance/types', payload)).data,
  update: async (id: string, payload: Partial<ComplianceType>) =>
    (await apiClient.patch<ComplianceType>(`/compliance/types/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/compliance/types/${id}`)).data,
};

export const complianceTasksApi = {
  list: async (params: { page?: number; pageSize?: number; companyId?: string; status?: ComplianceStatus }) =>
    (await apiClient.get<PaginatedResult<ComplianceTask>>('/compliance/tasks', { params })).data,
  create: async (payload: { companyId: string; complianceTypeId: string; periodLabel: string; dueDate: string }) =>
    (await apiClient.post<ComplianceTask>('/compliance/tasks', payload)).data,
  updateStatus: async (
    id: string,
    payload: { status: ComplianceStatus; filedDate?: string; filedById?: string; remarks?: string },
  ) => (await apiClient.patch<ComplianceTask>(`/compliance/tasks/${id}/status`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/compliance/tasks/${id}`)).data,
};
