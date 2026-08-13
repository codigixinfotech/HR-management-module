import { apiClient } from '@/lib/api-client';

export interface ExitClearanceItem {
  id: string;
  exitId: string;
  department: 'Reporting Manager' | 'IT' | 'Admin' | 'Finance' | 'HR' | 'Assets' | string;
  itemKey: string;
  itemLabel: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'CLEARED' | string;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface ExitInterview {
  id: string;
  exitId: string;
  primaryReason: string;
  secondaryReason?: string;
  managerFeedback?: string;
  employeeFeedback?: string;
  workEnvironmentRating?: number;
  compensationRating?: number;
  recommendCompany?: boolean;
  rehireEligible?: boolean;
  hrRemarks?: string;
  completedAt?: string;
}

export interface ExitFnfSettlement {
  id: string;
  exitId: string;
  salaryPayable: number;
  leaveEncashment: number;
  incentives: number;
  reimbursements: number;
  noticeRecovery: number;
  loanAdvanceRecovery: number;
  assetRecovery: number;
  otherDeductions: number;
  grossPayable: number;
  totalDeductions: number;
  netPayable: number;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'PAID' | string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

export interface ExitAuditLog {
  id: string;
  exitId: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  performedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface EmployeeExit {
  id: string;
  exitCode: string;
  employeeId: string;
  companyId?: string;
  resignationDate: string;
  noticePeriodDays: number;
  lastWorkingDay: string;
  adjustedLwd?: string;
  lwdAdjustmentReason?: string;
  exitType: string;
  exitReason: string;
  resignationLetterUrl?: string;
  remarks?: string;
  status:
    | 'INITIATED'
    | 'HR_REVIEW'
    | 'MANAGER_APPROVAL'
    | 'NOTICE_PERIOD'
    | 'CLEARANCE_PENDING'
    | 'CLEARANCE_COMPLETED'
    | 'EXIT_INTERVIEW'
    | 'FNF_PENDING'
    | 'FNF_COMPLETED'
    | 'FINAL_APPROVAL'
    | 'EXITED'
    | 'OFFBOARDING_COMPLETED'
    | 'REJECTED'
    | 'WITHDRAWN'
    | string;
  clearanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  fnfStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  exitInterviewStatus: 'PENDING' | 'COMPLETED' | string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail?: string;
    phone?: string;
    status: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; title: string } | null;
    branch?: { id: string; name: string } | null;
    reportingManager?: { id: string; firstName: string; lastName: string } | null;
  };
  clearanceItems?: ExitClearanceItem[];
  exitInterview?: ExitInterview | null;
  fnfSettlement?: ExitFnfSettlement | null;
  auditLogs?: ExitAuditLog[];
}

export interface ExitKpis {
  activeExits: number;
  pendingApprovals: number;
  clearancePending: number;
  fnfPending: number;
  exitsThisMonth: number;
  avgExitDays: number;
}

export const exitsApi = {
  getKpis: async (companyId?: string) =>
    (await apiClient.get<ExitKpis>('/employees/exits/kpis', { params: { companyId } })).data,

  list: async (params?: { search?: string; status?: string; companyId?: string }) =>
    (await apiClient.get<EmployeeExit[]>('/employees/exits', { params })).data,

  get: async (id: string) =>
    (await apiClient.get<EmployeeExit>(`/employees/exits/${id}`)).data,

  create: async (payload: Partial<EmployeeExit>) =>
    (await apiClient.post<EmployeeExit>('/employees/exits', payload)).data,

  updateStatus: async (id: string, payload: { status: string; remarks?: string; performedBy?: string }) =>
    (await apiClient.patch<EmployeeExit>(`/employees/exits/${id}/status`, payload)).data,

  adjustLwd: async (id: string, payload: { adjustedLwd: string; reason: string; performedBy?: string }) =>
    (await apiClient.patch<EmployeeExit>(`/employees/exits/${id}/adjust-lwd`, payload)).data,

  updateClearanceItem: async (
    itemId: string,
    payload: { status: string; remarks?: string; verifiedBy?: string },
  ) =>
    (await apiClient.patch<ExitClearanceItem>(`/employees/exits/clearance/${itemId}`, payload)).data,

  saveExitInterview: async (id: string, payload: Partial<ExitInterview>) =>
    (await apiClient.post<ExitInterview>(`/employees/exits/${id}/exit-interview`, payload)).data,

  saveFnfSettlement: async (id: string, payload: Partial<ExitFnfSettlement>) =>
    (await apiClient.post<ExitFnfSettlement>(`/employees/exits/${id}/fnf`, payload)).data,

  completeExit: async (id: string, performedBy?: string) =>
    (await apiClient.post<EmployeeExit>(`/employees/exits/${id}/complete-exit`, { performedBy })).data,

  remove: async (id: string) => (await apiClient.delete(`/employees/exits/${id}`)).data,
};
