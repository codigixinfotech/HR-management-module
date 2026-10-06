import { apiClient } from '@/lib/api-client';

export interface MachineKPIs {
  totalMachines: number;
  activeMachines: number;
  underMaintenance: number;
  allocatedMachines: number;
  productionLines: number;
  activeOperators: number;
  availableOperators: number;
  avgEfficiency: string;
}

export interface Machine {
  id: string;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  productionLineId?: string | null;
  machineCode: string;
  machineName: string;
  machineType: string;
  machineCategory?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetNumber?: string;
  workstation?: string;
  location?: string;
  capacity?: number;
  capacityUom?: string;
  operatingHours?: number;
  powerRating?: number;
  powerUom?: string;
  maintenanceFrequencyDays?: number;
  maintenanceReminderDays?: number;
  maintenanceReminderSentAt?: string | null;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  calibrationFrequencyDays?: number;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  assignedShifts?: string[];
  mainPhoto?: string;
  angleImages?: Record<string, string>;
  maintenanceDueStatus?: 'NORMAL' | 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE';
  daysDiff?: number | null;
  maintenanceDueLabel?: string;
  qrToken?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED';
  documentsJson?: any;
  createdAt: string;
  updatedAt: string;
  productionLineName?: string;
  productionLineCode?: string;
  branchName?: string;
  departmentName?: string;
  currentOperatorName?: string;
  currentShift?: string;
  currentEfficiency?: string;
  currentAllocationStatus?: string;
  allocations?: MachineAllocation[];
  maintenances?: MachineMaintenance[];
}

export interface MaintenanceDueSummary {
  counts: {
    overdue: number;
    dueToday: number;
    upcoming: number;
    normal: number;
    totalAlerts: number;
  };
  overdue: Machine[];
  dueToday: Machine[];
  upcoming: Machine[];
}

export interface ProductionLine {
  id: string;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  lineCode: string;
  lineName: string;
  lineType?: string;
  location?: string;
  supervisorId?: string | null;
  supervisorName?: string | null;
  productionCapacity?: number;
  capacityUom?: string;
  workingHours?: number;
  numberOfShifts?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description?: string;
  machineCount?: number;
  branchName?: string;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineOperator {
  id: string;
  companyId: string;
  branchId?: string | null;
  employeeId?: string | null;
  operatorType: 'Employee' | 'Contractor';
  operatorName: string;
  operatorCode: string;
  department?: string;
  skill: string;
  skillLevel?: string;
  certification?: string;
  certificationExpiry?: string;
  contractorAgency?: string;
  contractorComplianceStatus?: 'VALID' | 'PENDING' | 'EXPIRED';
  status: 'Available' | 'Allocated' | 'On Leave' | 'Inactive';
  currentMachineId?: string | null;
  currentShift?: string | null;
  currentMachineName?: string;
  currentMachineCode?: string;
  currentLineName?: string;
  branchName?: string;
  employeeEmail?: string;
  employeePhone?: string;
  allocationHistory?: MachineAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineAllocation {
  id: string;
  companyId: string;
  branchId?: string | null;
  productionLineId: string;
  machineId: string;
  operatorId: string;
  operatorType?: string;
  supervisorId?: string | null;
  supervisorName?: string | null;
  shift: string;
  allocationDate: string;
  startTime?: string;
  endTime?: string;
  workOrder?: string;
  operation?: string;
  efficiency?: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED';
  remarks?: string;
  lineName?: string;
  lineCode?: string;
  machineName?: string;
  machineCode?: string;
  machineType?: string;
  operatorName?: string;
  operatorCode?: string;
  operatorSkill?: string;
  branchName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineMaintenance {
  id: string;
  companyId: string;
  branchId?: string | null;
  machineId: string;
  productionLineId?: string | null;
  maintenanceType: 'Preventive' | 'Corrective' | 'Emergency' | 'Breakdown' | 'Calibration';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  technicianName: string;
  status: 'In Progress' | 'Completed' | 'Scheduled' | 'Cancelled';
  result?: string;
  partsReplaced?: string;
  remarks?: string;
  interruptedAllocationId?: string | null;
  machineName?: string;
  machineCode?: string;
  lineName?: string;
  lineCode?: string;
  branchName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const machineManagementApi = {
  // KPIs
  getKpis: async (companyId?: string, branchId?: string) =>
    (await apiClient.get<MachineKPIs>('/workforce/machine-management/kpis', { params: { companyId, branchId } })).data,

  // Machines
  listMachines: async (params?: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    productionLineId?: string;
    machineType?: string;
    status?: string;
    search?: string;
  }) => (await apiClient.get<Machine[]>('/workforce/machines', { params })).data,

  getMachine: async (id: string) =>
    (await apiClient.get<Machine>(`/workforce/machines/${id}`)).data,

  createMachine: async (payload: Partial<Machine>) =>
    (await apiClient.post<Machine>('/workforce/machines', payload)).data,

  updateMachine: async (id: string, payload: Partial<Machine>) =>
    (await apiClient.patch<Machine>(`/workforce/machines/${id}`, payload)).data,

  deleteMachine: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/machines/${id}`)).data,

  // QR Scanning & Token
  scanQrToken: async (qrToken: string) =>
    (await apiClient.get<Machine>(`/workforce/machine-management/scan/${qrToken}`)).data,

  regenerateQrToken: async (id: string) =>
    (await apiClient.post<Machine>(`/workforce/machines/${id}/regenerate-qr`)).data,

  // Maintenance Due Summary
  getMaintenanceDueSummary: async (companyId?: string, branchId?: string) =>
    (await apiClient.get<MaintenanceDueSummary>('/workforce/machine-management/maintenance/due', {
      params: { companyId, branchId },
    })).data,

  // Production Lines
  listProductionLines: async (params?: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  }) => (await apiClient.get<ProductionLine[]>('/workforce/production-lines', { params })).data,

  createProductionLine: async (payload: Partial<ProductionLine>) =>
    (await apiClient.post<ProductionLine>('/workforce/production-lines', payload)).data,

  updateProductionLine: async (id: string, payload: Partial<ProductionLine>) =>
    (await apiClient.patch<ProductionLine>(`/workforce/production-lines/${id}`, payload)).data,

  deleteProductionLine: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/production-lines/${id}`)).data,

  // Operators
  listOperators: async (params?: {
    companyId?: string;
    branchId?: string;
    operatorType?: string;
    skill?: string;
    status?: string;
    search?: string;
  }) => (await apiClient.get<MachineOperator[]>('/workforce/machine-operators', { params })).data,

  getOperator: async (id: string) =>
    (await apiClient.get<MachineOperator>(`/workforce/machine-operators/${id}`)).data,

  createOperator: async (payload: Partial<MachineOperator>) =>
    (await apiClient.post<MachineOperator>('/workforce/machine-operators', payload)).data,

  updateOperator: async (id: string, payload: Partial<MachineOperator>) =>
    (await apiClient.patch<MachineOperator>(`/workforce/machine-operators/${id}`, payload)).data,

  deleteOperator: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/machine-operators/${id}`)).data,

  // Allocations
  listAllocations: async (params?: {
    companyId?: string;
    branchId?: string;
    productionLineId?: string;
    machineId?: string;
    operatorId?: string;
    shift?: string;
    status?: string;
    search?: string;
  }) => (await apiClient.get<MachineAllocation[]>('/workforce/machine-allocations', { params })).data,

  createAllocation: async (payload: Partial<MachineAllocation>) =>
    (await apiClient.post<{ id: string; message: string }>('/workforce/machine-allocations', payload)).data,

  completeAllocation: async (id: string) =>
    (await apiClient.post<{ success: boolean; message: string }>(`/workforce/machine-allocations/${id}/complete`)).data,

  cancelAllocation: async (id: string) =>
    (await apiClient.post<{ success: boolean; message: string }>(`/workforce/machine-allocations/${id}/cancel`)).data,

  deleteAllocation: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/machine-allocations/${id}`)).data,

  // Maintenance
  listMaintenances: async (params?: {
    companyId?: string;
    branchId?: string;
    machineId?: string;
    status?: string;
    search?: string;
  }) => (await apiClient.get<MachineMaintenance[]>('/workforce/machine-maintenances', { params })).data,

  startMaintenance: async (payload: {
    companyId?: string;
    branchId?: string | null;
    machineId: string;
    productionLineId?: string;
    maintenanceType: string;
    priority?: string;
    reason: string;
    startDate: string;
    expectedCompletionDate?: string;
    technicianName: string;
    remarks?: string;
  }) => (await apiClient.post<{ id: string; message: string }>('/workforce/machine-maintenances/start', payload)).data,

  completeMaintenance: async (
    id: string,
    payload: {
      actualCompletionDate: string;
      technicianName: string;
      result: string;
      partsReplaced?: string;
      remarks?: string;
    }
  ) => (await apiClient.post<{ success: boolean; message: string }>(`/workforce/machine-maintenances/${id}/complete`, payload)).data,

  deleteMaintenance: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/machine-maintenances/${id}`)).data,
};

export interface CapacityUomItem {
  id: string;
  companyId?: string | null;
  name: string;
  category: string;
  description?: string | null;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const capacityUomApi = {
  list: async (params?: { companyId?: string; category?: string; search?: string }) =>
    (await apiClient.get<CapacityUomItem[]>('/workforce/capacity-uoms', { params })).data,

  getById: async (id: string) =>
    (await apiClient.get<CapacityUomItem>(`/workforce/capacity-uoms/${id}`)).data,

  create: async (payload: { name: string; category?: string; description?: string; companyId?: string }) =>
    (await apiClient.post<CapacityUomItem>('/workforce/capacity-uoms', payload)).data,

  update: async (id: string, payload: { name?: string; category?: string; description?: string }) =>
    (await apiClient.patch<CapacityUomItem>(`/workforce/capacity-uoms/${id}`, payload)).data,

  delete: async (id: string) =>
    (await apiClient.delete<{ success: boolean; message: string }>(`/workforce/capacity-uoms/${id}`)).data,
};
