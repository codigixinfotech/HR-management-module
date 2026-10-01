// ============================================================================
// EHCM Payroll Module - Sub-Module 2: Payroll Processing Types
// ============================================================================

export type PayrollRunType = 'REGULAR' | 'OFF_CYCLE' | 'FNF';

export type PayrollRunStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'LOCKED'
  | 'PAID';

export interface PayrollRunItem {
  id: string;
  runCode: string;
  month: number;
  monthName: string;
  year: number;
  runType: PayrollRunType;
  title: string;
  status: PayrollRunStatus;
  headcount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerCost: number;
  calculatedAt?: string;
  calculatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  lockedAt?: string;
  lockedBy?: string;
  paidAt?: string;
  paidBy?: string;
  isBankTransferDone?: boolean;
}

export interface PreRunCheckItem {
  id: string;
  category: 'SALARY' | 'BANK' | 'PAN' | 'ATTENDANCE' | 'EMPLOYEE';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  affectedCount: number;
  affectedEmployees: Array<{ id: string; name: string; code: string; detail: string }>;
  isResolved: boolean;
}

export interface AttendanceLopRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  totalCalendarDays: number;
  payableDays: number;
  presentDays: number;
  paidLeaves: number;
  lopDays: number;
  weeklyOffs: number;
  holidays: number;
  attendanceFinalized: boolean;
  proRataFactor: number; // e.g. 28/30 = 0.933
}

export interface VariableInputRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  overtimeHours: number;
  overtimeAmount: number;
  performanceBonus: number;
  salesIncentive: number;
  revisionArrears: number;
  oneTimeEarnings: number;
  oneTimeDeductions: number;
  loanEmiDeduction: number;
  reimbursementPayout: number;
}

export interface EmployeePayrollReviewRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  grade: string;
  panNumber: string;
  bankAccount: string;
  templateCode: string;
  annualCtc: number;
  monthlyCtc: number;
  paidDays: number;
  lopDays: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossPay: number;
  employeePf: number;
  employeeEsi: number;
  professionalTax: number;
  tds: number;
  loanEmi: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  employerPf: number;
  employerEsi: number;
  employerGratuity: number;
  totalEmployerCost: number;
  previousMonthNet: number;
  varianceAmount: number;
  variancePercentage: number;
  hasException: boolean;
  exceptionReason?: string;
  isSalaryHeld: boolean;
  holdReason?: string;
}

export interface FnfSettlementRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  resignationDate: string;
  lastWorkingDay: string;
  noticePeriodRequiredDays: number;
  noticePeriodServedDays: number;
  shortfallDays: number;
  proRatedSalary: number;
  leaveEncashmentDays: number;
  leaveEncashmentAmount: number;
  noticePayRecoveryAmount: number;
  gratuityAmount: number;
  bonusAmount: number;
  outstandingLoanBalance: number;
  finalTds: number;
  totalEarnings: number;
  totalRecoveries: number;
  netSettlementPayable: number;
  settlementStatus: 'DRAFT' | 'APPROVED' | 'DISBURSED';
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'NEFT';
}
