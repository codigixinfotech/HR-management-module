import { PartialType } from '@nestjs/mapped-types';
import { SalaryComponentType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateSalaryComponentDto {
  @IsString()
  companyId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @IsOptional()
  @IsBoolean()
  isStatutory?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSalaryComponentDto extends PartialType(
  CreateSalaryComponentDto,
) {}
