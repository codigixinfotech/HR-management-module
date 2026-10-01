import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateWeeklyOffPolicyDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  schedulePattern?: any;

  @IsOptional()
  @IsString()
  fixedDay?: string;

  @IsOptional()
  multipleFixedDays?: string[];

  @IsOptional()
  @IsString()
  halfDay?: string;

  @IsOptional()
  @IsString()
  halfDaySession?: string;

  @IsOptional()
  multipleHalfDays?: any[];

  @IsOptional()
  @IsString()
  rotationPattern?: string;

  @IsOptional()
  @IsString()
  rotationOffRule?: string;

  @IsOptional()
  @IsString()
  assignmentSource?: string;

  @IsOptional()
  @IsString()
  alternatePrimaryDay?: string;

  @IsOptional()
  @IsString()
  alternatePattern?: string;

  @IsOptional()
  @IsString()
  alternateSecondaryDay?: string;

  @IsOptional()
  @IsString()
  alternateAction?: string;

  @IsOptional()
  @IsString()
  customDeterminedBy?: string;

  @IsOptional()
  @IsString()
  applicableTo?: string;

  @IsOptional()
  @IsString()
  applicableTarget?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minWorkingDaysPerWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxConsecutiveWorkingDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minWeeklyOffDays?: number;

  @IsOptional()
  @IsBoolean()
  allowOffDaySwap?: boolean;

  @IsOptional()
  @IsBoolean()
  requireApprovalForSwap?: boolean;

  @IsOptional()
  @IsString()
  holidayInteraction?: string;

  @IsOptional()
  @IsBoolean()
  allowOverride?: boolean;

  @IsOptional()
  @IsBoolean()
  reasonRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  auditTrail?: boolean;
}

export class UpdateWeeklyOffPolicyDto extends PartialType(CreateWeeklyOffPolicyDto) {}
