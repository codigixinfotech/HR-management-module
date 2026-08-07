import { PartialType } from '@nestjs/mapped-types';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkAttendanceDto {
  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAttendanceDto extends PartialType(MarkAttendanceDto) {}
