import { PartialType } from '@nestjs/mapped-types';
import { SalaryComponentType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSalaryComponentDto {
  @IsString()
  companyId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  calculationType?: string;

  @IsOptional()
  @IsNumber()
  calculationValue?: number;

  @IsOptional()
  @IsString()
  calculationBase?: string;

  @IsOptional()
  @IsBoolean()
  isStatutory?: boolean;

  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInGross?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInCtc?: boolean;

  @IsOptional()
  @IsBoolean()
  isPfApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  isEsiApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  isPtApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  isTdsApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnPayslip?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSalaryComponentDto extends PartialType(
  CreateSalaryComponentDto,
) {}
