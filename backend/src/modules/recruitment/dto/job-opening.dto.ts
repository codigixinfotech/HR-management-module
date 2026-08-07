import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateJobOpeningDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numPositions?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateJobOpeningDto extends PartialType(CreateJobOpeningDto) {}
