import { apiClient } from '@/lib/api-client';

export interface TechnologyMaster {
  id: string;
  name: string;
  category?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  companyId: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  technology: string;
  technologyId?: string;
  topic?: string;
  questionText: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  options: string[];
  correctAnswer?: any;
  marks: number;
  explanation?: string;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: { input: string; expectedOutput: string }[];
  status: 'Active' | 'Inactive';
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentSection {
  id: string;
  assessmentId?: string;
  name: string;
  technology: string;
  technologyId?: string;
  topic?: string;
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  selectedQuestions?: Question[];
  ordering?: number;
}

export interface Assessment {
  id: string;
  name: string;
  technology?: string;
  technologyId?: string;
  jobPosition?: string;
  requisitionId?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  durationMins: number;
  passingPercentage: number;
  totalMarks: number;
  attemptLimit: number;
  startDate?: string;
  expiryDate?: string;
  sections?: AssessmentSection[];
  questions?: Question[];
  status: 'Draft' | 'Ready' | 'Published' | 'Expired' | 'Archived';
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  candidateAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  explanation: string;
  codeLanguage?: string;
  submittedCode?: string;
  testCasesPassed?: number;
  testCasesTotal?: number;
}

export interface CandidateAssessmentAttempt {
  id?: string;
  token: string;
  assessmentId: string;
  assessmentName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateRole?: string;
  jobPosition?: string;
  technology?: string;
  technologyId?: string;
  durationMins?: number;
  durationMinutes?: number;
  questionCount?: number;
  passingPercentage?: number;
  expiryDate?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
  emailStatus?: 'SENT' | 'SCHEDULED';
  assessmentStatus?: 'SCHEDULED' | 'WAITING_FOR_START' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  sentAt: string;
  startedAt?: string;
  submittedAt?: string;
  answers: Record<string, any>;
  markedForReview: string[];
  score?: number;
  totalMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  timeTakenSeconds?: number;
  questionResults?: QuestionResult[];
  sections?: AssessmentSection[];
  companyId?: string;
  branchId?: string;
}

// Clean up any legacy localStorage keys to ensure zero stale mock data
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ehcm_assessments') || key.startsWith('ehcm_questions') || key.startsWith('ehcm_technologies') || key.startsWith('ehcm_candidate_attempts'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * ── Backend Assessment & Recruitment API ──
 * All operations execute directly against the NestJS backend + MySQL database.
 */
export const assessmentsApi = {
  getAssessments: async (companyId?: string, branchId?: string): Promise<Assessment[]> => {
    if (!companyId) return [];
    try {
      const { data } = await apiClient.get<Assessment[]>('/recruitment/assessments', {
        params: {
          companyId,
          branchId: branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined,
        },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getKpis: async (companyId?: string, branchId?: string) => {
    if (!companyId) {
      return {
        activeTests: 0,
        questionBankCount: 0,
        testsSent: 0,
        completed: 0,
        pending: 0,
        avgScore: 0,
        passRate: 0,
        techDistribution: {},
      };
    }
    try {
      const { data } = await apiClient.get<any>('/recruitment/assessments/kpis', {
        params: {
          companyId,
          branchId: branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined,
        },
      });
      return data;
    } catch {
      return {
        activeTests: 0,
        questionBankCount: 0,
        testsSent: 0,
        completed: 0,
        pending: 0,
        avgScore: 0,
        passRate: 0,
        techDistribution: {},
      };
    }
  },

  getQuestions: async (companyId?: string, branchId?: string): Promise<Question[]> => {
    if (!companyId) return [];
    try {
      const { data } = await apiClient.get<Question[]>('/recruitment/assessments/questions', {
        params: {
          companyId,
          branchId: branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined,
        },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  saveQuestion: async (payload: any, companyId?: string, branchId?: string): Promise<Question> => {
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post<Question>('/recruitment/assessments/questions', payload, {
      params: { companyId, branchId: cleanBranch },
    });
    return data;
  },

  bulkAddQuestions: async (questions: any[], companyId?: string, branchId?: string): Promise<Question[]> => {
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post<Question[]>('/recruitment/assessments/questions/bulk', { questions }, {
      params: { companyId, branchId: cleanBranch },
    });
    return Array.isArray(data) ? data : [];
  },

  toggleQuestionStatus: async (id: string, companyId?: string): Promise<Question> => {
    const { data } = await apiClient.patch<Question>(`/recruitment/assessments/questions/${id}/status`, {}, {
      params: { companyId },
    });
    return data;
  },

  deleteQuestion: async (id: string, companyId?: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/recruitment/assessments/questions/${id}`, {
      params: { companyId },
    });
    return data;
  },

  getAttempts: async (companyId?: string, branchId?: string): Promise<CandidateAssessmentAttempt[]> => {
    if (!companyId) return [];
    try {
      const { data } = await apiClient.get<CandidateAssessmentAttempt[]>('/recruitment/assessments/attempts', {
        params: {
          companyId,
          branchId: branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined,
        },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  createAssessment: async (
    payload: Omit<Assessment, 'id'> & { id?: string },
    companyId?: string,
    branchId?: string
  ): Promise<Assessment> => {
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post<Assessment>('/recruitment/assessments', payload, {
      params: { companyId, branchId: cleanBranch },
    });
    return data;
  },

  updateStatus: async (id: string, status: Assessment['status'], companyId?: string): Promise<any> => {
    const { data } = await apiClient.patch(`/recruitment/assessments/${id}/status`, { status }, {
      params: { companyId },
    });
    return data;
  },

  deleteAssessment: async (id: string, companyId?: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/recruitment/assessments/${id}`, {
      params: { companyId },
    });
    return data;
  },

  assignAttempt: async (
    payload: any,
    companyId?: string,
    branchId?: string
  ): Promise<{ successCount: number; failureCount: number; attempts: CandidateAssessmentAttempt[]; errors: Array<{ candidateId: string; candidateName: string; reason: string }> }> => {
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post('/recruitment/assessments/assign', payload, {
      params: { companyId, branchId: cleanBranch },
    });
    // Support both legacy array response and new structured response
    if (Array.isArray(data)) {
      return { successCount: data.length, failureCount: 0, attempts: data, errors: [] };
    }
    return data as { successCount: number; failureCount: number; attempts: CandidateAssessmentAttempt[]; errors: Array<{ candidateId: string; candidateName: string; reason: string }> };
  },

  getAttemptByToken: async (token: string): Promise<{ attempt: CandidateAssessmentAttempt; questions: Question[] }> => {
    const { data } = await apiClient.get<{ attempt: CandidateAssessmentAttempt; questions: Question[] }>(
      `/recruitment/assessments/attempts/${token}`
    );
    return data;
  },

  updateAttemptProgress: async (
    token: string,
    answers: Record<string, any>,
    markedForReview: string[]
  ): Promise<{ success: boolean }> => {
    const { data } = await apiClient.patch<{ success: boolean }>(
      `/recruitment/assessments/attempts/${token}/progress`,
      { answers, markedForReview }
    );
    return data;
  },

  submitAttempt: async (
    token: string,
    payload: { answers: Record<string, any>; timeTakenSeconds?: number }
  ): Promise<CandidateAssessmentAttempt> => {
    const { data } = await apiClient.post<CandidateAssessmentAttempt>(
      `/recruitment/assessments/attempts/${token}/submit`,
      payload
    );
    return data;
  },
};

/**
 * ── Backend Skill / Technology Master API ──
 */
export const technologiesApi = {
  getTechnologies: async (companyId?: string, branchId?: string, activeOnly?: boolean): Promise<TechnologyMaster[]> => {
    if (!companyId) return [];
    try {
      const { data } = await apiClient.get<TechnologyMaster[]>('/recruitment/assessments/technologies', {
        params: {
          companyId,
          branchId: branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined,
          activeOnly: activeOnly ? 'true' : undefined,
        },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  createTechnology: async (
    dto: { name: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId?: string,
    branchId?: string,
  ): Promise<TechnologyMaster> => {
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post<TechnologyMaster>('/recruitment/assessments/technologies', dto, {
      params: { companyId, branchId: cleanBranch },
    });
    return data;
  },

  updateTechnology: async (
    id: string,
    dto: { name?: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId?: string,
  ): Promise<TechnologyMaster> => {
    const { data } = await apiClient.patch<TechnologyMaster>(`/recruitment/assessments/technologies/${id}`, dto, {
      params: { companyId },
    });
    return data;
  },

  toggleStatus: async (id: string, companyId?: string): Promise<TechnologyMaster> => {
    const { data } = await apiClient.patch<TechnologyMaster>(`/recruitment/assessments/technologies/${id}/status`, {}, {
      params: { companyId },
    });
    return data;
  },

  deleteTechnology: async (id: string, companyId?: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/recruitment/assessments/technologies/${id}`, {
      params: { companyId },
    });
    return data;
  },

  clearAllTechnologies: async (companyId?: string): Promise<{ count: number }> => {
    if (!companyId) return { count: 0 };
    const { data } = await apiClient.delete<{ count: number }>('/recruitment/assessments/technologies', {
      params: { companyId },
    });
    return data;
  },

  seedStandardSkills: async (companyId?: string, branchId?: string): Promise<TechnologyMaster[]> => {
    if (!companyId) return [];
    const cleanBranch = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const { data } = await apiClient.post<TechnologyMaster[]>('/recruitment/assessments/technologies/seed-standard', {}, {
      params: { companyId, branchId: cleanBranch },
    });
    return Array.isArray(data) ? data : [];
  },
};

/**
 * Backward compatibility wrapper that redirects calls to the real APIs without mocking
 */
export const assessmentStore = {
  getAssessments: () => [] as Assessment[],
  getQuestions: () => [] as Question[],
  getAttempts: () => [] as CandidateAssessmentAttempt[],
  getTechnologies: () => [] as TechnologyMaster[],
  saveAssessment: async (p: any, c?: string, b?: string) => assessmentsApi.createAssessment(p, c, b),
  updateAssessmentStatus: async (id: string, s: any, c?: string) => assessmentsApi.updateStatus(id, s, c),
  deleteAssessment: async (id: string, c?: string) => assessmentsApi.deleteAssessment(id, c),
  saveQuestion: async (q: any, c?: string, b?: string) => assessmentsApi.saveQuestion(q, c, b),
  bulkAddQuestions: async (qs: any[], c?: string, b?: string) => assessmentsApi.bulkAddQuestions(qs, c, b),
  toggleQuestionStatus: async (id: string, c?: string) => assessmentsApi.toggleQuestionStatus(id, c),
  deleteQuestion: async (id: string, c?: string) => assessmentsApi.deleteQuestion(id, c),
  createCandidateAttempt: async (p: any, c?: string, b?: string) => assessmentsApi.assignAttempt(p, c, b),
  getAttemptByToken: async (token: string) => assessmentsApi.getAttemptByToken(token),
  updateAttemptProgress: async (token: string, a: any, m: any) => assessmentsApi.updateAttemptProgress(token, a, m),
  submitCandidateAssessment: async (token: string, answers: any, timeTaken: number) => assessmentsApi.submitAttempt(token, { answers, timeTakenSeconds: timeTaken }),
};
