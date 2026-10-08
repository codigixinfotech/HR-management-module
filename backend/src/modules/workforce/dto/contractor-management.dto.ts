import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// ==========================================
// 1. Vendor DTOs
// ==========================================
export class CreateContractorVendorDto {
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
  vendorCode!: string;

  @IsNotEmpty()
  @IsString()
  legalName!: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  vendorType?: string; // MANPOWER_AGENCY, SECURITY_AGENCY, FACILITY_MANAGEMENT, HOUSEKEEPING, LOGISTICS, SKILLED_LABOUR, OTHER

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  registeredAddress?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsNotEmpty()
  @IsString()
  primaryContactName!: string;

  @IsNotEmpty()
  @IsString()
  primaryContactPhone!: string;

  @IsNotEmpty()
  @IsString()
  primaryContactEmail!: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, ACTIVE, EXPIRING, SUSPENDED, EXPIRED, TERMINATED

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateContractorVendorDto extends PartialType(CreateContractorVendorDto) {}

export class UpdateVendorStatusDto {
  @IsNotEmpty()
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ==========================================
// 2. Contract DTOs
// ==========================================
export class CreateContractorContractDto {
  @IsNotEmpty()
  @IsString()
  vendorId!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsNotEmpty()
  @IsString()
  contractNumber!: string;

  @IsNotEmpty()
  @IsString()
  contractStartDate!: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  contractEndDate!: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  contractType?: string; // MANPOWER_SUPPLY, SECURITY, HOUSEKEEPING, FACILITY, LOGISTICS, SKILLED_LABOUR, OTHER

  @IsNotEmpty()
  @IsString()
  scopeOfWork!: string;

  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsOptional()
  @IsNumber()
  maximumHeadcount?: number;

  @IsOptional()
  @IsString()
  billingType?: string; // HOURLY, DAILY, MONTHLY, PER_PIECE, FIXED

  @IsOptional()
  @IsNumber()
  billingRate?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, ACTIVE, EXPIRING, EXPIRED, SUSPENDED, TERMINATED, RENEWED

  @IsOptional()
  @IsBoolean()
  renewalRequired?: boolean;

  @IsOptional()
  @IsString()
  renewalDate?: string;

  @IsOptional()
  @IsString()
  contractDocumentId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateContractorContractDto extends PartialType(CreateContractorContractDto) {}

export class RenewContractDto {
  @IsNotEmpty()
  @IsString()
  newEndDate!: string;

  @IsOptional()
  @IsNumber()
  maximumHeadcount?: number;

  @IsOptional()
  @IsNumber()
  billingRate?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ==========================================
// 3. Worker DTOs
// ==========================================
export class CreateContractorWorkerDto {
  @IsNotEmpty()
  @IsString()
  vendorId!: string;

  @IsNotEmpty()
  @IsString()
  contractId!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsNotEmpty()
  @IsString()
  workerCode!: string;

  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsNotEmpty()
  @IsString()
  mobile!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  governmentIdType?: string;

  @IsOptional()
  @IsString()
  governmentIdNumber?: string;

  @IsNotEmpty()
  @IsString()
  joiningDate!: string;

  @IsOptional()
  @IsString()
  exitDate?: string;

  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsNotEmpty()
  @IsString()
  skill!: string;

  @IsOptional()
  @IsString()
  skillLevel?: string; // Unskilled, Semi-Skilled, Skilled, Highly-Skilled, Expert

  @IsOptional()
  @IsString()
  status?: string; // ACTIVE, INACTIVE, ON_LEAVE, EXITED, SUSPENDED

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}

export class UpdateContractorWorkerDto extends PartialType(CreateContractorWorkerDto) {}

// ==========================================
// 4. Deployment DTOs
// ==========================================
export class CreateWorkerDeploymentDto {
  @IsNotEmpty()
  @IsString()
  workerId!: string;

  @IsNotEmpty()
  @IsString()
  vendorId!: string;

  @IsNotEmpty()
  @IsString()
  contractId!: string;

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

  @IsOptional()
  @IsString()
  machineId?: string | null;

  @IsOptional()
  @IsString()
  shiftId?: string | null;

  @IsOptional()
  @IsString()
  shiftName?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  deploymentType?: string; // PLANT_FLOOR, MACHINE_OPERATOR, LINE_ASSEMBLY, LOGISTICS, FACILITY, SECURITY

  @IsNotEmpty()
  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateWorkerDeploymentDto extends PartialType(CreateWorkerDeploymentDto) {}

export class TransferWorkerDeploymentDto {
  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsOptional()
  @IsString()
  productionLineId?: string | null;

  @IsOptional()
  @IsString()
  machineId?: string | null;

  @IsOptional()
  @IsString()
  shiftId?: string | null;

  @IsNotEmpty()
  @IsString()
  transferDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ==========================================
// 5. Compliance DTOs
// ==========================================
export class CreateContractorComplianceDto {
  @IsNotEmpty()
  @IsString()
  vendorId!: string;

  @IsOptional()
  @IsString()
  contractId?: string | null;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsNotEmpty()
  @IsString()
  complianceType!: string; // CLRA, PF, ESIC, GST, LABOUR_LICENSE, INSURANCE, OTHER

  @IsNotEmpty()
  @IsString()
  licenseNumber!: string;

  @IsNotEmpty()
  @IsString()
  issueDate!: string;

  @IsNotEmpty()
  @IsString()
  expiryDate!: string;

  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateContractorComplianceDto extends PartialType(CreateContractorComplianceDto) {}

export class VerifyComplianceDto {
  @IsNotEmpty()
  @IsString()
  status!: string; // VALID, REJECTED, PENDING_VERIFICATION

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ==========================================
// 6. Document DTOs
// ==========================================
export class CreateContractorDocumentDto {
  @IsNotEmpty()
  @IsString()
  vendorId!: string;

  @IsOptional()
  @IsString()
  contractId?: string | null;

  @IsOptional()
  @IsString()
  workerId?: string | null;

  @IsNotEmpty()
  @IsString()
  documentType!: string;

  @IsNotEmpty()
  @IsString()
  documentName!: string;

  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;
}
