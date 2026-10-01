import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssetMaintenanceRequestDto {
  @IsString({ message: 'Asset is required.' })
  @IsNotEmpty({ message: 'Asset is required.' })
  assetId: string;

  @IsString({ message: 'Issue Title is required.' })
  @IsNotEmpty({ message: 'Issue Title is required.' })
  @MaxLength(200, { message: 'Issue Title cannot exceed 200 characters.' })
  issueTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Issue description cannot exceed 2000 characters.' })
  issueDescription?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Priority must be LOW, MEDIUM, HIGH, or CRITICAL.',
  })
  priority?: string;
}

export class InspectMaintenanceRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Inspection remarks cannot exceed 1000 characters.' })
  inspectionRemarks?: string;

  @IsOptional()
  @IsString()
  @IsIn(['IN_INSPECTION', 'PENDING'], {
    message: 'Status must be IN_INSPECTION or PENDING.',
  })
  status?: string;
}

export class UpdateMaintenanceRequestStatusDto {
  @IsString({ message: 'Status is required.' })
  @IsIn(['PENDING', 'IN_INSPECTION', 'IN_REPAIR', 'COMPLETED', 'REJECTED', 'SENT_BACK'], {
    message: 'Invalid status value.',
  })
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin remarks cannot exceed 1000 characters.' })
  adminRemarks?: string;
}

export class CreateWorkOrderFromRequestDto {
  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
