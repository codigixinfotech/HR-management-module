import { apiClient } from '@/lib/api-client';

export interface CostCenter {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: string;
  branchId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  budget: number;
  headcountCapacity: number;
  effectiveFrom: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  branch?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

export interface PayGrade {
  id: string;
  companyId: string;
  businessUnit?: string | null;
  gradeCode: string;
  gradeName: string;
  level: string;
  category: string;
  jobFamily?: string | null;
  departmentId?: string | null;
  minSalary: number;
  maxSalary: number;
  currency: string;
  effectiveFrom: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  department?: { id: string; name: string } | null;
}

export const costCentersApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<CostCenter[]>('/organization/cost-centers', { params: { companyId } })).data,

  create: async (payload: Partial<CostCenter>) =>
    (await apiClient.post<CostCenter>('/organization/cost-centers', payload)).data,

  update: async (id: string, payload: Partial<CostCenter>) =>
    (await apiClient.patch<CostCenter>(`/organization/cost-centers/${id}`, payload)).data,

  remove: async (id: string) =>
    (await apiClient.delete(`/organization/cost-centers/${id}`)).data,
};

export const payGradesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<PayGrade[]>('/organization/pay-grades', { params: { companyId } })).data,

  create: async (payload: Partial<PayGrade>) =>
    (await apiClient.post<PayGrade>('/organization/pay-grades', payload)).data,

  update: async (id: string, payload: Partial<PayGrade>) =>
    (await apiClient.patch<PayGrade>(`/organization/pay-grades/${id}`, payload)).data,

  remove: async (id: string) =>
    (await apiClient.delete(`/organization/pay-grades/${id}`)).data,
};
