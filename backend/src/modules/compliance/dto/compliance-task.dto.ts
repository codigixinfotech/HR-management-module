import { ComplianceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListComplianceTasksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;
}

export class CreateComplianceTaskDto {
  @IsString()
  companyId: string;

  @IsString()
  complianceTypeId: string;

  @IsString()
  periodLabel: string;

  @IsDateString()
  dueDate: string;
}

export class UpdateComplianceTaskStatusDto {
  @IsEnum(ComplianceStatus)
  status: ComplianceStatus;

  @IsOptional()
  @IsDateString()
  filedDate?: string;

  @IsOptional()
  @IsString()
  filedById?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
