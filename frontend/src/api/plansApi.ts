import { apiClient } from '@/lib/api-client';

export interface ErpModuleCatalogItem {
  key: string;
  name: string;
  category: 'Core HR' | 'Workforce' | 'Payroll & Finance' | 'Compliance' | 'Talent & Learning' | 'Operations & Platform';
  description: string;
  icon: string;
  defaultPricePerMonth: number;
  features: string[];
}

export const ERP_25_MODULE_CATALOG: ErpModuleCatalogItem[] = [
  { key: 'employee-management', name: 'Employee Management', category: 'Core HR', description: 'Complete employee lifecycle records, profiles, digital dossiers, and employment history.', icon: 'Users', defaultPricePerMonth: 499, features: ['Employee Directory', 'Employee Profile'] },
  { key: 'organization', name: 'Organization & Structure', category: 'Core HR', description: 'Multi-entity corporate structure, legal branches, cost centers, departments and designations.', icon: 'Building2', defaultPricePerMonth: 399, features: ['Org Chart', 'Departments'] },
  { key: 'recruitment', name: 'Recruitment (ATS)', category: 'Core HR', description: 'Job requisition workflow, candidate pipeline tracking, resume parsing, and interview scheduling.', icon: 'UserPlus', defaultPricePerMonth: 699, features: ['Job Boards', 'ATS Pipeline'] },
  { key: 'onboarding', name: 'Onboarding & Induction', category: 'Core HR', description: 'New hire pre-boarding, welcome tasks, document collection, and provisioning workflows.', icon: 'Sparkles', defaultPricePerMonth: 299, features: ['Onboarding Checklist'] },
  { key: 'attendance-leave', name: 'Attendance & Leave', category: 'Workforce', description: 'Live punch tracking, biometric sync, geo-fenced mobile punches, leave policies and accruals.', icon: 'Clock', defaultPricePerMonth: 499, features: ['Attendance', 'Leaves'] },
  { key: 'shift-planning', name: 'Shift & Roster Planning', category: 'Workforce', description: 'Dynamic rotational shift schedules, department rosters, shift swaps, and break rules.', icon: 'CalendarClock', defaultPricePerMonth: 399, features: ['Shift Roster'] },
  { key: 'workforce-planning', name: 'Workforce Planning', category: 'Workforce', description: 'Headcount forecasting, departmental staffing budgets, and workforce capacity models.', icon: 'LineChart', defaultPricePerMonth: 499, features: ['Capacity Planning'] },
  { key: 'machine-allocation', name: 'Machine Allocation', category: 'Workforce', description: 'Shopfloor operator assignment, machine station mapping, and production shift logs.', icon: 'Cpu', defaultPricePerMonth: 399, features: ['Machine Operator Map'] },
  { key: 'contractor-management', name: 'Contractor Management', category: 'Workforce', description: 'Third-party labour contractor tracking, gate pass security, and compliance verification.', icon: 'Briefcase', defaultPricePerMonth: 399, features: ['Contract Labour'] },
  { key: 'payroll', name: 'Payroll Processing', category: 'Payroll & Finance', description: 'Automated gross-to-net salary runs, statutory deductions, bank transfer advice, and tax calculation.', icon: 'Receipt', defaultPricePerMonth: 999, features: ['Payroll Run', 'Payslips'] },
  { key: 'salary-revision', name: 'Salary Revision', category: 'Payroll & Finance', description: 'Appraisal increments, CTC revisions, band adjustments, and revision letter automation.', icon: 'TrendingUp', defaultPricePerMonth: 349, features: ['Increment Matrix'] },
  { key: 'loans-advances', name: 'Loans & Advances', category: 'Payroll & Finance', description: 'Employee loan requests, EMI amortization schedules, and automated payroll deductions.', icon: 'CreditCard', defaultPricePerMonth: 299, features: ['Loan EMI'] },
  { key: 'reimbursements', name: 'Expense Reimbursements', category: 'Payroll & Finance', description: 'Employee claims submission, receipt scanning, managerial approvals, and payroll payout sync.', icon: 'ReceiptText', defaultPricePerMonth: 349, features: ['Expense Claims'] },
  { key: 'payslips', name: 'Digital Payslips', category: 'Payroll & Finance', description: 'Digitally signed password-protected payslips, ESS download, and automated email distribution.', icon: 'FileText', defaultPricePerMonth: 249, features: ['Password PDF Payslips'] },
  { key: 'pf-esic', name: 'PF & ESIC Compliance', category: 'Compliance', description: 'EPFO monthly return ECR generation, ESIC contribution filing, and statutory challan reconciliation.', icon: 'ShieldCheck', defaultPricePerMonth: 449, features: ['PF ECR', 'ESIC'] },
  { key: 'statutory-taxes', name: 'Professional Tax & TDS', category: 'Compliance', description: 'State-wise Professional Tax calculation, TDS Form 16 generation, and 24Q reporting.', icon: 'Landmark', defaultPricePerMonth: 399, features: ['PT Slabs', 'Form 16'] },
  { key: 'labour-compliance', name: 'Labour Compliance & Audits', category: 'Compliance', description: 'Factory Act registers, minimum wage rate validation, bonus act records, and audit inspection logs.', icon: 'FileCheck', defaultPricePerMonth: 349, features: ['Factory Act Registers'] },
  { key: 'performance', name: 'Performance (KPI / OKR)', category: 'Talent & Learning', description: 'Objective & Key Results (OKR), 360-degree feedback reviews, competency assessment, and 9-box grid.', icon: 'Target', defaultPricePerMonth: 599, features: ['OKRs', '360 Feedback'] },
  { key: 'learning', name: 'Learning (LMS)', category: 'Talent & Learning', description: 'Corporate training programs, external course requests, seat purchases, certificates, and skills.', icon: 'GraduationCap', defaultPricePerMonth: 799, features: ['Course Catalog', 'LMS'] },
  { key: 'employee-experience', name: 'Employee Experience (ESS)', category: 'Talent & Learning', description: 'Self-service portal, pulse sentiment surveys, peer kudos rewards, announcements, and HR helpdesk.', icon: 'Smile', defaultPricePerMonth: 399, features: ['ESS Portal', 'Kudos'] },
  { key: 'asset-management', name: 'Asset Management', category: 'Operations & Platform', description: 'Fixed asset registry, hardware/software assignment, return logistics, and maintenance depreciation.', icon: 'Boxes', defaultPricePerMonth: 449, features: ['Hardware Registry'] },
  { key: 'travel-expense', name: 'Travel & Expense', category: 'Operations & Platform', description: 'Business travel bookings, per-diem policy allowances, mileage claims, and multi-currency expense.', icon: 'Plane', defaultPricePerMonth: 449, features: ['Travel Desk Bookings'] },
  { key: 'safety-ehs', name: 'Safety & EHS', category: 'Operations & Platform', description: 'Workplace safety incident reporting, PPE issuance tracking, safety training, and OSHA audits.', icon: 'HeartPulse', defaultPricePerMonth: 349, features: ['Safety Incident Log'] },
  { key: 'ai-intelligence', name: 'AI Intelligence Center', category: 'Operations & Platform', description: 'AI resume ranking, attendance anomaly detection, predictive churn alerts, and HR assistant chatbot.', icon: 'Sparkles', defaultPricePerMonth: 899, features: ['AI Resume Ranker'] },
  { key: 'integrations-iot', name: 'IoT & ERP Integrations', category: 'Operations & Platform', description: 'Biometric device gateway, SAP/Tally accounting connectors, REST API tokens, and webhooks.', icon: 'Network', defaultPricePerMonth: 699, features: ['Biometric Gateway'] },
];

export interface PlanPackageItem {
  id: string;
  code: string;
  name: string;
  type: 'STANDARD_PLAN' | 'CUSTOM_PACKAGE' | 'ADD_ON';
  category?: string;
  description?: string;
  badge?: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  price: number;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  isActive: boolean;
  isPopular: boolean;
  maxEmployees: number;
  maxDepartments: number;
  maxLocations: number;
  maxStorageGb: number;
  maxLmsLearners: number;
  includedModules: string[];
  featureToggles?: Record<string, boolean>;
  sortOrder: number;
  createdAt: string;
  _count?: {
    subscriptions: number;
  };
}

export interface PlanListResponse {
  items: PlanPackageItem[];
  counts: {
    total: number;
    totalPlansAndPackages?: number;
    plans: number;
    activePlans: number;
    customPackages: number;
    addons: number;
    activeSubscribers?: number;
    monthlyRevenue?: number;
    totalModules: number;
  };
}

export interface SubscriberItem {
  subscriptionId: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  industry: string;
  city: string;
  adminEmail: string;
  adminRole?: string;
  planName?: string;
  includedModules?: string[];
  billingCycle: string;
  price: number;
  status: string;
  startDate: string;
  validUntil: string;
  paymentStatus: string;
  paymentReference: string;
  isAddon: boolean;
  invitationUrl?: string;
  invitationStatus?: 'DISPATCHED' | 'ACTIVATED' | 'PENDING';
}


export interface ModuleEntitlementItem extends ErpModuleCatalogItem {
  isEnabled: boolean;
  source: 'PLAN' | 'ADDON' | 'OVERRIDE' | 'NONE';
}

export interface CompanySubscriptionResponse {
  company: {
    id: string;
    code: string;
    name: string;
    legalName?: string;
    city?: string;
    currency: string;
  };
  subscription: {
    id: string;
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
    billingCycle: string;
    price: number;
    startDate: string;
    endDate: string;
    validUntil: string;
    autoRenew: boolean;
    daysRemaining: number;
  } | null;
  plan: PlanPackageItem | null;
  activeAddonPackages: PlanPackageItem[];
  usage: {
    employees: { current: number; max: number };
    departments: { current: number; max: number };
    locations: { current: number; max: number };
    storage: { currentGb: number; maxGb: number };
    lmsLearners: { current: number; max: number };
  };
  moduleEntitlementMatrix: ModuleEntitlementItem[];
  totalModulesCount: number;
  enabledModulesCount: number;
}

export const plansApi = {
  list: async (params?: { type?: string; search?: string; status?: string }) =>
    (await apiClient.get<PlanListResponse>('/plans', { params })).data,

  getModuleCatalog: async () =>
    (await apiClient.get<ErpModuleCatalogItem[]>('/plans/catalog/modules')).data,

  getById: async (id: string) =>
    (await apiClient.get<PlanPackageItem>(`/plans/${id}`)).data,

  create: async (payload: Partial<PlanPackageItem>) =>
    (await apiClient.post<PlanPackageItem>('/plans', payload)).data,

  update: async (id: string, payload: Partial<PlanPackageItem>) =>
    (await apiClient.patch<PlanPackageItem>(`/plans/${id}`, payload)).data,

  duplicate: async (id: string) =>
    (await apiClient.post<PlanPackageItem>(`/plans/${id}/duplicate`)).data,

  toggleStatus: async (id: string) =>
    (await apiClient.patch<PlanPackageItem>(`/plans/${id}/toggle-status`)).data,

  delete: async (id: string) =>
    (await apiClient.delete(`/plans/${id}`)).data,
};

export interface SubscribeNewCompanyPayload {
  companyName: string;
  companyCode: string;
  industry: string;
  registeredAddress: string;
  contactPerson: string;
  companyEmail: string;
  contactPhone: string;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;

  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminUsername?: string;
  sendInvitation?: boolean;
  invitationDelivery?: string[];

  planId: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  price?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'COMPLIMENTARY';
  paymentReference?: string;
}

export interface CheckActiveSubscriptionResponse {
  hasActive: boolean;
  subscription: {
    id: string;
    planName: string;
    billingCycle: string;
    price: number;
    startDate: string;
    validUntil: string;
  } | null;
}

export interface SubscribeNewCompanyResponse {
  success: boolean;
  company: {
    id: string;
    code: string;
    name: string;
    email?: string;
  };
  adminUser: {
    id: string;
    email: string;
    name: string;
    mustResetPassword: boolean;
    role: string;
  };
  subscription: {
    id: string;
    planName: string;
    billingCycle: string;
    price: number;
    validUntil: string;
    paymentStatus: string;
    paymentReference: string;
  };
  invitation: {
    sent: boolean;
    delivery: string[];
    email: string;
    invitationUrl: string;
    notice: string;
  };
}

export const subscriptionsApi = {
  getCompanySubscription: async (companyId: string) =>
    (await apiClient.get<CompanySubscriptionResponse>(`/subscriptions/company/${companyId}`)).data,

  checkActiveSubscription: async (companyId: string, planId: string) =>
    (await apiClient.get<CheckActiveSubscriptionResponse>(`/subscriptions/company/${companyId}/check-plan/${planId}`)).data,

  getSubscribersForPlan: async (planId: string) =>
    (await apiClient.get<SubscriberItem[]>(`/subscriptions/plan/${planId}/subscribers`)).data,

  subscribeCompany: async (payload: {
    companyId: string;
    planId: string;
    billingCycle?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    autoRenew?: boolean;
    price?: number;
    paymentStatus?: string;
    paymentReference?: string;
  }) => (await apiClient.post('/subscriptions/subscribe', payload)).data,

  subscribeNewCompany: async (payload: SubscribeNewCompanyPayload) =>
    (await apiClient.post<SubscribeNewCompanyResponse>('/subscriptions/subscribe-new-company', payload)).data,

  changePlan: async (companyId: string, payload: { planId: string; billingCycle?: string; autoRenew?: boolean }) =>
    (await apiClient.post(`/subscriptions/company/${companyId}/change-plan`, payload)).data,

  manageAddons: async (companyId: string, payload: { addonIds: string[] }) =>
    (await apiClient.post(`/subscriptions/company/${companyId}/addons`, payload)).data,

  resendInvitation: async (payload: { companyId: string; email: string }) =>
    (await apiClient.post<{ success: boolean; message: string; invitationUrl: string }>('/subscriptions/resend-invitation', payload)).data,

  renew: async (companyId: string, payload?: { durationMonths?: number }) =>
    (await apiClient.post(`/subscriptions/company/${companyId}/renew`, payload || {})).data,
};



