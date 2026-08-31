import { apiClient } from '@/lib/api-client';
import type {
  ApprovalStatus,
  AttendanceRecord,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  PaginatedResult,
} from './types';

export const leaveTypesApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<LeaveType[]>('/attendance-leave/leave-types', { params: { companyId } })).data,
  create: async (payload: Partial<LeaveType>) =>
    (await apiClient.post<LeaveType>('/attendance-leave/leave-types', payload)).data,
  update: async (id: string, payload: Partial<LeaveType>) =>
    (await apiClient.patch<LeaveType>(`/attendance-leave/leave-types/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/attendance-leave/leave-types/${id}`)).data,
};

export const holidaysApi = {
  list: async (companyId?: string, year?: number) =>
    (await apiClient.get<Holiday[]>('/attendance-leave/holidays', { params: { companyId, year } })).data,
  create: async (payload: Partial<Holiday>) => (await apiClient.post<Holiday>('/attendance-leave/holidays', payload)).data,
  update: async (id: string, payload: Partial<Holiday>) =>
    (await apiClient.patch<Holiday>(`/attendance-leave/holidays/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/attendance-leave/holidays/${id}`)).data,
};

export const leaveBalancesApi = {
  list: async (employeeId?: string, year?: number) =>
    (await apiClient.get<LeaveBalance[]>('/attendance-leave/leave-balances', { params: { employeeId, year } })).data,
  listMy: async (year?: number) =>
    (await apiClient.get<LeaveBalance[]>('/attendance-leave/leave-balances/my', { params: { year } })).data,
  allocate: async (payload: { employeeId: string; leaveTypeId: string; year: number; allocated: number }) =>
    (await apiClient.post<LeaveBalance>('/attendance-leave/leave-balances', payload)).data,
};

export const leaveRequestsApi = {
  list: async (params: { page?: number; pageSize?: number; employeeId?: string; status?: ApprovalStatus }) =>
    (await apiClient.get<PaginatedResult<LeaveRequest>>('/attendance-leave/leave-requests', { params })).data,
  listMy: async (params?: { status?: ApprovalStatus }) =>
    (await apiClient.get<LeaveRequest[]>('/attendance-leave/leave-requests/my', { params })).data,
  create: async (payload: {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => (await apiClient.post<LeaveRequest>('/attendance-leave/leave-requests', payload)).data,
  updateStatus: async (id: string, payload: { status: ApprovalStatus; approverId?: string; approverRemarks?: string }) =>
    (await apiClient.patch<LeaveRequest>(`/attendance-leave/leave-requests/${id}/status`, payload)).data,
};

export const attendanceApi = {
  list: async (params: { employeeId?: string; companyId?: string; from?: string; to?: string }) =>
    (await apiClient.get<AttendanceRecord[]>('/attendance-leave/attendance', { params })).data,
  getMy: async (params?: { from?: string; to?: string }) =>
    (await apiClient.get<AttendanceRecord[]>('/attendance-leave/attendance/my', { params })).data,
  getMySummary: async () =>
    (await apiClient.get<any>('/attendance-leave/attendance/my/summary')).data,
  mark: async (payload: Partial<AttendanceRecord> & { companyId: string; employeeId: string; date: string }) =>
    (await apiClient.post<AttendanceRecord>('/attendance-leave/attendance', payload)).data,
  update: async (id: string, payload: Partial<AttendanceRecord>) =>
    (await apiClient.patch<AttendanceRecord>(`/attendance-leave/attendance/${id}`, payload)).data,
};
