import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateProductionLineDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsNotEmpty()
  @IsString()
  lineCode!: string;

  @IsNotEmpty()
  @IsString()
  lineName!: string;

  @IsOptional()
  @IsString()
  lineType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  supervisorId?: string | null;

  @IsOptional()
  @IsString()
  supervisorName?: string | null;

  @IsOptional()
  @IsNumber()
  productionCapacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsNumber()
  workingHours?: number;

  @IsOptional()
  @IsNumber()
  numberOfShifts?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductionLineDto extends PartialType(CreateProductionLineDto) {}

export class CreateMachineDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsOptional()
  @IsString()
  productionLineId?: string | null;

  @IsNotEmpty()
  @IsString()
  machineCode!: string;

  @IsNotEmpty()
  @IsString()
  machineName!: string;

  @IsNotEmpty()
  @IsString()
  machineType!: string;

  @IsOptional()
  @IsString()
  machineCategory?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  assetNumber?: string;

  @IsOptional()
  @IsString()
  workstation?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  capacityUom?: string;

  @IsOptional()
  @IsNumber()
  operatingHours?: number;

  @IsOptional()
  @IsNumber()
  powerRating?: number;

  @IsOptional()
  @IsString()
  powerUom?: string;

  @IsOptional()
  @IsNumber()
  maintenanceFrequencyDays?: number;

  @IsOptional()
  @IsString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  nextMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  documentsJson?: any;
}

export class UpdateMachineDto extends PartialType(CreateMachineDto) {}

export class CreateMachineOperatorDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  employeeId?: string | null;

  @IsOptional()
  @IsString()
  operatorType?: string; // Employee | Contractor

  @IsNotEmpty()
  @IsString()
  operatorName!: string;

  @IsNotEmpty()
  @IsString()
  operatorCode!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsNotEmpty()
  @IsString()
  skill!: string;

  @IsOptional()
  @IsString()
  skillLevel?: string;

  @IsOptional()
  @IsString()
  certification?: string;

  @IsOptional()
  @IsString()
  certificationExpiry?: string;

  @IsOptional()
  @IsString()
  contractorAgency?: string;

  @IsOptional()
  @IsString()
  contractorComplianceStatus?: string;

  @IsOptional()
  @IsString()
  status?: string; // Available | Allocated | On Leave | Inactive

  @IsOptional()
  @IsString()
  currentMachineId?: string | null;

  @IsOptional()
  @IsString()
  currentShift?: string | null;
}

export class UpdateMachineOperatorDto extends PartialType(CreateMachineOperatorDto) {}

export class CreateMachineAllocationDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsNotEmpty()
  @IsString()
  productionLineId!: string;

  @IsNotEmpty()
  @IsString()
  machineId!: string;

  @IsNotEmpty()
  @IsString()
  operatorId!: string;

  @IsOptional()
  @IsString()
  operatorType?: string;

  @IsOptional()
  @IsString()
  supervisorId?: string | null;

  @IsOptional()
  @IsString()
  supervisorName?: string | null;

  @IsNotEmpty()
  @IsString()
  shift!: string;

  @IsNotEmpty()
  @IsString()
  allocationDate!: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  workOrder?: string;

  @IsOptional()
  @IsString()
  operation?: string;

  @IsOptional()
  @IsNumber()
  efficiency?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class StartMachineMaintenanceDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsNotEmpty()
  @IsString()
  machineId!: string;

  @IsOptional()
  @IsString()
  productionLineId?: string;

  @IsNotEmpty()
  @IsString()
  maintenanceType!: string; // Preventive | Corrective | Emergency | Breakdown | Calibration

  @IsOptional()
  @IsString()
  priority?: string; // Low | Medium | High | Critical

  @IsNotEmpty()
  @IsString()
  reason!: string;

  @IsNotEmpty()
  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  expectedCompletionDate?: string;

  @IsNotEmpty()
  @IsString()
  technicianName!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CompleteMachineMaintenanceDto {
  @IsNotEmpty()
  @IsString()
  actualCompletionDate!: string;

  @IsNotEmpty()
  @IsString()
  technicianName!: string;

  @IsNotEmpty()
  @IsString()
  result!: string; // Completed Successfully | Repaired with Observation | etc.

  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
