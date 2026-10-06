import { api } from './client';

export interface ContractorDashboard {
  totalPlantWorkforce: number;
  permanentWorkforce: number;
  contractWorkforce: number;
  activeVendors: number;
  activeContracts: number;
  activeWorkers: number;
  deployedWorkers: number;
  availableWorkerCapacity: number;
  expiringContracts: number;
  expiredContracts: number;
  validComplianceCount: number;
  expiringComplianceCount: number;
  expiredComplianceCount: number;
  complianceScore: string;
}

export interface ContractorVendor {
  id: string;
  company_id: string;
  branch_id?: string | null;
  vendor_code: string;
  legal_name: string;
  display_name?: string | null;
  vendor_type: string;
  registration_number?: string | null;
  gstin?: string | null;
  pan?: string | null;
  registered_address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  primary_contact_name: string;
  primary_contact_phone: string;
  primary_contact_email: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRING' | 'SUSPENDED' | 'EXPIRED' | 'TERMINATED';
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  branch_name?: string;
  company_name?: string;
  active_contracts_count?: number;
  total_workers_count?: number;
  deployed_headcount?: number;
  clra_license?: string;
  clra_status?: string;
  nearest_contract_expiry?: string;
  contracts?: ContractorContract[];
  compliance?: ContractorCompliance[];
  documents?: ContractorDocument[];
  history?: ContractorVendorHistory[];
}

export interface ContractorContract {
  id: string;
  vendor_id: string;
  company_id: string;
  branch_id?: string | null;
  contract_number: string;
  contract_start_date: string;
  contract_end_date: string;
  contract_type: string;
  scope_of_work: string;
  department_id?: string | null;
  maximum_headcount: number;
  billing_type?: string | null;
  billing_rate?: number | null;
  payment_terms?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED' | 'TERMINATED' | 'RENEWED';
  renewal_required: boolean;
  renewal_date?: string | null;
  contract_document_id?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  vendor_code?: string;
  department_name?: string;
  branch_name?: string;
  deployed_headcount?: number;
  available_capacity?: number;
  workers_enrolled?: number;
}

export interface ContractorWorker {
  id: string;
  vendor_id: string;
  contract_id: string;
  company_id: string;
  branch_id?: string | null;
  worker_code: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  mobile: string;
  email?: string | null;
  government_id_type?: string | null;
  government_id_number?: string | null;
  joining_date: string;
  exit_date?: string | null;
  department_id?: string | null;
  designation?: string | null;
  skill: string;
  skill_level: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'EXITED' | 'SUSPENDED';
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  vendor_code?: string;
  contract_number?: string;
  department_name?: string;
  branch_name?: string;
  current_deployment_id?: string | null;
  deployment_start_date?: string | null;
  production_line_id?: string | null;
  machine_id?: string | null;
  shift_id?: string | null;
  current_line_name?: string | null;
  current_machine_name?: string | null;
  shift_name?: string | null;
  deployments?: WorkerDeployment[];
}

export interface WorkerDeployment {
  id: string;
  worker_id: string;
  vendor_id: string;
  contract_id: string;
  company_id: string;
  branch_id?: string | null;
  department_id?: string | null;
  production_line_id?: string | null;
  machine_id?: string | null;
  shift_id?: string | null;
  designation?: string | null;
  deployment_type: string;
  start_date: string;
  end_date?: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED' | 'CANCELLED';
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  worker_code?: string;
  first_name?: string;
  last_name?: string;
  worker_skill?: string;
  vendor_name?: string;
  vendor_code?: string;
  contract_number?: string;
  department_name?: string;
  branch_name?: string;
  line_name?: string;
  line_code?: string;
  machine_name?: string;
  machine_code?: string;
  shift_name?: string;
  shift_code?: string;
  shift_start_time?: string;
  shift_end_time?: string;
}

export interface ContractorCompliance {
  id: string;
  vendor_id: string;
  contract_id?: string | null;
  company_id: string;
  branch_id?: string | null;
  compliance_type: 'CLRA' | 'PF' | 'ESIC' | 'GST' | 'LABOUR_LICENSE' | 'INSURANCE' | 'OTHER';
  license_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority?: string | null;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verified_by?: string | null;
  verified_at?: string | null;
  document_id?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  vendor_code?: string;
  contract_number?: string;
  branch_name?: string;
  days_remaining?: number;
}

export interface ContractorDocument {
  id: string;
  vendor_id: string;
  contract_id?: string | null;
  worker_id?: string | null;
  document_type: string;
  document_name: string;
  file_name: string;
  file_url: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  verification_status: string;
  verified_by?: string | null;
  verified_at?: string | null;
  uploaded_by?: string | null;
  uploaded_at: string;
}

export interface ContractorVendorHistory {
  id: string;
  vendor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: string | null;
  new_value?: string | null;
  reason?: string | null;
  performed_by?: string | null;
  performed_at: string;
}

// ─────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────
export const contractorApi = {
  // Dashboard
  getDashboard: (companyId?: string, branchId?: string) =>
    api.get<ContractorDashboard>('/workforce/contractors/dashboard', {
      params: { companyId, branchId },
    }),

  // Vendors
  getVendors: (params?: {
    companyId?: string;
    branchId?: string;
    status?: string;
    vendorType?: string;
    search?: string;
  }) => api.get<ContractorVendor[]>('/workforce/contractors/vendors', { params }),

  getVendorById: (id: string) =>
    api.get<ContractorVendor>(`/workforce/contractors/vendors/${id}`),

  createVendor: (data: any) =>
    api.post<ContractorVendor>('/workforce/contractors/vendors', data),

  updateVendor: (id: string, data: any) =>
    api.put<ContractorVendor>(`/workforce/contractors/vendors/${id}`, data),

  updateVendorStatus: (id: string, status: string, reason?: string) =>
    api.patch<ContractorVendor>(`/workforce/contractors/vendors/${id}/status`, { status, reason }),

  getVendorHistory: (id: string) =>
    api.get<ContractorVendorHistory[]>(`/workforce/contractors/vendors/${id}/history`),

  getVendorContracts: (id: string) =>
    api.get<ContractorContract[]>(`/workforce/contractors/vendors/${id}/contracts`),

  getVendorDocuments: (id: string, params?: { contractId?: string; workerId?: string }) =>
    api.get<ContractorDocument[]>(`/workforce/contractors/vendors/${id}/documents`, { params }),

  // Contracts
  getContracts: (params?: {
    companyId?: string;
    branchId?: string;
    vendorId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  }) => api.get<ContractorContract[]>('/workforce/contractors/contracts', { params }),

  getContractById: (id: string) =>
    api.get<ContractorContract>(`/workforce/contractors/contracts/${id}`),

  createContract: (data: any) =>
    api.post<ContractorContract>('/workforce/contractors/contracts', data),

  updateContract: (id: string, data: any) =>
    api.put<ContractorContract>(`/workforce/contractors/contracts/${id}`, data),

  renewContract: (id: string, data: { newEndDate: string; maximumHeadcount?: number; billingRate?: number; remarks?: string }) =>
    api.post<ContractorContract>(`/workforce/contractors/contracts/${id}/renew`, data),

  // Workers
  getWorkers: (params?: {
    companyId?: string;
    branchId?: string;
    vendorId?: string;
    contractId?: string;
    departmentId?: string;
    skill?: string;
    status?: string;
    search?: string;
  }) => api.get<ContractorWorker[]>('/workforce/contractors/workers', { params }),

  getWorkerById: (id: string) =>
    api.get<ContractorWorker>(`/workforce/contractors/workers/${id}`),

  createWorker: (data: any) =>
    api.post<ContractorWorker>('/workforce/contractors/workers', data),

  updateWorker: (id: string, data: any) =>
    api.put<ContractorWorker>(`/workforce/contractors/workers/${id}`, data),

  // Deployments
  getDeployments: (params?: {
    companyId?: string;
    branchId?: string;
    vendorId?: string;
    contractId?: string;
    workerId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  }) => api.get<WorkerDeployment[]>('/workforce/contractors/deployments', { params }),

  getDeploymentById: (id: string) =>
    api.get<WorkerDeployment>(`/workforce/contractors/deployments/${id}`),

  createDeployment: (data: any) =>
    api.post<WorkerDeployment>('/workforce/contractors/deployments', data),

  completeDeployment: (id: string, remarks?: string) =>
    api.patch<WorkerDeployment>(`/workforce/contractors/deployments/${id}/complete`, { remarks }),

  transferDeployment: (id: string, data: { transferDate: string; departmentId?: string | null; productionLineId?: string | null; machineId?: string | null; shiftId?: string | null; reason?: string }) =>
    api.patch<WorkerDeployment>(`/workforce/contractors/deployments/${id}/transfer`, data),

  // Compliance
  getCompliance: (params?: {
    companyId?: string;
    branchId?: string;
    vendorId?: string;
    contractId?: string;
    complianceType?: string;
    status?: string;
    search?: string;
  }) => api.get<ContractorCompliance[]>('/workforce/contractors/compliance', { params }),

  getComplianceById: (id: string) =>
    api.get<ContractorCompliance>(`/workforce/contractors/compliance/${id}`),

  createCompliance: (data: any) =>
    api.post<ContractorCompliance>('/workforce/contractors/compliance', data),

  verifyCompliance: (id: string, data: { status: string; remarks?: string }) =>
    api.patch<ContractorCompliance>(`/workforce/contractors/compliance/${id}/verify`, data),

  // Documents
  getDocuments: (vendorId: string, params?: { contractId?: string; workerId?: string }) =>
    api.get<ContractorDocument[]>('/workforce/contractors/documents', { params: { vendorId, ...params } }),

  createDocument: (data: any) =>
    api.post<ContractorDocument>('/workforce/contractors/documents', data),

  deleteDocument: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/workforce/contractors/documents/${id}`),
};
