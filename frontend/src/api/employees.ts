import { apiClient } from '@/lib/api-client';
import type { ApprovalStatus, Employee, OnboardingTask, PaginatedResult } from './types';

export const employeesApi = {
  list: async (params: { page?: number; pageSize?: number; search?: string; companyId?: string }) =>
    (await apiClient.get<PaginatedResult<Employee>>('/employees', { params })).data,
  get: async (id: string) => (await apiClient.get<Employee>(`/employees/${id}`)).data,
  create: async (payload: Partial<Employee>) => (await apiClient.post<Employee>('/employees', payload)).data,
  update: async (id: string, payload: Partial<Employee>) =>
    (await apiClient.patch<Employee>(`/employees/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/employees/${id}`)).data,

  uploadDocument: async (id: string, file: File, docType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    return (await apiClient.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })).data;
  },
  removeDocument: async (id: string, documentId: string) =>
    (await apiClient.delete(`/employees/${id}/documents/${documentId}`)).data,

  listOnboardingTasks: async (id: string) =>
    (await apiClient.get<OnboardingTask[]>(`/employees/${id}/onboarding-tasks`)).data,
  createOnboardingTask: async (id: string, payload: { title: string; description?: string; ownerType: string; dueDate?: string }) =>
    (await apiClient.post<OnboardingTask>(`/employees/${id}/onboarding-tasks`, payload)).data,
  updateOnboardingTaskStatus: async (taskId: string, status: ApprovalStatus) =>
    (await apiClient.patch(`/employees/onboarding-tasks/${taskId}/status`, { status })).data,
};
