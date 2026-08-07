import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSafetyAuditDto {
  @IsString()
  companyId: string;

  @IsString()
  location: string;

  @IsDateString()
  auditDate: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  auditor: string;

  @IsOptional()
  @IsString()
  findings?: string;
}
