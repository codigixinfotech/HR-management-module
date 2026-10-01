import { apiClient } from '@/lib/api-client';
import type { Asset, AssetMaintenanceRecord, AssetRequest, AssetMaintenanceRequest, AssetRecoveryRecord } from './types';

export const assetsApi = {
  list: async (companyId?: string, branchId?: string) =>
    (await apiClient.get<Asset[]>('/asset-management/assets', { params: { companyId, branchId } })).data,
  get: async (id: string) => (await apiClient.get<Asset>(`/asset-management/assets/${id}`)).data,
  create: async (payload: Partial<Asset>) => (await apiClient.post<Asset>('/asset-management/assets', payload)).data,
  update: async (id: string, payload: Partial<Asset>) =>
    (await apiClient.patch<Asset>(`/asset-management/assets/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/asset-management/assets/${id}`)).data,
  allocate: async (
    id: string,
    payload: {
      employeeId: string;
      allocationDate?: string;
      allocationType?: string;
      location?: string;
      expectedReturnDate?: string;
      remarks?: string;
    }
  ) => (await apiClient.post<Asset>(`/asset-management/assets/${id}/allocate`, payload)).data,
  returnAsset: async (
    id: string,
    payload?: {
      returnDate?: string;
      returnReason: string;
      otherReason?: string;
      returnedBy?: string;
      returnLocation?: string;
      condition: string;
      accessoriesReturned?: string;
      remarks?: string;
    }
  ) => (await apiClient.post<Asset>(`/asset-management/assets/${id}/return`, payload)).data,
};

export const assetMaintenanceApi = {
  list: async (assetId?: string, companyId?: string, branchId?: string) =>
    (await apiClient.get<AssetMaintenanceRecord[]>('/asset-management/maintenance', { params: { assetId, companyId, branchId } })).data,
  listRecoveries: async (params?: { companyId?: string; branchId?: string; employeeId?: string }) =>
    (await apiClient.get<AssetRecoveryRecord[]>('/asset-management/maintenance/recoveries', { params })).data,
  create: async (payload: {
    assetId: string;
    issue: string;
    priority?: string;
    maintenanceType?: string;
    vendor?: string;
    warrantyClaim?: boolean;
    startDate: string;
    cost?: number;
    notes?: string;
    costResponsibility?: string;
    recoveryEmployeeId?: string;
    recoveryAmount?: number;
    deductionMethod?: string;
    numberOfInstallments?: number;
    monthlyDeduction?: number;
    payrollStartMonth?: string;
  }) => (await apiClient.post<AssetMaintenanceRecord>('/asset-management/maintenance', payload)).data,
  complete: async (
    id: string,
    payload?: {
      completionDate?: string;
      finalCondition?: string;
      actualCost?: number;
      vendor?: string;
      workPerformed?: string;
      partsUsed?: string;
      qcStatus?: string;
      repairNotes?: string;
      returnDestination?: 'EMPLOYEE' | 'STOCK';
    }
  ) => (await apiClient.post<AssetMaintenanceRecord>(`/asset-management/maintenance/${id}/complete`, payload)).data,
};

export const assetRequestsApi = {
  list: async (params?: {
    companyId?: string;
    branchId?: string;
    status?: string;
    category?: string;
    employeeId?: string;
  }) =>
    (await apiClient.get<AssetRequest[]>('/asset-management/requests', { params })).data,
  getMyRequests: async () =>
    (await apiClient.get<AssetRequest[]>('/asset-management/requests/my-requests')).data,
  getMyAssets: async () =>
    (await apiClient.get<Asset[]>('/asset-management/requests/my-assets')).data,
  get: async (id: string) =>
    (await apiClient.get<AssetRequest>(`/asset-management/requests/${id}`)).data,
  create: async (payload: Partial<AssetRequest>) =>
    (await apiClient.post<AssetRequest>('/asset-management/requests', payload)).data,
  update: async (id: string, payload: Partial<AssetRequest>) =>
    (await apiClient.patch<AssetRequest>(`/asset-management/requests/${id}`, payload)).data,
  review: async (
    id: string,
    payload: {
      action: 'APPROVE' | 'REJECT' | 'SENT_BACK';
      rejectionReason?: string;
      remarks?: string;
    }
  ) => (await apiClient.post<AssetRequest>(`/asset-management/requests/${id}/review`, payload)).data,
  markWaitingProcurement: async (id: string) =>
    (await apiClient.post<AssetRequest>(`/asset-management/requests/${id}/waiting-procurement`)).data,
  allocate: async (
    id: string,
    payload: {
      assetId: string;
      allocationDate?: string;
      expectedReturnDate?: string;
      allocationNotes?: string;
    }
  ) => (await apiClient.post<AssetRequest>(`/asset-management/requests/${id}/allocate`, payload)).data,
};

export const assetMaintenanceRequestsApi = {
  create: async (payload: {
    assetId: string;
    issueTitle: string;
    issueDescription?: string;
    priority?: string;
  }) =>
    (await apiClient.post<AssetMaintenanceRequest>('/asset-management/maintenance-requests', payload)).data,

  listMyRequests: async () =>
    (await apiClient.get<AssetMaintenanceRequest[]>('/asset-management/maintenance-requests/my')).data,

  list: async (params?: {
    companyId?: string;
    branchId?: string;
    status?: string;
    priority?: string;
    assetId?: string;
  }) =>
    (await apiClient.get<AssetMaintenanceRequest[]>('/asset-management/maintenance-requests', { params })).data,

  get: async (id: string) =>
    (await apiClient.get<AssetMaintenanceRequest>(`/asset-management/maintenance-requests/${id}`)).data,

  inspect: async (
    id: string,
    payload: {
      inspectionRemarks?: string;
      status?: 'IN_INSPECTION' | 'PENDING';
    }
  ) =>
    (await apiClient.patch<AssetMaintenanceRequest>(`/asset-management/maintenance-requests/${id}/inspect`, payload)).data,

  updateStatus: async (
    id: string,
    payload: {
      status: string;
      adminRemarks?: string;
    }
  ) =>
    (await apiClient.patch<AssetMaintenanceRequest>(`/asset-management/maintenance-requests/${id}/status`, payload)).data,

  createWorkOrder: async (
    id: string,
    payload: {
      workOrderId?: string;
      vendor?: string;
      startDate?: string;
      cost?: number;
      notes?: string;
    }
  ) =>
    (await apiClient.post<{ request: AssetMaintenanceRequest; workOrder: any }>(
      `/asset-management/maintenance-requests/${id}/create-work-order`,
      payload
    )).data,
};
