import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateShiftAssignmentDto {
  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsString()
  shiftTypeId: string;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  tier?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  overrideReason?: string;
}

export class UpdateShiftAssignmentDto extends PartialType(
  CreateShiftAssignmentDto,
) {}
