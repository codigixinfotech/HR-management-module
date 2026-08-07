import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePpeItemDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;
}

export class UpdatePpeItemDto extends PartialType(CreatePpeItemDto) {}

export class IssuePpeDto {
  @IsString()
  employeeId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
