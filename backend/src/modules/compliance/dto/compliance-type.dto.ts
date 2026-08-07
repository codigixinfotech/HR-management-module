import { PartialType } from '@nestjs/mapped-types';
import { ComplianceFrequency } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateComplianceTypeDto {
  @IsString()
  companyId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsEnum(ComplianceFrequency)
  frequency: ComplianceFrequency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateComplianceTypeDto extends PartialType(
  CreateComplianceTypeDto,
) {}
