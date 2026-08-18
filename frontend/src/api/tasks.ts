import { apiClient } from '@/lib/api-client';
import type { EmployeeTask, TaskRequest, TaskSummary } from './types';

export const tasksApi = {
  list: async (params?: {
    assignedToId?: string;
    assignedToName?: string;
    status?: string;
    priority?: string;
    departmentName?: string;
    search?: string;
  }) => (await apiClient.get<EmployeeTask[]>('/tasks', { params })).data,

  getSummary: async (employeeId?: string) =>
    (await apiClient.get<TaskSummary>('/tasks/dashboard-summary', { params: { employeeId } })).data,

  get: async (id: string) => (await apiClient.get<EmployeeTask>(`/tasks/${id}`)).data,

  create: async (payload: {
    title: string;
    description?: string;
    taskType?: string;
    departmentName?: string;
    projectName?: string;
    priority?: string;
    assignedToId: string;
    assignedById?: string;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    attachments?: string;
    instructions?: string;
    managerRemarks?: string;
  }) => (await apiClient.post<EmployeeTask>('/tasks', payload)).data,

  startTask: async (id: string, startedBy?: string) =>
    (await apiClient.patch<EmployeeTask>(`/tasks/${id}/start`, { startedBy })).data,

  updateProgress: async (
    id: string,
    payload: {
      progress: number;
      status?: string;
      remarks?: string;
      actualHours?: number;
      completionAttachment?: string;
      updatedBy?: string;
    },
  ) => (await apiClient.patch<EmployeeTask>(`/tasks/${id}/progress`, payload)).data,

  completeTask: async (
    id: string,
    payload: {
      completionRemarks: string;
      actualHours?: number;
      completionAttachment?: string;
      completedBy?: string;
    },
  ) => (await apiClient.patch<EmployeeTask>(`/tasks/${id}/complete`, payload)).data,

  reviewTask: async (
    id: string,
    payload: {
      action: 'APPROVE' | 'SEND_BACK' | 'REOPEN';
      remarks?: string;
      reviewedBy?: string;
    },
  ) => (await apiClient.patch<EmployeeTask>(`/tasks/${id}/review`, payload)).data,

  listRequests: async (requestedById?: string) =>
    (await apiClient.get<TaskRequest[]>('/tasks/requests', { params: { requestedById } })).data,

  createRequest: async (payload: {
    requestTitle: string;
    requestType?: string;
    description?: string;
    priority?: string;
    requestedById: string;
  }) => (await apiClient.post<TaskRequest>('/tasks/requests', payload)).data,

  reviewRequest: async (
    id: string,
    payload: {
      action: 'APPROVE' | 'REJECT' | 'CONVERT_TO_TASK';
      remarks?: string;
      assignedToId?: string;
      reviewedBy?: string;
    },
  ) => (await apiClient.patch<TaskRequest>(`/tasks/requests/${id}/review`, payload)).data,
};
