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
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

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

  @IsOptional()
  @IsString()
  faceVerificationStatus?: string;

  @IsOptional()
  faceMatchScore?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  ipVerificationStatus?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsString()
  locationVerificationStatus?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  capturedFacePhoto?: string;

  @IsOptional()
  @IsString()
  officeLocation?: string;

  @IsOptional()
  distanceMeters?: number;

  @IsOptional()
  allowedRadiusMeters?: number;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsString()
  punchType?: string;
}

export class UpdateAttendanceDto extends PartialType(MarkAttendanceDto) {}
