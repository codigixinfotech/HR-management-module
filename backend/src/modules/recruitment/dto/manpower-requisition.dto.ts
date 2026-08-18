import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateManpowerRequisitionDto {
  @IsOptional()
  @IsString()
  mrNumber?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  manpowerPlanId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  departmentName: string;

  @IsString()
  costCenter: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsString()
  role: string;

  @IsInt()
  @Min(1)
  numOpenings: number;

  @IsDateString()
  joiningDate: string;

  @IsString()
  employmentType: string;

  @IsString()
  priority: string;

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsString()
  qualification: string;

  @IsString()
  experience: string;

  @IsOptional()
  @IsString()
  requiredSkills?: string;

  @IsString()
  workLocation: string;

  @IsOptional()
  @IsString()
  reportingManagerId?: string;

  @IsOptional()
  @IsString()
  requestorName?: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateManpowerRequisitionDto extends PartialType(CreateManpowerRequisitionDto) {}

export class UpdateMrStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
