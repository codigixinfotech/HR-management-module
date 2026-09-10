import { ApprovalStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListLeaveRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}

export class CreateLeaveRequestDto {
  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  totalDays?: number;

  @IsOptional()
  @IsString()
  duration?: string; // 'FULL_DAY' | 'HALF_DAY' | 'CUSTOM'

  @IsOptional()
  @IsString()
  halfDaySession?: string; // 'FIRST_HALF' | 'SECOND_HALF'

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateLeaveStatusDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsString()
  approverRemarks?: string;
}

export class BulkUpdateLeaveStatusDto {
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsString()
  approverRemarks?: string;
}
