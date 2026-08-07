import { apiClient } from '@/lib/api-client';
import type { ShiftAssignment, ShiftType } from './types';

export const shiftTypesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<ShiftType[]>('/workforce/shift-types', { params: { companyId } })).data,
  create: async (payload: Partial<ShiftType>) => (await apiClient.post<ShiftType>('/workforce/shift-types', payload)).data,
  update: async (id: string, payload: Partial<ShiftType>) =>
    (await apiClient.patch<ShiftType>(`/workforce/shift-types/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/workforce/shift-types/${id}`)).data,
};

export const shiftAssignmentsApi = {
  list: async (employeeId?: string) =>
    (await apiClient.get<ShiftAssignment[]>('/workforce/shift-assignments', { params: { employeeId } })).data,
  create: async (payload: Partial<ShiftAssignment>) =>
    (await apiClient.post<ShiftAssignment>('/workforce/shift-assignments', payload)).data,
  update: async (id: string, payload: Partial<ShiftAssignment>) =>
    (await apiClient.patch<ShiftAssignment>(`/workforce/shift-assignments/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/workforce/shift-assignments/${id}`)).data,
};
