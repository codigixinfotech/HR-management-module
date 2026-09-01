import { apiClient } from '@/lib/api-client';
import type { EmployeeSalaryComponent, PayrollRun, Payslip, PayrollRunStatus, SalaryComponent } from './types';

export const salaryComponentsApi = {
  list: async (companyId?: string, search?: string, type?: string) =>
    (await apiClient.get<SalaryComponent[]>('/payroll/salary-components', { params: { companyId, search, type } })).data,
  create: async (payload: Partial<SalaryComponent>) =>
    (await apiClient.post<SalaryComponent>('/payroll/salary-components', payload)).data,
  update: async (id: string, payload: Partial<SalaryComponent>) =>
    (await apiClient.patch<SalaryComponent>(`/payroll/salary-components/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/payroll/salary-components/${id}`)).data,
};

export const salaryTemplatesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<any[]>('/payroll/salary-templates', { params: { companyId } })).data,
  get: async (id: string) =>
    (await apiClient.get<any>(`/payroll/salary-templates/${id}`)).data,
  create: async (payload: any) =>
    (await apiClient.post<any>('/payroll/salary-templates', payload)).data,
  update: async (id: string, payload: any) =>
    (await apiClient.put<any>(`/payroll/salary-templates/${id}`, payload)).data,
  remove: async (id: string) =>
    (await apiClient.delete(`/payroll/salary-templates/${id}`)).data,
};

export const salaryAssignmentsApi = {
  list: async (companyId?: string, employeeId?: string, status?: string) =>
    (await apiClient.get<any[]>('/payroll/salary-assignments', { params: { companyId, employeeId, status } })).data,
  listRevisions: async (companyId?: string) =>
    (await apiClient.get<any[]>('/payroll/salary-assignments/revisions', { params: { companyId } })).data,
  get: async (id: string) =>
    (await apiClient.get<any>(`/payroll/salary-assignments/${id}`)).data,
  assign: async (payload: any) =>
    (await apiClient.post<any>('/payroll/salary-assignments', payload)).data,
};

export const salaryStructureApi = {
  list: async (employeeId: string) =>
    (await apiClient.get<EmployeeSalaryComponent[]>('/payroll/salary-structure', { params: { employeeId } })).data,
  assign: async (payload: { employeeId: string; salaryComponentId: string; monthlyAmount: number; effectiveFrom: string }) =>
    (await apiClient.post<EmployeeSalaryComponent>('/payroll/salary-structure', payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/payroll/salary-structure/${id}`)).data,
};

export const payrollRunsApi = {
  list: async (companyId?: string) => (await apiClient.get<PayrollRun[]>('/payroll/runs', { params: { companyId } })).data,
  get: async (id: string) => (await apiClient.get<PayrollRun>(`/payroll/runs/${id}`)).data,
  create: async (payload: { companyId: string; month: number; year: number }) =>
    (await apiClient.post<PayrollRun>('/payroll/runs', payload)).data,
  process: async (id: string) => (await apiClient.post<PayrollRun>(`/payroll/runs/${id}/process`)).data,
  updateStatus: async (id: string, status: PayrollRunStatus) =>
    (await apiClient.patch<PayrollRun>(`/payroll/runs/${id}/status`, { status })).data,
};

export const payslipsApi = {
  list: async (params: { payrollRunId?: string; employeeId?: string }) =>
    (await apiClient.get<Payslip[]>('/payroll/payslips', { params })).data,
  get: async (id: string) => (await apiClient.get<Payslip>(`/payroll/payslips/${id}`)).data,
};
