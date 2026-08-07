import { apiClient } from '@/lib/api-client';
import type { PpeIssuance, PpeItem, SafetyAudit, SafetyIncident, IncidentStatus } from './types';

export const incidentsApi = {
  list: async (companyId?: string) => (await apiClient.get<SafetyIncident[]>('/ehs/incidents', { params: { companyId } })).data,
  create: async (payload: Partial<SafetyIncident>) => (await apiClient.post<SafetyIncident>('/ehs/incidents', payload)).data,
  updateStatus: async (id: string, payload: { status: IncidentStatus; correctiveAction?: string }) =>
    (await apiClient.patch<SafetyIncident>(`/ehs/incidents/${id}/status`, payload)).data,
};

export const ppeApi = {
  list: async (companyId?: string) => (await apiClient.get<PpeItem[]>('/ehs/ppe', { params: { companyId } })).data,
  create: async (payload: Partial<PpeItem>) => (await apiClient.post<PpeItem>('/ehs/ppe', payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/ehs/ppe/${id}`)).data,
  issue: async (id: string, payload: { employeeId: string; quantity: number }) =>
    (await apiClient.post(`/ehs/ppe/${id}/issue`, payload)).data,
  listIssuances: async (ppeItemId?: string) =>
    (await apiClient.get<PpeIssuance[]>('/ehs/ppe/issuances', { params: { ppeItemId } })).data,
};

export const safetyAuditsApi = {
  list: async (companyId?: string) => (await apiClient.get<SafetyAudit[]>('/ehs/audits', { params: { companyId } })).data,
  create: async (payload: Partial<SafetyAudit>) => (await apiClient.post<SafetyAudit>('/ehs/audits', payload)).data,
};
