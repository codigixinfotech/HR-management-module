import { apiClient } from '@/lib/api-client';

export interface HrPolicy {
  id: string;
  companyId?: string;
  policyCode: string;
  title: string;
  category: 'Conduct' | 'POSH' | 'Workplace' | 'IT Security' | 'Financial' | string;
  description?: string;
  version: string;
  documentUrl?: string;
  fileSize?: string;
  color?: string;
  esignRequirement: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | string;
  totalEmployees: number;
  signedCount: number;
  publishedAt: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  versionHistory?: HrPolicy[];
}

export interface HrPolicyKpis {
  publishedCount: number;
  overallRate: number;
  pendingSignoffs: number;
  auditHealth: string;
  auditedStandard: string;
}

export const hrPoliciesApi = {
  list: async (params?: { search?: string; category?: string; status?: string; companyId?: string }) =>
    (await apiClient.get<HrPolicy[]>('/organization/hr-policies', { params })).data,

  getKpis: async (companyId?: string) =>
    (await apiClient.get<HrPolicyKpis>('/organization/hr-policies/kpis', { params: { companyId } })).data,

  get: async (id: string) =>
    (await apiClient.get<HrPolicy>(`/organization/hr-policies/${id}`)).data,

  create: async (payload: Partial<HrPolicy>) =>
    (await apiClient.post<HrPolicy>('/organization/hr-policies', payload)).data,

  update: async (id: string, payload: Partial<HrPolicy>) =>
    (await apiClient.patch<HrPolicy>(`/organization/hr-policies/${id}`, payload)).data,

  createVersion: async (id: string, payload: { version: string; title?: string; description?: string }) =>
    (await apiClient.post<HrPolicy>(`/organization/hr-policies/${id}/version`, payload)).data,

  sendReminder: async (id: string) =>
    (await apiClient.post<{ success: boolean; message: string; pendingCount: number }>(
      `/organization/hr-policies/${id}/send-reminder`,
    )).data,

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (
      await apiClient.post<{
        documentUrl: string;
        fileSize: string;
        filename: string;
        originalName: string;
      }>('/organization/hr-policies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },

  remove: async (id: string) =>
    (await apiClient.delete(`/organization/hr-policies/${id}`)).data,
};
