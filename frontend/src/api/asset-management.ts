import { apiClient } from '@/lib/api-client';
import type { Asset, AssetMaintenanceRecord } from './types';

export const assetsApi = {
  list: async (companyId?: string) => (await apiClient.get<Asset[]>('/asset-management/assets', { params: { companyId } })).data,
  get: async (id: string) => (await apiClient.get<Asset>(`/asset-management/assets/${id}`)).data,
  create: async (payload: Partial<Asset>) => (await apiClient.post<Asset>('/asset-management/assets', payload)).data,
  update: async (id: string, payload: Partial<Asset>) =>
    (await apiClient.patch<Asset>(`/asset-management/assets/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete(`/asset-management/assets/${id}`)).data,
  allocate: async (id: string, payload: { employeeId: string; remarks?: string }) =>
    (await apiClient.post<Asset>(`/asset-management/assets/${id}/allocate`, payload)).data,
  returnAsset: async (id: string) => (await apiClient.post<Asset>(`/asset-management/assets/${id}/return`)).data,
};

export const assetMaintenanceApi = {
  list: async (assetId?: string) =>
    (await apiClient.get<AssetMaintenanceRecord[]>('/asset-management/maintenance', { params: { assetId } })).data,
  create: async (payload: { assetId: string; issue: string; startDate: string; cost?: number }) =>
    (await apiClient.post<AssetMaintenanceRecord>('/asset-management/maintenance', payload)).data,
  complete: async (id: string) => (await apiClient.post<AssetMaintenanceRecord>(`/asset-management/maintenance/${id}/complete`)).data,
};
