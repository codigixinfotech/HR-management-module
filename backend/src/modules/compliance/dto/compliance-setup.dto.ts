import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateComplianceSetupDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  establishmentType?: string;

  @IsOptional()
  @IsString()
  financialYear?: string;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  pfApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  esicApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  ptApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  tdsApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  labourComplianceApplicable?: boolean;

  @IsOptional()
  @IsString()
  payrollComplianceFrequency?: string;

  @IsOptional()
  @IsBoolean()
  complianceCalendarEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dueDateNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  complianceValidationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  requireComplianceBeforePayroll?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}

export class UpdateComplianceSetupDto extends CreateComplianceSetupDto {}

