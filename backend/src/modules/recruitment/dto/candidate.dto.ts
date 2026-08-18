import { CandidateStage } from '@prisma/client';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  jobOpeningId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  currentCompany?: string;

  @IsOptional()
  @IsString()
  currentLocation?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsNumber()
  expectedCtc?: number;

  @IsOptional()
  @IsString()
  noticePeriod?: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCandidateStageDto {
  @IsEnum(CandidateStage)
  stage: CandidateStage;
}
