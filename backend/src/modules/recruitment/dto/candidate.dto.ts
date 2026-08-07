import { CandidateStage } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

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
  notes?: string;
}

export class UpdateCandidateStageDto {
  @IsEnum(CandidateStage)
  stage: CandidateStage;
}
