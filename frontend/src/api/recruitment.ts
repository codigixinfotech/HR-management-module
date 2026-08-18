import { apiClient } from '@/lib/api-client';
import type { Candidate, CandidateStage, JobOpening, ManpowerPlan, ManpowerRequisition } from './types';

export const jobOpeningsApi = {
  list: async (companyId?: string, status?: string) =>
    (await apiClient.get<JobOpening[]>('/recruitment/job-openings', { params: { companyId, status } })).data,
  get: async (id: string) => (await apiClient.get<JobOpening>(`/recruitment/job-openings/${id}`)).data,
  create: async (payload: Partial<JobOpening>) =>
    (await apiClient.post<JobOpening>('/recruitment/job-openings', payload)).data,
  publish: async (id: string) =>
    (await apiClient.patch<JobOpening>(`/recruitment/job-openings/${id}/publish`)).data,
  update: async (id: string, payload: Partial<JobOpening>) =>
    (await apiClient.patch<JobOpening>(`/recruitment/job-openings/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/job-openings/${id}`)).data,
  listCandidates: async (id: string) =>
    (await apiClient.get<Candidate[]>(`/recruitment/job-openings/${id}/candidates`)).data,
  uploadResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (
      await apiClient.post<{ documentUrl: string; filename: string; originalName: string }>(
        '/recruitment/job-openings/upload-resume',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    ).data;
  },
  addCandidate: async (id: string, payload: Partial<Candidate>) =>
    (await apiClient.post<Candidate>(`/recruitment/job-openings/${id}/candidates`, payload)).data,
};

export const candidatesApi = {
  updateStage: async (id: string, stage: CandidateStage) =>
    (await apiClient.patch<Candidate>(`/recruitment/candidates/${id}/stage`, { stage })).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/candidates/${id}`)).data,
};

export const manpowerPlansApi = {
  list: async (companyId?: string) =>
    (await apiClient.get<ManpowerPlan[]>('/recruitment/manpower-plans', { params: { companyId } })).data,
  get: async (id: string) => (await apiClient.get<ManpowerPlan>(`/recruitment/manpower-plans/${id}`)).data,
  countActive: async (departmentName?: string, role?: string, companyId?: string, departmentId?: string, designationId?: string) =>
    (await apiClient.get<number>('/recruitment/manpower-plans/count-active', { params: { departmentName, role, companyId, departmentId, designationId } })).data,
  create: async (payload: Partial<ManpowerPlan>) =>
    (await apiClient.post<ManpowerPlan>('/recruitment/manpower-plans', payload)).data,
  update: async (id: string, payload: Partial<ManpowerPlan>) =>
    (await apiClient.patch<ManpowerPlan>(`/recruitment/manpower-plans/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/manpower-plans/${id}`)).data,
};

export const manpowerRequisitionsApi = {
  getNextNumber: async () => (await apiClient.get<string>('/recruitment/manpower-requisitions/next-number')).data,
  list: async (companyId?: string, status?: string) =>
    (await apiClient.get<ManpowerRequisition[]>('/recruitment/manpower-requisitions', { params: { companyId, status } })).data,
  get: async (id: string) => (await apiClient.get<ManpowerRequisition>(`/recruitment/manpower-requisitions/${id}`)).data,
  create: async (payload: Partial<ManpowerRequisition>) =>
    (await apiClient.post<ManpowerRequisition>('/recruitment/manpower-requisitions', payload)).data,
  updateStatus: async (id: string, status: string, rejectionReason?: string) =>
    (await apiClient.patch<ManpowerRequisition>(`/recruitment/manpower-requisitions/${id}/status`, { status, rejectionReason })).data,
  update: async (id: string, payload: Partial<ManpowerRequisition>) =>
    (await apiClient.patch<ManpowerRequisition>(`/recruitment/manpower-requisitions/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/manpower-requisitions/${id}`)).data,
};


