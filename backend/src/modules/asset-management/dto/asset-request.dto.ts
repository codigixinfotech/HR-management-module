import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum AssetRequestStatusDto {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT_BACK = 'SENT_BACK',
  WAITING_PROCUREMENT = 'WAITING_PROCUREMENT',
  ALLOCATED = 'ALLOCATED',
  CANCELLED = 'CANCELLED',
}

export enum AssetRequestPriorityDto {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
}

export class CreateAssetRequestDto {
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
  employeeId?: string;

  @IsString({ message: 'Asset Category is required.' })
  @IsNotEmpty({ message: 'Asset Category cannot be empty.' })
  category: string;

  @IsOptional()
  @IsString()
  assetType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Specification cannot exceed 1000 characters.' })
  specification?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1.' })
  quantity?: number;

  @IsDateString({}, { message: 'A valid Required Date is required.' })
  requiredDate: string;

  @IsOptional()
  @IsEnum(AssetRequestPriorityDto)
  priority?: AssetRequestPriorityDto;

  @IsString({ message: 'Reason for requesting asset is required.' })
  @MinLength(5, { message: 'Reason must be at least 5 characters.' })
  @MaxLength(1000, { message: 'Reason cannot exceed 1000 characters.' })
  reason: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAssetRequestDto extends PartialType(CreateAssetRequestDto) {}

export class ReviewAssetRequestDto {
  @IsEnum(['APPROVE', 'REJECT', 'SENT_BACK'], { message: 'Action must be APPROVE, REJECT, or SENT_BACK.' })
  action: 'APPROVE' | 'REJECT' | 'SENT_BACK';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AllocateAssetRequestDto {
  @IsString({ message: 'Asset ID to allocate is required.' })
  @IsNotEmpty()
  assetId: string;

  @IsOptional()
  @IsDateString()
  allocationDate?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  allocationNotes?: string;
}
