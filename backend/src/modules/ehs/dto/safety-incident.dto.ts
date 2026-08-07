import { PartialType } from '@nestjs/mapped-types';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSafetyIncidentDto {
  @IsString()
  companyId: string;

  @IsString()
  location: string;

  @IsString()
  incidentType: string;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @IsOptional()
  @IsString()
  reportedById?: string;
}

export class UpdateSafetyIncidentDto extends PartialType(CreateSafetyIncidentDto) {}

export class UpdateSafetyIncidentStatusDto {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @IsOptional()
  @IsString()
  correctiveAction?: string;
}
