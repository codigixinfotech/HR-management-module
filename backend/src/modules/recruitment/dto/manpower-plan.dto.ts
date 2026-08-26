import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateManpowerPlanDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsString()
  departmentName: string;

  @IsString()
  costCenter: string;

  @IsString()
  role: string;

  @IsInt()
  @Min(1)
  budgeted: number;

  @IsString()
  quarter: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateManpowerPlanDto extends PartialType(CreateManpowerPlanDto) {}
