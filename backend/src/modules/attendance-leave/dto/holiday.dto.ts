import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  applicableLocations?: string[];

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsBoolean()
  attendanceOverride?: boolean;

  @IsOptional()
  @IsString()
  payrollImpact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) {}
