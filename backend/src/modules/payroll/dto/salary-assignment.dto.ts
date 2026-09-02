import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class SalaryAssignmentItemDto {
  @IsString()
  salaryComponentId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsNumber()
  monthlyAmount: number;

  @IsOptional()
  @IsNumber()
  annualAmount?: number;

  @IsOptional()
  @IsString()
  calculationType?: string;

  @IsOptional()
  @IsNumber()
  calculationValue?: number;
}

export class CreateSalaryAssignmentDto {
  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsNumber()
  annualCtc: number;

  @IsNumber()
  monthlyCtc: number;

  @IsOptional()
  @IsNumber()
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  netSalary?: number;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, SUBMITTED, APPROVED, ACTIVE, HISTORICAL

  @IsOptional()
  @IsString()
  revisionReason?: string;

  @IsOptional()
  @IsNumber()
  previousCtc?: number;

  @IsOptional()
  @IsNumber()
  newCtc?: number;

  @IsOptional()
  @IsNumber()
  increasePercentage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryAssignmentItemDto)
  details?: SalaryAssignmentItemDto[];
}

export class UpdateSalaryAssignmentDto extends PartialType(CreateSalaryAssignmentDto) {}
