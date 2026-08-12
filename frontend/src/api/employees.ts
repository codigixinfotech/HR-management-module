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

  enrollInCourse: async (id: string, payload: { courseName: string; courseType: string; status?: string; certification?: string }) =>
    (await apiClient.post(`/employees/${id}/courses`, payload)).data,
  addKpi: async (id: string, payload: { kpi: string; category: string; target: string; weightage: number; reviewPeriod: string; performanceRating?: number; managerFeedback?: string }) =>
    (await apiClient.post(`/employees/${id}/kpis`, payload)).data,
  addHrNote: async (id: string, payload: { note: string; noteType: string; createdBy: string }) =>
    (await apiClient.post(`/employees/${id}/hr-notes`, payload)).data,

  listSkills: async () => (await apiClient.get<any[]>('/employees/skills/competencies')).data,
  createSkill: async (payload: { name: string; category: string; certRequired: boolean; benchmarkScore: string }) =>
    (await apiClient.post<any>('/employees/skills/competencies', payload)).data,
  removeSkill: async (id: string) => (await apiClient.delete(`/employees/skills/competencies/${id}`)).data,

  listTransfers: async () => (await apiClient.get<any[]>('/employees/transfers')).data,
  getTransfer: async (id: string) => (await apiClient.get<any>(`/employees/transfers/${id}`)).data,
  createTransfer: async (payload: any) => (await apiClient.post<any>('/employees/transfers', payload)).data,
  updateTransfer: async (id: string, payload: any) => (await apiClient.put<any>(`/employees/transfers/${id}`, payload)).data,
  approveTransfer: async (id: string, payload: { comments?: string; approvedBy?: string }) =>
    (await apiClient.post(`/employees/transfers/${id}/approve`, payload)).data,
  rejectTransfer: async (id: string, payload: { reason: string; comments?: string; approvedBy?: string }) =>
    (await apiClient.post(`/employees/transfers/${id}/reject`, payload)).data,
  makeTransferEffective: async (id: string) => (await apiClient.post(`/employees/transfers/${id}/effective`)).data,
  cancelTransfer: async (id: string) => (await apiClient.post(`/employees/transfers/${id}/cancel`)).data,
};
