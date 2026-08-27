import { apiClient } from '@/lib/api-client';
import type { Asset, AssetMaintenanceRecord } from './types';

export const assetsApi = {
  list: async (companyId?: string) => (await apiClient.get<Asset[]>('/asset-management/assets', { params: { companyId } })).data,
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
  list: async (assetId?: string) =>
    (await apiClient.get<AssetMaintenanceRecord[]>('/asset-management/maintenance', { params: { assetId } })).data,
  create: async (payload: {
    assetId: string;
    issue: string;
    maintenanceType?: string;
    vendor?: string;
    warrantyClaim?: boolean;
    startDate: string;
    cost?: number;
    notes?: string;
  }) => (await apiClient.post<AssetMaintenanceRecord>('/asset-management/maintenance', payload)).data,
  complete: async (
    id: string,
    payload?: {
      completionDate?: string;
      finalCondition?: string;
      actualCost?: number;
      vendor?: string;
      repairNotes?: string;
    }
  ) => (await apiClient.post<AssetMaintenanceRecord>(`/asset-management/maintenance/${id}/complete`, payload)).data,
};
