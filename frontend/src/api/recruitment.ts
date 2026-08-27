import { apiClient } from '@/lib/api-client';
import type { Candidate, CandidateStage, JobOpening, ManpowerPlan, ManpowerRequisition } from './types';

export const jobOpeningsApi = {
  list: async (companyId?: string, status?: string) =>
    (await apiClient.get<JobOpening[]>('/recruitment/job-openings', { params: { companyId, status } })).data,
  listPublic: async (companyId?: string) =>
    (await apiClient.get<JobOpening[]>('/recruitment/job-openings/public/list', { params: { companyId } })).data,
  getPortalConfig: async () =>
    (await apiClient.get<Record<string, any>>('/recruitment/job-openings/public/config')).data,
  updatePortalConfig: async (payload: Record<string, any>) =>
    (await apiClient.patch<Record<string, any>>('/recruitment/job-openings/portal-config', payload)).data,
  listPublicPaginated: async (params?: {
    companyId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    type?: string;
    sortBy?: string;
  }) =>
    (
      await apiClient.get<{
        jobs: JobOpening[];
        totalCount: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        config: Record<string, any>;
      }>('/recruitment/job-openings/public/paginated', { params })
    ).data,
  findPublic: async (id: string) =>
    (await apiClient.get<JobOpening>(`/recruitment/job-openings/public/${id}`)).data,
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
  get: async (id: string) => (await apiClient.get<Candidate>(`/recruitment/candidates/${id}`)).data,
  getScreening: async (id: string) => (await apiClient.get<CandidateScreening>(`/recruitment/candidates/${id}/screening`)).data,
  saveScreening: async (id: string, payload: any) =>
    (await apiClient.post<{ success: boolean; candidate: Candidate; screening: CandidateScreening }>(`/recruitment/candidates/${id}/screening`, payload)).data,
  updateStage: async (id: string, stage: CandidateStage) =>
    (await apiClient.patch<Candidate>(`/recruitment/candidates/${id}/stage`, { stage })).data,
  remove: async (id: string) => (await apiClient.delete(`/recruitment/candidates/${id}`)).data,
};

export const assessmentsApi = {
  assign: async (payload: Partial<AssessmentAssignment>) =>
    (await apiClient.post<AssessmentAssignment>('/recruitment/assessments/assign', payload)).data,
  listAssignments: async (candidateId?: string) =>
    (await apiClient.get<AssessmentAssignment[]>('/recruitment/assessments/assignments', { params: { candidateId } })).data,
  evaluate: async (id: string, payload: { scorePercent: number; comments?: string; status: 'PASSED' | 'FAILED' }) =>
    (await apiClient.patch<AssessmentAssignment>(`/recruitment/assessments/assignments/${id}/evaluate`, payload)).data,
};

export const manpowerPlansApi = {
  list: async (companyId?: string, branchId?: string) =>
    (await apiClient.get<ManpowerPlan[]>('/recruitment/manpower-plans', { params: { companyId, branchId } })).data,
  get: async (id: string) => (await apiClient.get<ManpowerPlan>(`/recruitment/manpower-plans/${id}`)).data,
  countActive: async (departmentName?: string, role?: string, companyId?: string, departmentId?: string, designationId?: string, branchId?: string) =>
    (await apiClient.get<number>('/recruitment/manpower-plans/count-active', { params: { departmentName, role, companyId, departmentId, designationId, branchId } })).data,
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

export const offersApi = {
  sendOfferEmail: async (payload: {
    offerId: string;
    candidateName: string;
    candidateEmail: string;
    position: string;
    ctc: string;
    joiningDate?: string;
    requisitionCode?: string;
    interviewCode?: string;
    location?: string;
    manager?: string;
  }) => (await apiClient.post<{ success: boolean; offerId: string; candidateEmail: string; status: string; sentAt: string; attachmentFilename: string; previewUrl?: string; isEthereal?: boolean }>('/recruitment/offers/send-email', payload)).data,

  testSmtp: async (email?: string) =>
    (await apiClient.post<{ success: boolean; message: string; smtpHost?: string; smtpPort?: string; testedEmail?: string; error?: string }>('/recruitment/offers/test-smtp', { email })).data,

  getAuditLogs: async (offerId?: string) =>
    (await apiClient.get<any[]>('/recruitment/offers/audit-logs', { params: { offerId } })).data,
};


