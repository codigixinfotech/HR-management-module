import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateManualOvertimeDto {
  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsString()
  workedDate: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  dayType?: string; // 'NORMAL WORKDAY' | 'WEEKLY OFF' | 'HOLIDAY'

  @IsOptional()
  @IsString()
  actualIn?: string;

  @IsOptional()
  @IsString()
  actualOut?: string;

  @IsOptional()
  @IsNumber()
  breakMins?: number;

  @IsNumber()
  workedHours: number;

  @IsOptional()
  @IsNumber()
  dailyThreshold?: number;

  @IsNumber()
  hourlyOrdinaryRate: number;

  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @IsOptional()
  @IsString()
  policyName?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateOvertimeStatusDto {
  @IsString()
  status: 'APPROVED' | 'REJECTED' | 'PENDING';

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  payrollStatus?: string;
}

export class CreateOvertimePolicyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  applicableIndustry: string;

  @IsString()
  applicableCategory: string;

  @IsOptional()
  @IsString()
  establishmentType?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @IsOptional()
  @IsNumber()
  dailyThresholdHours?: number;

  @IsOptional()
  @IsNumber()
  weeklyThresholdHours?: number;

  @IsOptional()
  @IsNumber()
  breakDurationMins?: number;

  @IsOptional()
  @IsString()
  breakTreatment?: string;

  @IsOptional()
  @IsNumber()
  otStartsAfterHours?: number;

  @IsOptional()
  @IsNumber()
  minOtDurationMins?: number;

  @IsOptional()
  @IsString()
  roundingRule?: string;

  @IsOptional()
  @IsNumber()
  normalWorkdayMultiplier?: number;

  @IsOptional()
  @IsNumber()
  weeklyOffMultiplier?: number;

  @IsOptional()
  @IsNumber()
  holidayMultiplier?: number;

  @IsOptional()
  @IsNumber()
  nightMultiplier?: number;

  @IsOptional()
  approvalRequired?: boolean;

  @IsOptional()
  @IsString()
  approvalLevel?: string;

  @IsOptional()
  payrollIntegration?: boolean;

  @IsOptional()
  @IsString()
  payrollComponent?: string;

  @IsOptional()
  @IsNumber()
  maxMonthlyOtHours?: number;

  @IsOptional()
  @IsNumber()
  maxDailyOtHours?: number;

  @IsOptional()
  @IsNumber()
  maxWeeklyOtHours?: number;

  @IsOptional()
  @IsString()
  hourlyRateSource?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

