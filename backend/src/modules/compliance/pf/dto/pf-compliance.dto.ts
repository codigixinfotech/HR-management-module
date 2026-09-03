import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';

export enum PfRunStateDto {
  PAYROLL_PENDING = 'PAYROLL_PENDING',
  PF_RUN_CREATED = 'PF_RUN_CREATED',
  CALCULATING = 'CALCULATING',
  CALCULATED = 'CALCULATED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  READY_FOR_ECR = 'READY_FOR_ECR',
  ECR_GENERATED = 'ECR_GENERATED',
  ECR_SUBMITTED = 'ECR_SUBMITTED',
  CHALLAN_CREATED = 'CHALLAN_CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  RECONCILIATION_PENDING = 'RECONCILIATION_PENDING',
  COMPLETED = 'COMPLETED',
}

export class InitiatePfRunDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  period: string; // e.g. "2026-09"
}

export class UpdatePfConfigDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsOptional()
  @IsString()
  establishmentCode?: string;

  @IsOptional()
  @IsString()
  epfoOfficeCode?: string;

  @IsOptional()
  @IsNumber()
  pfWageCeiling?: number;

  @IsOptional()
  @IsNumber()
  epsWageCeiling?: number;

  @IsOptional()
  @IsNumber()
  edliWageCeiling?: number;

  @IsOptional()
  @IsNumber()
  employeePfRate?: number;

  @IsOptional()
  @IsNumber()
  employerEpsRate?: number;

  @IsOptional()
  @IsNumber()
  employerEpfRate?: number;

  @IsOptional()
  @IsNumber()
  edliRate?: number;

  @IsOptional()
  @IsNumber()
  adminRate?: number;

  @IsOptional()
  @IsNumber()
  minAdminCharge?: number;

  @IsOptional()
  @IsNumber()
  epsMaxCap?: number;

  @IsOptional()
  @IsNumber()
  edliMaxCap?: number;

  @IsOptional()
  @IsBoolean()
  edliExempt?: boolean;

  @IsOptional()
  @IsBoolean()
  account22Applicable?: boolean;

  @IsOptional()
  @IsBoolean()
  allowHigherWage?: boolean;

  @IsOptional()
  @IsBoolean()
  restrictEpsOver58?: boolean;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @IsOptional()
  @IsString()
  pfRegNumber?: string;

  @IsOptional()
  @IsBoolean()
  pfApplicable?: boolean;
}

export class RecordTrrnChallanDto {
  @IsString()
  @IsNotEmpty()
  pfRunId: string;

  @IsString()
  @IsNotEmpty()
  trrnNumber: string; // Official 13-digit TRRN issued by EPFO portal

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class RecordPfPaymentDto {
  @IsString()
  @IsNotEmpty()
  pfChallanId: string;

  @IsString()
  @IsNotEmpty()
  utrNumber: string; // Bank UTR Reference

  @IsOptional()
  @IsString()
  crnNumber?: string;

  @IsNumber()
  @Min(0)
  paidAmount: number;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordEpfoSubmissionDto {
  @IsOptional()
  @IsString()
  pfRunId?: string;

  @IsString()
  @IsNotEmpty()
  period: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  trrnNumber: string;

  @IsOptional()
  @IsString()
  challanNo?: string;

  @IsString()
  @IsNotEmpty()
  utrNumber: string;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;
}
