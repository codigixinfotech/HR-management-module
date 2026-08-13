import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHrPolicyDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  policyCode: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  esignRequirement?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalEmployees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  signedCount?: number;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateHrPolicyDto {
  @IsOptional()
  @IsString()
  policyCode?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  esignRequirement?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalEmployees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  signedCount?: number;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class CreatePolicyVersionDto {
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  fileSize?: string;

  @IsOptional()
  @IsBoolean()
  esignRequirement?: boolean;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
