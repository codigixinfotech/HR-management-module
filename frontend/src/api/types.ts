export interface Company {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  shortName?: string | null;
  entityType?: string | null;
  parentCompanyId?: string | null;

  // Registration Details
  cin?: string | null;
  gst?: string | null;
  pan?: string | null;
  tan?: string | null;
  msme?: string | null;

  // Location
  country: string;
  state?: string | null;
  city?: string | null;
  timezone: string;
  currency: string;
  registeredAddress?: string | null;
  pincode?: string | null;

  // Contact Information
  email?: string | null;
  phone?: string | null;
  website?: string | null;

  // Organization
  businessUnit?: string | null;
  defaultBranchId?: string | null;

  isActive: boolean;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  businessUnit?: string | null;
  branchType?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  manager?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string | null;
  workingCalendar?: string | null;
  shiftGroup?: string | null;
  maxCapacity?: number | null;
  isActive: boolean;
  locations?: Location[];
  employees?: { id: string; employeeCode: string; firstName: string; lastName: string }[];
}

export interface Location {
  id: string;
  branchId: string;
  code: string;
  name: string;
  buildingName?: string | null;
  floor?: string | null;
  wing?: string | null;
  roomCabin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  gps?: string | null;
  workingHours?: string | null;
  shift?: string | null;
  isActive: boolean;
}

export interface Department {
  id: string;
  companyId: string;
  branchId?: string | null;
  code: string;
  name: string;
  type?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: { id: string; name: string } | null;
  manager?: string | null;
  costCenter?: string | null;
  headcountCapacity: number;
  annualBudget?: number | null;
  effectiveFrom: string;
  description?: string | null;
  isActive: boolean;
}

export interface Designation {
  id: string;
  companyId: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  code: string;
  title: string;
  grade?: string | null;
  jobFamily?: string | null;
  reportingDesignationId?: string | null;
  reportingDesignation?: { id: string; title: string } | null;
  employmentType?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  effectiveFrom: string;
  description?: string | null;
  isActive: boolean;
}

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'PROBATION' | 'NOTICE_PERIOD';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'INTERN' | 'CONSULTANT' | 'PART_TIME';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Employee {
  id: string;
  employeeCode: string;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  reportingManagerId?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  personalEmail?: string | null;
  workEmail?: string | null;
  phone?: string | null;
  dateOfJoining?: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;

  // New enterprise fields
  businessUnit?: string | null;
  location?: string | null;
  grade?: string | null;
  level?: string | null;
  shift?: string | null;
  costCenter?: string | null;
  employeeCategory?: string | null;
  workPhone?: string | null;
  workMode?: string | null;
  probationPeriod?: string | null;
  confirmationDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;

  // New onboarding sections
  maritalStatus?: string | null;
  nationality?: string | null;
  bloodGroup?: string | null;
  religion?: string | null;

  addressLine1?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  familyMemberName?: string | null;
  familyRelationship?: string | null;
  familyDob?: string | null;
  familyContact?: string | null;
  nomineeName?: string | null;
  nomineeRelationship?: string | null;
  nomineeShare?: number | null;

  educationQualification?: string | null;
  educationSpecialization?: string | null;
  educationInstitution?: string | null;
  educationUniversity?: string | null;
  educationPassingYear?: number | null;
  educationPercentage?: number | null;

  prevCompany?: string | null;
  prevJobTitle?: string | null;
  prevStartDate?: string | null;
  prevEndDate?: string | null;
  prevTotalExp?: string | null;
  prevReasonForLeaving?: string | null;

  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankBranchName?: string | null;
  bankAccountHolderName?: string | null;

  aadhaarNumber?: string | null;
  panNumber?: string | null;
  passportNumber?: string | null;
  kycStatus?: string | null;
  kycVerificationDate?: string | null;

  uanNumber?: string | null;
  pfMemberId?: string | null;
  esicNumber?: string | null;
  pfApplicable?: boolean | null;
  esicApplicable?: boolean | null;
  pfEsicJoiningDate?: string | null;

  salaryGrade?: string | null;
  salaryBand?: string | null;
  basicSalary?: number | null;
  hra?: number | null;
  conveyance?: number | null;
  specialAllowance?: number | null;
  otherAllowances?: number | null;
  grossSalary?: number | null;
  annualCtc?: number | null;
  salaryEffectiveFrom?: string | null;

  company?: { id: string; name: string };
  branch?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  reportingManager?: { id: string; firstName: string; lastName: string } | null;
  documents?: EmployeeDocument[];
  onboardingTasks?: OnboardingTask[];
  courseEnrollments?: any[];
  kpis?: any[];
  hrNotes?: any[];
  timelineEvents?: any[];
  faceTemplate?: string | null;
  facePhoto?: string | null;
  faceRegisteredAt?: string | null;
  faceRegisteredBy?: string | null;
  createdAt: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  docType: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export type ApprovalStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OnboardingTask {
  id: string;
  employeeId: string;
  title: string;
  description?: string | null;
  ownerType: string;
  status: ApprovalStatus;
  dueDate?: string | null;
  completedAt?: string | null;
}

export type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'ASSESSMENT_ASSIGNED'
  | 'ASSESSMENT_COMPLETED'
  | 'ASSESSMENT_PASSED'
  | 'ASSESSMENT_FAILED'
  | 'ON_HOLD'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'ONBOARDED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface AssessmentAssignment {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  jobId?: string;
  jobTitle?: string;
  templateId: string;
  templateName: string;
  assignedDate: string;
  dueDate: string;
  instructions?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_REVIEW' | 'EVALUATED' | 'PASSED' | 'FAILED';
  score?: string;
  scorePercent?: number;
  passingScorePercent?: number;
  evaluatedBy?: string;
  evaluationDate?: string;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  recommendation?: string;
  isOverridden?: boolean;
}

export interface CandidateScreening {
  id: string;
  candidateId: string;
  relevantExperienceYears?: number | null;
  relevantExperienceSummary?: string | null;
  currentLocation?: string | null;
  noticePeriod?: string | null;
  currentCtc?: number | null;
  expectedCtc?: number | null;
  highestQualification?: string | null;
  qualificationMatch?: 'YES' | 'NO' | 'PARTIAL' | string | null;
  skillsMatch?: 'YES' | 'NO' | 'PARTIAL' | string | null;
  technicalRating: number;
  communicationRating: number;
  profileMatchRating: number;
  overallScreeningScore: number;
  screeningRemarks?: string | null;
  rejectionReason?: string | null;
  screeningDecision: 'SHORTLIST' | 'HOLD' | 'REJECT';
  screenedBy: string;
  screenedAt: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface JobOpening {
  id: string;
  companyId: string;
  departmentId?: string | null;
  designationId?: string | null;
  manpowerRequisitionId?: string | null;
  requisitionCode?: string | null;
  manpowerPlanCode?: string | null;
  mrNumber?: string | null;
  title: string;
  description?: string | null;
  responsibilities?: string | null;
  numPositions: number;
  costCenter?: string | null;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | null;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  qualification?: string | null;
  experience?: string | null;
  requiredSkills?: string | null;
  workLocation?: string | null;
  reportingManagerId?: string | null;
  applicationDeadline?: string | null;
  status: 'DRAFT' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'CLOSED';
  publishedAt?: string | null;
  isActive: boolean;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  manpowerRequisition?: ManpowerRequisition | null;
  candidates?: Candidate[];
  _count?: { candidates: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  jobOpeningId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  resumePath?: string | null;
  qualification?: string | null;
  experience?: string | null;
  currentCompany?: string | null;
  currentLocation?: string | null;
  skills?: string | null;
  currentCtc?: number | null;
  expectedCtc?: number | null;
  noticePeriod?: string | null;
  coverLetter?: string | null;
  source?: string | null;
  stage: CandidateStage;
  aiMatchScore?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  jobOpening?: JobOpening;
  screenings?: CandidateScreening[];
  interviews?: CandidateInterview[];
  interviewEvaluations?: CandidateInterviewEvaluation[];
}

export type InterviewStatus =
  | 'READY_TO_SCHEDULE'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EVALUATION_PENDING'
  | 'EVALUATED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface CandidateInterviewPanel {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewerName: string;
  designation?: string | null;
  department?: string | null;
  panelRole: string;
  assignmentStatus: string;
  createdAt: string;
  interviewer?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; title: string } | null;
  };
}

export interface CandidateInterviewEvaluation {
  id: string;
  interviewId: string;
  candidateId: string;
  interviewerId: string;
  interviewerName: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  relevantExperience: number;
  roleKnowledge: number;
  overallRating: number;
  strengths?: string | null;
  weaknesses?: string | null;
  interviewNotes?: string | null;
  recommendation: 'Strong Hire' | 'Hire' | 'Hold' | 'Reject' | string;
  submittedAt: string;
  interviewer?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation?: { id: string; title: string } | null;
  };
}

export interface CandidateInterview {
  id: string;
  interviewCode: string;
  candidateId: string;
  jobOpeningId?: string | null;
  position: string;
  requisitionCode?: string | null;
  interviewDate: string;
  startTime: string;
  endTime?: string | null;
  interviewFormat: string;
  meetingLink?: string | null;
  notes?: string | null;
  status: InterviewStatus | string;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
  candidate?: Candidate;
  jobOpening?: JobOpening;
  panelMembers: CandidateInterviewPanel[];
  evaluations: CandidateInterviewEvaluation[];
}

export interface InterviewSummary {
  total: number;
  readyToSchedule: number;
  scheduled: number;
  todaysInterviews: number;
  completed: number;
  pendingEvaluation: number;
  evaluated: number;
}

export interface InterviewReminderItem {
  id: string;
  interviewCode: string;
  candidateName: string;
  position: string;
  requisitionCode?: string | null;
  interviewDate: string;
  startTime: string;
  interviewFormat: string;
  meetingLink?: string | null;
  status: string;
  panelRole: string;
  panelMembersCount: number;
  panelMembersNames: string[];
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'UNABLE_TO_COMPLETE' | 'CLOSED' | 'REOPENED';
export type TaskType = 'TASK' | 'FEATURE' | 'BUG' | 'RECRUITMENT' | 'WORKFLOW' | 'MAINTENANCE' | 'HR_REQUEST';

export interface TaskActivity {
  id: string;
  taskId: string;
  performedBy: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  progress?: number | null;
  remarks?: string | null;
  createdAt: string;
}

export interface EmployeeTask {
  id: string;
  taskCode: string;
  title: string;
  description?: string | null;
  taskType: TaskType | string;
  departmentName?: string | null;
  projectName?: string | null;
  priority: TaskPriority | string;
  assignedToId: string;
  assignedById: string;
  departmentId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  attachments?: string | null;
  instructions?: string | null;
  managerRemarks?: string | null;
  completionRemarks?: string | null;
  completionAttachment?: string | null;
  rejectionReason?: string | null;
  status: TaskStatus | string;
  progress: number;
  startedAt?: string | null;
  completedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; title: string } | null;
  };
  assignedBy?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation?: { id: string; title: string } | null;
  };
  activities?: TaskActivity[];
}

export interface TaskSummary {
  total: number;
  assigned: number;
  inProgress: number;
  onHold: number;
  completed: number;
  closed: number;
  dueToday: number;
  overdue: number;
}

export interface TaskRequest {
  id: string;
  requestCode: string;
  requestedById: string;
  requestTitle: string;
  requestType: string;
  description?: string | null;
  priority: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_TASK' | 'COMPLETED' | string;
  assignedTaskId?: string | null;
  reviewRemarks?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { id: string; name: string } | null;
  };
}

export interface TaskNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  counts: {
    totalCompanies: number;
    totalBranches: number;
    totalDepartments: number;
    totalEmployees: number;
    activeEmployees: number;
    onLeaveEmployees: number;
    openJobOpenings: number;
    pendingOnboardingTasks: number;
  };
  departmentDistribution: {
    departmentId: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  recruitmentPipeline: {
    stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED';
    count: number;
  }[];
  attendanceToday: {
    date: string;
    present: number;
    absent: number;
    onLeave: number;
    totalMarked: number;
    rate: number;
  };
  upcomingEvents: {
    id: string;
    type: 'birthday' | 'anniversary' | 'onboarding' | 'holiday';
    title: string;
    date: string;
    daysAway: number;
  }[];
  recentActivity: {
    id: string;
    text: string;
    tag: string;
    at: string;
  }[];
  compliance: {
    filedRate: number;
    filedTasks: number;
    totalTasks: number;
    latestPayrollRun: { month: number; year: number; status: string } | null;
  };
  modules: { key: string; label: string; path: string; phase: number; status: string }[];
}

export interface Role {
  id: string;
  companyId?: string | null;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: { permission: { id: string; code: string; module: string; action: string; description?: string | null } }[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
  description?: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  companyId?: string | null;
  isActive: boolean;
  company?: { id: string; name: string } | null;
  roles: { role: { id: string; name: string } }[];
}

export interface ShiftType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift: boolean;
  isActive: boolean;
}

export interface ShiftAssignment {
  id: string;
  companyId: string;
  employeeId: string;
  shiftTypeId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
  shiftType?: { id: string; name: string; startTime: string; endTime: string };
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  type: string;
  isActive: boolean;
}

export interface LeaveType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isPaid: boolean;
  annualQuota: number;
  carryForward: boolean;
  isActive: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  leaveType?: { id: string; name: string; code: string; isPaid: boolean };
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string | null;
  status: ApprovalStatus;
  approverId?: string | null;
  approverRemarks?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
  leaveType?: { id: string; name: string; code: string; isPaid: boolean };
  approver?: { id: string; firstName: string; lastName: string } | null;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF';

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  shiftTypeId?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  workedMinutes?: number | null;
  status: AttendanceStatus;
  source: string;
  remarks?: string | null;
  faceVerificationStatus?: string | null;
  faceMatchScore?: number | null;
  ipAddress?: string | null;
  ipVerificationStatus?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationVerificationStatus?: string | null;
  deviceType?: string | null;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
  shiftType?: { id: string; name: string } | null;
}

export type SalaryComponentType = 'EARNING' | 'DEDUCTION';
export type PayrollRunStatus = 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'PAID';

export interface SalaryComponent {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: SalaryComponentType;
  isStatutory: boolean;
  isActive: boolean;
}

export interface EmployeeSalaryComponent {
  id: string;
  employeeId: string;
  salaryComponentId: string;
  monthlyAmount: number;
  effectiveFrom: string;
  salaryComponent?: { id: string; code: string; name: string; type: SalaryComponentType; isStatutory: boolean };
}

export interface PayrollRun {
  id: string;
  companyId: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  processedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  _count?: { payslips: number };
}

export interface PayslipComponent {
  id: string;
  payslipId: string;
  salaryComponentId?: string | null;
  name: string;
  type: SalaryComponentType;
  amount: number;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  grossEarnings: number;
  pf: number;
  esic: number;
  professionalTax: number;
  otherDeductions: number;
  netPay: number;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; employeeCode: string };
  components?: PayslipComponent[];
}

export type ComplianceFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUALLY' | 'ONE_TIME';
export type ComplianceStatus = 'PENDING' | 'IN_PROGRESS' | 'FILED' | 'OVERDUE' | 'WAIVED';

export interface ComplianceType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  category: string;
  frequency: ComplianceFrequency;
  description?: string | null;
  isActive: boolean;
}

export interface ComplianceTask {
  id: string;
  companyId: string;
  complianceTypeId: string;
  periodLabel: string;
  dueDate: string;
  status: ComplianceStatus;
  filedDate?: string | null;
  filedById?: string | null;
  remarks?: string | null;
  complianceType?: { id: string; name: string; code: string; category: string; frequency: ComplianceFrequency };
  filedBy?: { id: string; firstName: string; lastName: string } | null;
}

export type AssetStatus = 'IN_STOCK' | 'ALLOCATED' | 'UNDER_MAINTENANCE' | 'RETIRED';

export interface Asset {
  id: string;
  companyId: string;
  assetTag: string;
  name: string;
  category: string;
  value?: number | null;
  status: AssetStatus;
  currentEmployeeId?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  notes?: string | null;
  currentEmployee?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  allocations?: AssetAllocation[];
  maintenanceLogs?: AssetMaintenanceRecord[];
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  employeeId: string;
  allocatedAt: string;
  returnedAt?: string | null;
  remarks?: string | null;
}

export interface AssetMaintenanceRecord {
  id: string;
  assetId: string;
  issue: string;
  startDate: string;
  endDate?: string | null;
  cost?: number | null;
  asset?: { id: string; assetTag: string; name: string };
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SafetyIncident {
  id: string;
  companyId: string;
  location: string;
  incidentType: string;
  severity: IncidentSeverity;
  occurredAt: string;
  description?: string | null;
  correctiveAction?: string | null;
  status: IncidentStatus;
  reportedById?: string | null;
  reportedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface PpeItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  stockQuantity: number;
}

export interface PpeIssuance {
  id: string;
  ppeItemId: string;
  employeeId: string;
  quantity: number;
  issuedAt: string;
  ppeItem?: { id: string; name: string };
  employee?: { id: string; firstName: string; lastName: string };
}

export interface SafetyAudit {
  id: string;
  companyId: string;
  location: string;
  auditDate: string;
  score: number;
  auditor: string;
  findings?: string | null;
}

export interface ManpowerPlan {
  id: string;
  code?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  departmentName: string;
  costCenter: string;
  role: string;
  budgeted: number;
  active: number;
  plannedHires: number;
  quarter: string;
  reason: string;
  status: 'UNDER-STAFFED' | 'CAP-REACHED' | 'ON-TRACK';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManpowerRequisition {
  id: string;
  mrNumber: string;
  manpowerPlanId?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  departmentName: string;
  costCenter: string;
  designationId?: string | null;
  role: string;
  numOpenings: number;
  joiningDate: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  minSalary?: number | null;
  maxSalary?: number | null;
  qualification: string;
  experience: string;
  requiredSkills?: string | null;
  workLocation: string;
  reportingManagerId?: string | null;
  requestorName: string;
  requestDate: string;
  reason: string;
  comments?: string | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

