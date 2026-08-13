import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExitDto {
  @IsString()
  employeeId: string;

  @IsDateString()
  resignationDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  noticePeriodDays?: number;

  @IsDateString()
  lastWorkingDay: string;

  @IsOptional()
  @IsString()
  exitType?: string;

  @IsString()
  exitReason: string;

  @IsOptional()
  @IsString()
  resignationLetterUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class UpdateExitStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;
}

export class AdjustLwdDto {
  @IsDateString()
  adjustedLwd: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  performedBy?: string;
}

export class UpdateClearanceItemDto {
  @IsString()
  status: string; // PENDING, SUBMITTED, VERIFIED, CLEARED

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  verifiedBy?: string;
}

export class SaveExitInterviewDto {
  @IsString()
  primaryReason: string;

  @IsOptional()
  @IsString()
  secondaryReason?: string;

  @IsOptional()
  @IsString()
  managerFeedback?: string;

  @IsOptional()
  @IsString()
  employeeFeedback?: string;

  @IsOptional()
  @IsInt()
  workEnvironmentRating?: number;

  @IsOptional()
  @IsInt()
  compensationRating?: number;

  @IsOptional()
  @IsBoolean()
  recommendCompany?: boolean;

  @IsOptional()
  @IsBoolean()
  rehireEligible?: boolean;

  @IsOptional()
  @IsString()
  hrRemarks?: string;
}

export class SaveFnfSettlementDto {
  @IsOptional()
  @IsNumber()
  salaryPayable?: number;

  @IsOptional()
  @IsNumber()
  leaveEncashment?: number;

  @IsOptional()
  @IsNumber()
  incentives?: number;

  @IsOptional()
  @IsNumber()
  reimbursements?: number;

  @IsOptional()
  @IsNumber()
  noticeRecovery?: number;

  @IsOptional()
  @IsNumber()
  loanAdvanceRecovery?: number;

  @IsOptional()
  @IsNumber()
  assetRecovery?: number;

  @IsOptional()
  @IsNumber()
  otherDeductions?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}
