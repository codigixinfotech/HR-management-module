import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssetMaintenanceDto {
  @IsString({ message: 'Asset is required.' })
  assetId: string;

  @IsString({ message: 'Issue / Problem is required.' })
  issue: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  maintenanceType?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsBoolean()
  warrantyClaim?: boolean;

  @IsDateString({}, { message: 'Start Date is required.' })
  startDate: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters.' })
  notes?: string;
}

export class CompleteAssetMaintenanceDto {
  @IsOptional()
  @IsDateString({}, { message: 'Completion Date is invalid.' })
  completionDate?: string;

  @IsOptional()
  @IsString({ message: 'Final Condition is required.' })
  finalCondition?: string;

  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  qcStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Repair notes cannot exceed 500 characters.' })
  repairNotes?: string;
}
