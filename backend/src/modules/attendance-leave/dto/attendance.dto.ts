import { PartialType } from '@nestjs/mapped-types';
import { AttendanceStatus } from '@prisma/client';
import { Allow, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsNumber()
  faceMatchScore?: number;

  @IsOptional()
  @Allow()
  liveFaceDescriptor?: number[] | string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  ipVerificationStatus?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
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
  @IsNumber()
  distanceMeters?: number;

  @IsOptional()
  @IsNumber()
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
