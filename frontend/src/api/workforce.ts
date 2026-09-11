import { apiClient } from '@/lib/api-client';
import type { ShiftAssignment, ShiftType } from './types';

export const shiftTypesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<ShiftType[]>('/workforce/shift-types', { params: { companyId } })).data,
  create: async (payload: Partial<ShiftType>) =>
    (await apiClient.post<ShiftType>('/workforce/shift-types', payload)).data,
  update: async (id: string, payload: Partial<ShiftType>) =>
    (await apiClient.patch<ShiftType>(`/workforce/shift-types/${id}`, payload)).data,
  remove: async (id: string) =>
    (await apiClient.delete(`/workforce/shift-types/${id}`)).data,
};

export const shiftAssignmentsApi = {
  list: async (employeeId?: string, companyId?: string) =>
    (await apiClient.get<ShiftAssignment[]>('/workforce/shift-assignments', { params: { employeeId, companyId } })).data,
  create: async (payload: Partial<ShiftAssignment>) =>
    (await apiClient.post<ShiftAssignment>('/workforce/shift-assignments', payload)).data,
  update: async (id: string, payload: Partial<ShiftAssignment>) =>
    (await apiClient.patch<ShiftAssignment>(`/workforce/shift-assignments/${id}`, payload)).data,
  remove: async (id: string) =>
    (await apiClient.delete(`/workforce/shift-assignments/${id}`)).data,
};

export const shiftRosterApi = {
  getRoster: async (params?: { companyId?: string; startDate?: string; endDate?: string }) =>
    (await apiClient.get<{ employees: any[]; dates: string[]; totalHeadcount: number; shifts: any[] }>(
      '/workforce/roster',
      { params }
    )).data,
  saveSlot: async (payload: {
    companyId?: string;
    employeeId: string;
    date: string;
    shiftCode: string;
    shiftName: string;
    timing?: string;
    status?: string;
    isCustomOverride?: boolean;
    reason?: string;
  }) => (await apiClient.post('/workforce/roster/slot', payload)).data,
  bulkAutoAssign: async (payload: { companyId?: string; dates: string[]; defaultCode?: string }) =>
    (await apiClient.post('/workforce/roster/bulk-assign', payload)).data,
  publishRoster: async (payload: {
    companyId?: string;
    periodName: string;
    department?: string;
    dateRange: string;
    headcount: number;
    submittedBy: string;
  }) => (await apiClient.post('/workforce/roster/publish', payload)).data,
};

export const shiftRotationsApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<any[]>('/workforce/rotations', { params: { companyId } })).data,
  create: async (payload: any) =>
    (await apiClient.post('/workforce/rotations', payload)).data,
  start: async (id: string) =>
    (await apiClient.post(`/workforce/rotations/${id}/start`)).data,
  pause: async (id: string) =>
    (await apiClient.post(`/workforce/rotations/${id}/pause`)).data,
  advance: async (id: string) =>
    (await apiClient.post(`/workforce/rotations/${id}/advance`)).data,
};

export const shiftChangesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<any[]>('/workforce/shift-changes', { params: { companyId } })).data,
  create: async (payload: any) =>
    (await apiClient.post('/workforce/shift-changes', payload)).data,
  resolve: async (id: string, payload: { status: 'Approved' | 'Rejected' | 'Cancelled' | 'Pending Approval'; remarks?: string; actorName?: string }) =>
    (await apiClient.patch(`/workforce/shift-changes/${id}/resolve`, payload)).data,
};

export const shiftSwapsApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<any[]>('/workforce/shift-swaps', { params: { companyId } })).data,
  create: async (payload: any) =>
    (await apiClient.post('/workforce/shift-swaps', payload)).data,
  resolve: async (id: string, payload: { status: 'Approved' | 'Rejected'; remarks?: string; actorName?: string }) =>
    (await apiClient.patch(`/workforce/shift-swaps/${id}/resolve`, payload)).data,
  cancel: async (id: string, payload?: { reason?: string; actorName?: string }) =>
    (await apiClient.patch(`/workforce/shift-swaps/${id}/cancel`, payload || {})).data,
};

export const shiftBatchesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<any[]>('/workforce/batches', { params: { companyId } })).data,
  resolveStatus: async (id: string, status: string) =>
    (await apiClient.patch(`/workforce/batches/${id}/status`, { status })).data,
};
