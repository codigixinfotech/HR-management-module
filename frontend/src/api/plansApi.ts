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



