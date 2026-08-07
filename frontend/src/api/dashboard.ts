import { apiClient } from '@/lib/api-client';
import type { DashboardSummary } from './types';

export const dashboardApi = {
  summary: async (companyId?: string) =>
    (await apiClient.get<DashboardSummary>('/dashboard/summary', { params: { companyId } })).data,
};
