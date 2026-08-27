import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateJobOpeningDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  jobFamily?: string;

  @IsOptional()
  @IsString()
  seniorityLevel?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsNumber()
  minExp?: number;

  @IsOptional()
  @IsNumber()
  maxExp?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsNumber()
  numRounds?: number;

  @IsOptional()
  @IsNumber()
  positionsCount?: number;

  @IsOptional()
  @IsString()
  manpowerRequisitionId?: string;

  @IsOptional()
  @IsString()
  requisitionCode?: string;

  @IsOptional()
  @IsString()
  manpowerPlanCode?: string;

  @IsOptional()
  @IsString()
  mrNumber?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numPositions?: number;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsString()
  employmentType?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  candidateType?: string; // FRESHER, EXPERIENCED, BOTH

  @IsOptional()
  @IsNumber()
  minExperience?: number;

  @IsOptional()
  @IsNumber()
  maxExperience?: number;

  @IsOptional()
  @IsString()
  graduationYear?: string;

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  requiredSkills?: string;

  @IsOptional()
  @IsString()
  workLocation?: string;

  @IsOptional()
  @IsString()
  reportingManagerId?: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  hiringManagerId?: string;

  @IsOptional()
  @IsString()
  recruiterId?: string;

  @IsOptional()
  @IsString()
  hrbpId?: string;

  @IsOptional()
  @IsDateString()
  applicationStartDate?: string;

  @IsOptional()
  @IsString()
  jobVisibility?: string;

  @IsOptional()
  @IsString()
  preferredSkills?: string;

  @IsOptional()
  @IsString()
  preferredQualification?: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  interviewProcess?: string;

  @IsOptional()
  @IsInt()
  numInterviewRounds?: number;

  @IsOptional()
  @IsBoolean()
  hasAssessment?: boolean;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  internalJustification?: string;
}

export class UpdateJobOpeningDto extends PartialType(CreateJobOpeningDto) {}
