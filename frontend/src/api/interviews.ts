import { apiClient } from '@/lib/api-client';
import type { CandidateInterview, InterviewSummary, InterviewReminderItem } from './types';

export const interviewsApi = {
  list: async (params?: {
    companyId?: string;
    interviewerId?: string;
    candidateId?: string;
    status?: string;
    filterTab?: string;
    search?: string;
  }) => (await apiClient.get<CandidateInterview[]>('/recruitment/interviews', { params })).data,

  getSummary: async (companyId?: string) =>
    (await apiClient.get<InterviewSummary>('/recruitment/interviews/dashboard-summary', { params: { companyId } })).data,

  getReminders: async (interviewerId?: string, companyId?: string) =>
    (await apiClient.get<InterviewReminderItem[]>('/recruitment/interviews/reminders/my', { params: { interviewerId, companyId } })).data,

  get: async (id: string) =>
    (await apiClient.get<CandidateInterview>(`/recruitment/interviews/${id}`)).data,

  create: async (payload: {
    candidateId: string;
    candidateEmail?: string;
    jobOpeningId?: string;
    position: string;
    requisitionCode?: string;
    interviewDate: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    interviewFormat?: string;
    createTeamsMeeting?: boolean;
    meetingLink?: string;
    notes?: string;
    panelMemberIds: string[];
    panelMemberRoles?: Record<string, string>;
    createdById?: string;
    createdByName?: string;
  }) => (await apiClient.post<CandidateInterview>('/recruitment/interviews', payload)).data,

  reschedule: async (
    id: string,
    payload: {
      interviewDate: string;
      startTime: string;
      durationMinutes?: number;
      interviewFormat?: string;
      interviewMode?: string;
      location?: string;
      building?: string;
      room?: string;
      meetingLink?: string;
      reason?: string;
      remarks?: string;
      panelMemberIds?: string[];
      panelMemberRoles?: Record<string, string>;
      notifyCandidate?: boolean;
      notifyPanel?: boolean;
      rescheduledByName?: string;
      originalInterviewDate?: string;
      originalStartTime?: string;
    },
  ) =>
    (await apiClient.patch<CandidateInterview>(`/recruitment/interviews/${id}/reschedule`, payload)).data,

  cancel: async (id: string, comment?: string) =>
    (await apiClient.post<CandidateInterview>(`/recruitment/interviews/${id}/cancel`, { comment })).data,

  updateSchedule: async (
    id: string,
    payload: {
      interviewDate?: string;
      startTime?: string;
      endTime?: string;
      interviewFormat?: string;
      meetingLink?: string;
      notes?: string;
      panelMemberIds?: string[];
      panelMemberRoles?: Record<string, string>;
    },
  ) => (await apiClient.patch<CandidateInterview>(`/recruitment/interviews/${id}/schedule`, payload)).data,

  updateStatus: async (id: string, payload: { status: string; remarks?: string }) =>
    (await apiClient.patch<CandidateInterview>(`/recruitment/interviews/${id}/status`, payload)).data,

  submitEvaluation: async (
    id: string,
    payload: {
      interviewerId: string;
      interviewerName?: string;
      technicalSkills: number;
      communication: number;
      problemSolving: number;
      relevantExperience: number;
      roleKnowledge: number;
      strengths?: string;
      weaknesses?: string;
      interviewNotes?: string;
      recommendation: string;
    },
  ) => (await apiClient.post(`/recruitment/interviews/${id}/evaluations`, payload)).data,

  getCandidateHistory: async (candidateId: string) =>
    (await apiClient.get<CandidateInterview[]>(`/recruitment/interviews/candidate/${candidateId}/history`)).data,

  sendEmail: async (id: string) =>
    (await apiClient.post<{ success: boolean; message: string; messageId?: string }>(`/recruitment/interviews/${id}/send-email`)).data,
};
