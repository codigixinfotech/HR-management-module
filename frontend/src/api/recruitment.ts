import { apiClient } from '@/lib/api-client';
import type { Candidate, CandidateStage, JobOpening } from './types';

export const jobOpeningsApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<JobOpening[]>('/recruitment/job-openings', { params: { companyId } })).data,
  get: async (id: string) => (await apiClient.get<JobOpening>(`/recruitment/job-openings/${id}`)).data,
  create: async (payload: Partial<JobOpening>) =>
    (await apiClient.post<JobOpening>('/recruitment/job-openings', payload)).data,
  update: async (id: string, payload: Partial<JobOpening>) =>
    (await apiClient.patch<JobOpening>(`/recruitment/job-openings/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/job-openings/${id}`)).data,
  addCandidate: async (id: string, payload: { firstName: string; lastName: string; email: string; phone?: string }) =>
    (await apiClient.post<Candidate>(`/recruitment/job-openings/${id}/candidates`, payload)).data,
};

export const candidatesApi = {
  updateStage: async (id: string, stage: CandidateStage) =>
    (await apiClient.patch<Candidate>(`/recruitment/candidates/${id}/stage`, { stage })).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/candidates/${id}`)).data,
};
