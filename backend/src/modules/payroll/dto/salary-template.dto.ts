import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SalaryTemplateItemDto {
  @IsString()
  salaryComponentId: string;

  @IsOptional()
  @IsString()
  calculationType?: string;

  @IsOptional()
  @IsNumber()
  calculationValue?: number;

  @IsOptional()
  @IsString()
  calculationBase?: string;

  @IsOptional()
  @IsNumber()
  monthlyAmount?: number;

  @IsOptional()
  @IsNumber()
  annualAmount?: number;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateSalaryTemplateDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  gradeCode?: string;

  @IsOptional()
  @IsString()
  gradeName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  payFrequency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryTemplateItemDto)
  items?: SalaryTemplateItemDto[];
}

export class UpdateSalaryTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  gradeCode?: string;

  @IsOptional()
  @IsString()
  gradeName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  payFrequency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryTemplateItemDto)
  items?: SalaryTemplateItemDto[];
}
