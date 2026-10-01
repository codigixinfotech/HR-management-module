import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateShiftTypeDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @IsOptional()
  @IsNumber()
  workingHours?: number;

  @IsOptional()
  @IsInt()
  lateGraceMinutes?: number;

  @IsOptional()
  @IsInt()
  earlyExitGraceMinutes?: number;

  @IsOptional()
  @IsNumber()
  halfDayThresholdHours?: number;

  @IsOptional()
  @IsBoolean()
  otEligible?: boolean;

  @IsOptional()
  @IsInt()
  otStartsAfterMinutes?: number;

  @IsOptional()
  @IsString()
  weeklyOffDays?: string;

  @IsOptional()
  @IsString()
  holidayHandling?: string;

  @IsOptional()
  @IsString()
  colorTag?: string;

  @IsOptional()
  @IsBoolean()
  isNightShift?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  effectiveFrom?: string;
}

export class UpdateShiftTypeDto extends PartialType(CreateShiftTypeDto) {}

