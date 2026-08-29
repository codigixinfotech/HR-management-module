import { apiClient } from '@/lib/api-client';

export interface CandidateTeamsMessage {
  id: string;
  candidateId: string;
  teamsChatId?: string | null;
  teamsMessageId?: string | null;
  senderType: 'recruiter' | 'candidate' | 'system';
  senderName: string;
  content: string;
  status: string;
  deliveryStatus: string;
  eventType?: string | null;
  meta?: any;
  sentAt: string;
}

export const teamsChatApi = {
  getCandidateMessages: async (candidateId: string): Promise<CandidateTeamsMessage[]> => {
    const res = await apiClient.get(`/recruitment/candidates/${candidateId}/messages`);
    return res.data;
  },

  sendMessage: async (
    candidateId: string,
    payload: { content: string; senderName?: string; senderType?: 'recruiter' | 'candidate' | 'system' },
  ): Promise<CandidateTeamsMessage> => {
    const res = await apiClient.post(`/recruitment/candidates/${candidateId}/messages`, payload);
    return res.data;
  },

  postSystemEvent: async (
    candidateId: string,
    payload: { senderName: string; content: string; eventType?: string; meta?: any },
  ): Promise<CandidateTeamsMessage> => {
    const res = await apiClient.post(`/recruitment/candidates/${candidateId}/messages/system`, payload);
    return res.data;
  },

  sendGuestInvitation: async (
    candidateId: string,
    notes?: string,
  ): Promise<CandidateTeamsMessage> => {
    const res = await apiClient.post(`/recruitment/candidates/${candidateId}/teams-guest-invite`, { notes });
    return res.data;
  },
};
